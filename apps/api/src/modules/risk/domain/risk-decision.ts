import { createHash } from 'node:crypto';
import type { CashReservation } from '../../ledger';
import type { OrderIntent } from '../../orders';
import { FinancialDecimal } from '../../financial';
import { stableRiskStringify, type BaselineRiskPolicy } from './risk-policy';

export enum RiskDecisionStatus {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type RiskRuleResult = Readonly<{
  rule: string;
  passed: boolean;
  reason: string | null;
}>;

export type BaselineRiskEvaluationInput = Readonly<{
  orderId: string;
  intent: OrderIntent;
  account: Readonly<{
    id: string;
    workspaceId: string;
    mode: string;
    status: string;
    version: number;
  }> | null;
  session: Readonly<{
    id: string;
    workspaceId: string;
    paperAccountId: string;
    status: string;
    version: number;
    fencingToken: number | null;
    reconciled: boolean;
  }> | null;
  market: Readonly<{
    workspaceId: string;
    streamId: string;
    eventId: string;
    sequence: number;
    instrument: string;
    health: string;
    referencePrice: string;
    occurredAt: string;
    projectionVersion: number;
  }> | null;
  cash: Readonly<{
    workspaceId: string;
    paperAccountId: string;
    currency: string;
    availableCash: string;
    version: number;
    reconciled: boolean;
  }> | null;
  reservation: CashReservation | null;
  position: Readonly<{
    workspaceId: string;
    paperAccountId: string;
    instrument: string;
    availableQuantity: string;
    version: number;
    reconciled: boolean;
  }> | null;
  portfolio: Readonly<{
    workspaceId: string;
    paperAccountId: string;
    checkpointId: string;
    version: number;
    reconciled: boolean;
  }> | null;
  duplicateIntent: boolean;
  unresolvedReconciliation: boolean;
  evaluatedAt: string;
  recordedAt: string;
  actorId: string;
  correlationId?: string;
}>;

export type RiskDecision = Readonly<{
  id: string;
  workspaceId: string;
  orderId: string;
  intentHash: string;
  status: RiskDecisionStatus;
  policyId: string;
  policyVersion: number;
  policyHash: string;
  inputHash: string;
  ruleResults: ReadonlyArray<RiskRuleResult>;
  reasons: ReadonlyArray<string>;
  evaluatedAt: string;
  expiresAt: string;
  recordedAt: string;
  actorId: string;
  correlationId: string | null;
  input: BaselineRiskEvaluationInput;
}>;

export type ApprovedRiskDecisionReference = Readonly<{
  id: string;
  status: RiskDecisionStatus.APPROVED;
  workspaceId: string;
  orderId: string;
  intentHash: string;
  policyId: string;
  policyVersion: number;
  policyHash: string;
  inputHash: string;
  evaluatedAt: string;
  expiresAt: string;
}>;

export function evaluateBaselineRisk(
  policy: BaselineRiskPolicy,
  input: BaselineRiskEvaluationInput,
): RiskDecision {
  assertIso(input.evaluatedAt, 'evaluatedAt');
  assertIso(input.recordedAt, 'recordedAt');
  const rules: RiskRuleResult[] = [];
  const intent = input.intent;
  const marketPrice = decimalOrNull(input.market?.referencePrice);
  const quantity = FinancialDecimal.from(intent.quantity);
  const orderPrice = intent.type === 'limit' ? decimalOrNull(intent.limitPrice) : marketPrice;
  const notional = orderPrice ? quantity.times(orderPrice) : null;

  rule(rules, 'paper_mode', intent.mode === 'paper', 'Order mode must be paper');
  rule(
    rules,
    'workspace_account',
    input.orderId === intent.orderId &&
      input.account?.id === intent.paperAccountId &&
      input.account?.workspaceId === intent.workspaceId &&
      input.account?.mode === 'paper' &&
      input.account?.status === 'active',
    'Paper account or workspace is invalid',
  );
  rule(
    rules,
    'session',
    input.session?.id === intent.tradingSessionId &&
      input.session?.workspaceId === intent.workspaceId &&
      input.session?.paperAccountId === intent.paperAccountId &&
      input.session?.status === 'running' &&
      input.session?.fencingToken === intent.sessionFencingToken &&
      input.session?.reconciled === true,
    'Trading Session is not current, running, owned, and reconciled',
  );
  rule(
    rules,
    'instrument_side_type',
    policy.allowedInstruments.includes(intent.instrument) &&
      policy.allowedSides.includes(intent.side) &&
      policy.allowedOrderTypes.includes(intent.type),
    'Instrument, side, or order type is not allowed by policy',
  );
  rule(
    rules,
    'market_checkpoint',
    input.market?.workspaceId === intent.workspaceId &&
      input.market?.streamId === intent.marketCheckpoint.streamId &&
      input.market?.eventId === intent.marketCheckpoint.eventId &&
      input.market?.sequence === intent.marketCheckpoint.sequence &&
      input.market?.instrument === intent.instrument &&
      input.market?.health === 'healthy' &&
      input.market.projectionVersion > 0 &&
      marketPrice !== null,
    'Market checkpoint is unknown, unhealthy, or does not match the Order Intent',
  );
  rule(
    rules,
    'market_freshness',
    isFresh(input.market?.occurredAt, input.evaluatedAt, policy.maxMarketAgeMs),
    'Market checkpoint is stale or has an invalid domain timestamp',
  );
  rule(
    rules,
    'order_notional',
    notional !== null && notional.compare(policy.maxOrderNotional) <= 0,
    'Order notional is unknown or exceeds policy maximum',
  );
  rule(
    rules,
    'portfolio_checkpoint',
    input.portfolio?.workspaceId === intent.workspaceId &&
      input.portfolio?.paperAccountId === intent.paperAccountId &&
      input.portfolio.version > 0 &&
      input.portfolio.reconciled,
    'Portfolio checkpoint is unknown or unreconciled',
  );
  rule(
    rules,
    'cash_or_reservation',
    cashOrReservationIsValid(input, notional),
    'Available cash or active reservation is insufficient or inconsistent',
  );
  rule(
    rules,
    'position',
    positionIsValid(input, quantity),
    'Sell quantity exceeds the reconciled long Position',
  );
  rule(rules, 'duplicate_guard', !input.duplicateIntent, 'Duplicate intent is already approved');
  rule(
    rules,
    'reconciliation_guard',
    !input.unresolvedReconciliation,
    'Execution or accounting reconciliation is unresolved',
  );

  const semanticInput = Object.freeze({
    orderId: input.orderId,
    intentHash: intent.intentHash,
    account: input.account,
    session: input.session,
    market: input.market,
    cash: input.cash,
    reservation: input.reservation,
    position: input.position,
    portfolio: input.portfolio,
    duplicateIntent: input.duplicateIntent,
    unresolvedReconciliation: input.unresolvedReconciliation,
    evaluatedAt: input.evaluatedAt,
  });
  const inputHash = sha256(stableRiskStringify(semanticInput));
  const reasons = Object.freeze(
    rules.filter((result) => !result.passed).map((result) => result.reason!),
  );
  const status = reasons.length === 0 ? RiskDecisionStatus.APPROVED : RiskDecisionStatus.REJECTED;
  const id = `risk_${sha256(`${policy.hash}:${inputHash}`).slice(0, 24)}`;
  return Object.freeze({
    id,
    workspaceId: intent.workspaceId,
    orderId: input.orderId,
    intentHash: intent.intentHash,
    status,
    policyId: policy.policyId,
    policyVersion: policy.version,
    policyHash: policy.hash,
    inputHash,
    ruleResults: Object.freeze(rules),
    reasons,
    evaluatedAt: input.evaluatedAt,
    expiresAt: new Date(new Date(input.evaluatedAt).getTime() + policy.decisionTtlMs).toISOString(),
    recordedAt: input.recordedAt,
    actorId: required(input.actorId, 'actor id'),
    correlationId: input.correlationId?.trim() || null,
    input: immutableCopy(input),
  });
}

export function approvedRiskDecisionReference(
  decision: RiskDecision,
): ApprovedRiskDecisionReference {
  if (decision.status !== RiskDecisionStatus.APPROVED) {
    throw new Error('rejected Risk Decision cannot approve an Order');
  }
  return Object.freeze({
    id: decision.id,
    status: RiskDecisionStatus.APPROVED,
    workspaceId: decision.workspaceId,
    orderId: decision.orderId,
    intentHash: decision.intentHash,
    policyId: decision.policyId,
    policyVersion: decision.policyVersion,
    policyHash: decision.policyHash,
    inputHash: decision.inputHash,
    evaluatedAt: decision.evaluatedAt,
    expiresAt: decision.expiresAt,
  });
}

function positionIsValid(input: BaselineRiskEvaluationInput, quantity: FinancialDecimal): boolean {
  if (input.intent.side === 'buy') return true;
  const position = input.position;
  const available = decimalOrNull(position?.availableQuantity);
  return (
    position?.workspaceId === input.intent.workspaceId &&
    position.paperAccountId === input.intent.paperAccountId &&
    position.instrument === input.intent.instrument &&
    position.version > 0 &&
    position.reconciled &&
    available !== null &&
    available.compare(quantity) >= 0
  );
}

function cashOrReservationIsValid(
  input: BaselineRiskEvaluationInput,
  notional: FinancialDecimal | null,
): boolean {
  if (input.intent.side === 'sell') return true;
  if (!notional) return false;
  const reservation = input.reservation;
  if (reservation) {
    return (
      reservation.workspaceId === input.intent.workspaceId &&
      reservation.paperAccountId === input.intent.paperAccountId &&
      reservation.orderId === input.orderId &&
      reservation.status === 'active' &&
      FinancialDecimal.from(reservation.amount).compare(notional) >= 0
    );
  }
  const cash = input.cash;
  const available = decimalOrNull(cash?.availableCash);
  return (
    cash?.workspaceId === input.intent.workspaceId &&
    cash.paperAccountId === input.intent.paperAccountId &&
    cash.version > 0 &&
    cash.reconciled &&
    available !== null &&
    available.compare(notional) >= 0
  );
}

function rule(
  target: RiskRuleResult[],
  name: string,
  passed: boolean,
  failureReason: string,
): void {
  target.push(
    Object.freeze({
      rule: name,
      passed,
      reason: passed ? null : failureReason,
    }),
  );
}

function decimalOrNull(value: string | null | undefined): FinancialDecimal | null {
  if (value === null || value === undefined) return null;
  try {
    return FinancialDecimal.from(value).assertNonNegative('Risk input');
  } catch {
    return null;
  }
}

function isFresh(value: string | undefined, evaluatedAt: string, maxAgeMs: number): boolean {
  if (!value) return false;
  const occurred = Date.parse(value);
  const evaluated = Date.parse(evaluatedAt);
  if (!Number.isFinite(occurred) || !Number.isFinite(evaluated)) return false;
  const age = evaluated - occurred;
  return age >= 0 && age <= maxAgeMs;
}

function assertIso(value: string, label: string): void {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${label} must be canonical ISO-8601`);
  }
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === '') throw new Error(`${label} is required`);
  return normalized;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function immutableCopy<T>(value: T): T {
  return deepFreeze(structuredClone(value));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

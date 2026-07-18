import { describe, expect, it } from 'vitest';
import { createOrderIntent, OrderSide, OrderType } from '../../orders';
import {
  RiskDecisionStatus,
  approvedRiskDecisionReference,
  evaluateBaselineRisk,
  type BaselineRiskEvaluationInput,
} from './risk-decision';
import { M2_BASELINE_RISK_POLICY } from './risk-policy';

function input(overrides: Partial<BaselineRiskEvaluationInput> = {}): BaselineRiskEvaluationInput {
  const intent = createOrderIntent({
    clientOrderId: 'client-us165',
    idempotencyKey: 'order-us165',
    workspaceId: 'workspace-us165',
    paperAccountId: 'account-us165',
    tradingSessionId: 'session-us165',
    sessionFencingToken: 3,
    mode: 'paper',
    origin: 'manual',
    instrument: 'BTCUSDT',
    side: OrderSide.BUY,
    type: OrderType.MARKET,
    quantity: '1',
    marketCheckpoint: {
      streamId: 'mark:BTCUSDT',
      sequence: 42,
      eventId: 'market-event-us165',
    },
    actorId: 'trader-us165',
    occurredAt: '2026-07-18T18:30:00.000Z',
    recordedAt: '2026-07-18T18:30:00.100Z',
  });
  return {
    orderId: intent.orderId,
    intent,
    account: {
      id: intent.paperAccountId,
      workspaceId: intent.workspaceId,
      mode: 'paper',
      status: 'active',
      version: 1,
    },
    session: {
      id: intent.tradingSessionId,
      workspaceId: intent.workspaceId,
      paperAccountId: intent.paperAccountId,
      status: 'running',
      version: 3,
      fencingToken: 3,
      reconciled: true,
    },
    market: {
      workspaceId: intent.workspaceId,
      streamId: intent.marketCheckpoint.streamId,
      eventId: intent.marketCheckpoint.eventId,
      sequence: intent.marketCheckpoint.sequence,
      instrument: intent.instrument,
      health: 'healthy',
      referencePrice: '50000',
      occurredAt: '2026-07-18T18:30:00.000Z',
      projectionVersion: 42,
    },
    cash: {
      workspaceId: intent.workspaceId,
      paperAccountId: intent.paperAccountId,
      currency: 'USDT',
      availableCash: '100000',
      version: 7,
      reconciled: true,
    },
    reservation: null,
    position: null,
    portfolio: {
      workspaceId: intent.workspaceId,
      paperAccountId: intent.paperAccountId,
      checkpointId: 'portfolio-us165-v7',
      version: 7,
      reconciled: true,
    },
    duplicateIntent: false,
    unresolvedReconciliation: false,
    evaluatedAt: '2026-07-18T18:30:04.000Z',
    recordedAt: '2026-07-18T18:30:04.100Z',
    actorId: 'risk-engine',
    ...overrides,
  };
}

describe('US165 — mandatory M2 baseline Risk Decision', () => {
  it('approves deterministically against exact immutable checkpoints', () => {
    const first = evaluateBaselineRisk(M2_BASELINE_RISK_POLICY, input());
    const replay = evaluateBaselineRisk(
      M2_BASELINE_RISK_POLICY,
      input({ recordedAt: '2026-07-18T18:30:04.200Z', actorId: 'risk-replay' }),
    );
    expect(first.status).toBe(RiskDecisionStatus.APPROVED);
    expect(replay.id).toBe(first.id);
    expect(replay.inputHash).toBe(first.inputHash);
    expect(first.ruleResults.every((rule) => rule.passed)).toBe(true);
    expect(Object.isFrozen(first.input.market)).toBe(true);
    expect(approvedRiskDecisionReference(first).intentHash).toBe(first.intentHash);
  });

  it('fails closed for stale, unknown, duplicate, or unreconciled inputs', () => {
    const stale = evaluateBaselineRisk(
      M2_BASELINE_RISK_POLICY,
      input({ evaluatedAt: '2026-07-18T18:30:06.000Z' }),
    );
    expect(stale.status).toBe(RiskDecisionStatus.REJECTED);
    expect(stale.reasons).toContain(
      'Market checkpoint is stale or has an invalid domain timestamp',
    );

    const unknown = evaluateBaselineRisk(
      M2_BASELINE_RISK_POLICY,
      input({
        market: null,
        portfolio: null,
        duplicateIntent: true,
        unresolvedReconciliation: true,
      }),
    );
    expect(unknown.status).toBe(RiskDecisionStatus.REJECTED);
    expect(unknown.reasons.length).toBeGreaterThanOrEqual(4);
    expect(() => approvedRiskDecisionReference(unknown)).toThrow(/cannot approve/);
  });

  it('explains policy, ownership, notional, and cash failures without mutation', () => {
    const candidate = input({
      account: {
        id: 'foreign-account',
        workspaceId: 'foreign-workspace',
        mode: 'live',
        status: 'suspended',
        version: 1,
      },
      cash: {
        workspaceId: 'workspace-us165',
        paperAccountId: 'account-us165',
        currency: 'USDT',
        availableCash: '1',
        version: 1,
        reconciled: true,
      },
    });
    const before = structuredClone(candidate);
    const decision = evaluateBaselineRisk(M2_BASELINE_RISK_POLICY, candidate);
    expect(candidate).toEqual(before);
    expect(decision.status).toBe(RiskDecisionStatus.REJECTED);
    expect(decision.ruleResults.find((rule) => rule.rule === 'workspace_account')?.passed).toBe(
      false,
    );
    expect(decision.ruleResults.find((rule) => rule.rule === 'cash_or_reservation')?.passed).toBe(
      false,
    );
  });
});

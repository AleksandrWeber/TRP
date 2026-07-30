import type {
  LeasedRecoverySession,
  ValidatedRecoveryCheckpoint,
} from './recovery-checkpoint-validation';
import type {
  RecoveryAccountingSnapshot,
  RecoveryExecutionSnapshot,
  RecoveryOrderSnapshot,
  RecoveryRiskSnapshot,
  RecoveryRuntimeIntentSnapshot,
} from '../ports/recovery-reconciliation.ports';
import type { TradingSessionStatus } from './trading-session-status';

export type RecoveryReconciliationOutcome = 'RECONCILED' | 'RECONCILIATION_FAILED';

export type ReconciliationFailedContext =
  | 'prerequisite'
  | 'session'
  | 'strategy_runtime'
  | 'orders'
  | 'execution'
  | 'accounting'
  | 'risk'
  | 'missing_state';

export type RecoverySessionSnapshot = Readonly<{
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  paperAccountId: string;
  status: TradingSessionStatus;
  fencingToken: number | null;
}>;

export type RecoveryRuntimeSnapshot = Readonly<{
  checkpointEventId: string;
  checkpointStreamId: string;
  checkpointSequence: number;
  deploymentId: string;
  intents: readonly RecoveryRuntimeIntentSnapshot[];
}>;

export type RecoveryStateReconciliationInput = Readonly<{
  leased: LeasedRecoverySession;
  checkpoint: ValidatedRecoveryCheckpoint;
  session: RecoverySessionSnapshot | null;
  runtime: RecoveryRuntimeSnapshot;
  orders: readonly RecoveryOrderSnapshot[];
  execution: readonly RecoveryExecutionSnapshot[];
  accounting: RecoveryAccountingSnapshot | null;
  risk: RecoveryRiskSnapshot | null;
}>;

export type RecoveryStateReconciliationResult = Readonly<{
  outcome: RecoveryReconciliationOutcome;
  failedContext: ReconciliationFailedContext | null;
  reason: string;
  sessionId: string;
  workspaceId: string;
  recoveryPointEventId: string;
  mismatches: readonly string[];
}>;

const CONTEXT_PRIORITY: readonly ReconciliationFailedContext[] = [
  'prerequisite',
  'missing_state',
  'session',
  'strategy_runtime',
  'orders',
  'execution',
  'accounting',
  'risk',
];

/**
 * Pure, deterministic recovery reconciliation (US243).
 * Read-only: does not mutate Session, Orders, Execution, Accounting, or Runtime.
 */
export function reconcileRecoveryState(
  input: RecoveryStateReconciliationInput,
): RecoveryStateReconciliationResult {
  const { leased, checkpoint } = input;
  const base = {
    sessionId: leased.sessionId,
    workspaceId: leased.workspaceId,
    recoveryPointEventId: checkpoint.lastProcessedEventId,
  };

  const findings: Array<{ context: ReconciliationFailedContext; detail: string }> = [];

  if (
    checkpoint.sessionId !== leased.sessionId ||
    checkpoint.workspaceId !== leased.workspaceId ||
    checkpoint.deploymentId !== leased.deploymentId
  ) {
    findings.push({
      context: 'prerequisite',
      detail: 'checkpoint identity does not match leased recovery session',
    });
  }

  if (input.session === null) {
    findings.push({ context: 'missing_state', detail: 'trading session row missing' });
  } else {
    compareSession(leased, checkpoint, input.session, findings);
  }

  compareRuntime(leased, checkpoint, input.runtime, findings);
  compareOrders(leased, input.session, input.orders, findings);
  compareExecution(input.orders, input.execution, findings);
  compareAccounting(input.accounting, findings);
  compareRisk(leased, input.risk, findings);

  if (findings.length === 0) {
    return Object.freeze({
      outcome: 'RECONCILED',
      failedContext: null,
      reason: 'all participating contexts agree on recovery point',
      ...base,
      mismatches: Object.freeze([] as string[]),
    });
  }

  const sorted = sortFindings(findings);
  const first = sorted[0]!;
  return Object.freeze({
    outcome: 'RECONCILIATION_FAILED',
    failedContext: first.context,
    reason: first.detail,
    ...base,
    mismatches: Object.freeze(sorted.map((f) => `${f.context}:${f.detail}`)),
  });
}

function compareSession(
  leased: LeasedRecoverySession,
  checkpoint: ValidatedRecoveryCheckpoint,
  session: RecoverySessionSnapshot,
  findings: Array<{ context: ReconciliationFailedContext; detail: string }>,
): void {
  if (session.sessionId !== leased.sessionId || session.workspaceId !== leased.workspaceId) {
    findings.push({ context: 'session', detail: 'session identity mismatch' });
  }
  if (session.deploymentId !== leased.deploymentId) {
    findings.push({ context: 'session', detail: 'session deployment mismatch' });
  }
  if (session.deploymentId !== checkpoint.deploymentId) {
    findings.push({ context: 'session', detail: 'session/checkpoint deployment mismatch' });
  }
  if (!session.paperAccountId.trim()) {
    findings.push({ context: 'session', detail: 'session missing paperAccountId' });
  }
  if (session.fencingToken !== leased.fencingToken) {
    findings.push({ context: 'session', detail: 'session fencing token mismatch' });
  }
}

function compareRuntime(
  leased: LeasedRecoverySession,
  checkpoint: ValidatedRecoveryCheckpoint,
  runtime: RecoveryRuntimeSnapshot,
  findings: Array<{ context: ReconciliationFailedContext; detail: string }>,
): void {
  if (runtime.deploymentId !== leased.deploymentId) {
    findings.push({ context: 'strategy_runtime', detail: 'runtime deployment mismatch' });
  }
  if (runtime.checkpointEventId !== checkpoint.lastProcessedEventId) {
    findings.push({
      context: 'strategy_runtime',
      detail: 'runtime checkpoint event mismatch',
    });
  }
  if (
    runtime.checkpointStreamId !== checkpoint.streamId ||
    runtime.checkpointSequence !== checkpoint.sequence
  ) {
    findings.push({
      context: 'strategy_runtime',
      detail: 'runtime checkpoint stream/sequence mismatch',
    });
  }

  for (const intent of [...runtime.intents].sort((a, b) => a.intentId.localeCompare(b.intentId))) {
    if (intent.sessionId !== leased.sessionId) {
      findings.push({
        context: 'strategy_runtime',
        detail: `intent ${intent.intentId} session mismatch`,
      });
    }
    if (intent.deploymentId !== leased.deploymentId) {
      findings.push({
        context: 'strategy_runtime',
        detail: `intent ${intent.intentId} deployment mismatch`,
      });
    }
    if (intent.streamId === checkpoint.streamId && intent.sequence > checkpoint.sequence) {
      findings.push({
        context: 'strategy_runtime',
        detail: `intent ${intent.intentId} ahead of checkpoint`,
      });
    }
  }
}

function compareOrders(
  leased: LeasedRecoverySession,
  session: RecoverySessionSnapshot | null,
  orders: readonly RecoveryOrderSnapshot[],
  findings: Array<{ context: ReconciliationFailedContext; detail: string }>,
): void {
  const sorted = [...orders].sort((a, b) => a.orderId.localeCompare(b.orderId));
  for (const order of sorted) {
    if (order.tradingSessionId !== leased.sessionId) {
      findings.push({
        context: 'orders',
        detail: `order ${order.orderId} session mismatch`,
      });
    }
    if (session && order.paperAccountId !== session.paperAccountId) {
      findings.push({
        context: 'orders',
        detail: `order ${order.orderId} paper account mismatch`,
      });
    }
  }
}

function compareExecution(
  orders: readonly RecoveryOrderSnapshot[],
  execution: readonly RecoveryExecutionSnapshot[],
  findings: Array<{ context: ReconciliationFailedContext; detail: string }>,
): void {
  const orderIds = new Set(orders.map((o) => o.orderId));
  const sorted = [...execution].sort((a, b) => a.orderId.localeCompare(b.orderId));
  for (const exec of sorted) {
    if (!orderIds.has(exec.orderId)) {
      findings.push({
        context: 'execution',
        detail: `execution snapshot for unknown order ${exec.orderId}`,
      });
    }
    if (exec.reconciliationRequired) {
      findings.push({
        context: 'execution',
        detail: `order ${exec.orderId} requires execution reconciliation`,
      });
    }
  }
}

function compareAccounting(
  accounting: RecoveryAccountingSnapshot | null,
  findings: Array<{ context: ReconciliationFailedContext; detail: string }>,
): void {
  if (accounting === null) {
    findings.push({ context: 'missing_state', detail: 'accounting snapshot missing' });
    return;
  }
  if (accounting.status === 'unknown') {
    findings.push({ context: 'missing_state', detail: 'accounting status unknown' });
    return;
  }
  if (accounting.status === 'mismatch') {
    findings.push({
      context: 'accounting',
      detail: accounting.reason?.trim() || 'accounting projection mismatch',
    });
  }
}

function compareRisk(
  leased: LeasedRecoverySession,
  risk: RecoveryRiskSnapshot | null,
  findings: Array<{ context: ReconciliationFailedContext; detail: string }>,
): void {
  if (risk === null) {
    return;
  }
  const sorted = [...risk.decisions].sort((a, b) => a.orderId.localeCompare(b.orderId));
  for (const decision of sorted) {
    if (decision.sessionId !== leased.sessionId) {
      findings.push({
        context: 'risk',
        detail: `risk decision for order ${decision.orderId} session mismatch`,
      });
    }
  }
}

function sortFindings(
  findings: Array<{ context: ReconciliationFailedContext; detail: string }>,
): Array<{ context: ReconciliationFailedContext; detail: string }> {
  return findings.slice().sort((a, b) => {
    const byContext = CONTEXT_PRIORITY.indexOf(a.context) - CONTEXT_PRIORITY.indexOf(b.context);
    if (byContext !== 0) return byContext;
    return a.detail.localeCompare(b.detail);
  });
}

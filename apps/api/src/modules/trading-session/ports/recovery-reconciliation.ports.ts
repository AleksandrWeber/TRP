/**
 * Read-only recovery reconciliation ports (US243).
 *
 * Defined inside Trading Session so Session never imports Orders/Risk/Execution/
 * Accounting persistence. Adapters bind this Symbol at the composition root
 * without violating Session boundary rules.
 */

export const RECOVERY_RECONCILIATION_PORTS = Symbol('RECOVERY_RECONCILIATION_PORTS');

export type RecoveryOrderSnapshot = Readonly<{
  orderId: string;
  status: string;
  tradingSessionId: string;
  paperAccountId: string;
  /** True when Order is non-terminal / uncertain for recovery. */
  openOrUncertain: boolean;
}>;

export type RecoveryExecutionSnapshot = Readonly<{
  orderId: string;
  status: string;
  terminal: boolean;
  fillCount: number;
  reconciliationRequired: boolean;
}>;

export type RecoveryAccountingSnapshot = Readonly<{
  status: 'consistent' | 'mismatch' | 'unknown';
  sourceHash: string | null;
  rebuiltHash: string | null;
  reason: string | null;
}>;

export type RecoveryRiskSnapshot = Readonly<{
  /** null = Kill Switch read unavailable (optional for Stage 3). */
  killSwitchActive: boolean | null;
  decisions: ReadonlyArray<Readonly<{ orderId: string; status: string; sessionId: string }>>;
}>;

export type RecoveryRuntimeIntentSnapshot = Readonly<{
  intentId: string;
  sessionId: string;
  deploymentId: string;
  eventId: string;
  streamId: string;
  sequence: number;
}>;

/**
 * Cross-context read facade for recovery reconciliation.
 * All methods must be side-effect free (no Order/Accounting mutations).
 */
export interface RecoveryReconciliationPorts {
  listOrdersBySession(workspaceId: string, sessionId: string): Promise<RecoveryOrderSnapshot[]>;

  reconcileExecution(workspaceId: string, orderId: string): Promise<RecoveryExecutionSnapshot>;

  /** Read-only accounting consistency view (must not mutate Ledger/Positions). */
  readAccounting(
    workspaceId: string,
    paperAccountId: string,
  ): Promise<RecoveryAccountingSnapshot | null>;

  readRisk(workspaceId: string, sessionId: string): Promise<RecoveryRiskSnapshot | null>;
}

/**
 * Default stub: empty foreign-context views.
 * Safe for unit tests and bootstrap until real adapters are wired.
 */
export class StubRecoveryReconciliationPorts implements RecoveryReconciliationPorts {
  async listOrdersBySession(): Promise<RecoveryOrderSnapshot[]> {
    return [];
  }

  async reconcileExecution(
    _workspaceId: string,
    orderId: string,
  ): Promise<RecoveryExecutionSnapshot> {
    return Object.freeze({
      orderId,
      status: 'unknown',
      terminal: true,
      fillCount: 0,
      reconciliationRequired: false,
    });
  }

  async readAccounting(): Promise<RecoveryAccountingSnapshot | null> {
    return Object.freeze({
      status: 'consistent',
      sourceHash: null,
      rebuiltHash: null,
      reason: null,
    });
  }

  async readRisk(): Promise<RecoveryRiskSnapshot | null> {
    return Object.freeze({
      killSwitchActive: null,
      decisions: [],
    });
  }
}

/**
 * V3-L02-S-UNK1 — Technical submission / reconciliation phase (AD-L02-07/11).
 * Distinct from business OrderStatus. Claim ≠ submit; pre-send ≠ venue acceptance.
 */

export enum SubmissionPhase {
  NONE = 'none',
  READY_TO_TRANSMIT = 'ready_to_transmit',
  TRANSMITTED = 'transmitted',
  COMPLETED = 'completed',
}

export function isSubmissionPhase(value: string): value is SubmissionPhase {
  return Object.values(SubmissionPhase).includes(value as SubmissionPhase);
}

export const DEFAULT_ORDER_EXECUTION_STATE = Object.freeze({
  submissionPhase: SubmissionPhase.NONE,
  readyToTransmitAt: null,
  transmittedAt: null,
  completedAt: null,
  reconciliationRequired: false,
  unknownEnteredAt: null,
  lastReconcileAt: null,
  reconcileAttempts: 0,
  venueClientOrderId: null,
  venueOrderId: null,
  humanStartProofId: null,
  lastReconcileResult: null,
  ambiguityReason: null,
}) satisfies OrderExecutionState;

export type OrderExecutionState = Readonly<{
  submissionPhase: SubmissionPhase;
  readyToTransmitAt: string | null;
  transmittedAt: string | null;
  completedAt: string | null;
  reconciliationRequired: boolean;
  unknownEnteredAt: string | null;
  lastReconcileAt: string | null;
  reconcileAttempts: number;
  venueClientOrderId: string | null;
  venueOrderId: string | null;
  humanStartProofId: string | null;
  lastReconcileResult: string | null;
  ambiguityReason: string | null;
}>;

/**
 * Authoritative simulated or venue-sourced evidence for resolving UNKNOWN.
 * Unresolved evidence MUST leave status UNKNOWN (no inferred rejection/cancel/success).
 */
export type OrderReconciliationEvidence =
  | Readonly<{ kind: 'unresolved'; reason?: string }>
  | Readonly<{
      kind: 'acknowledged';
      venueOrderId?: string | null;
      adapterOrderId?: string | null;
    }>
  | Readonly<{ kind: 'rejected'; reason: string }>
  | Readonly<{
      kind: 'filled';
      fillQuantity: string;
      venueOrderId?: string | null;
      adapterOrderId?: string | null;
    }>
  | Readonly<{ kind: 'cancelled' }>;

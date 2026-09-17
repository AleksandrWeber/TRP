/**
 * PROPOSED-V3-L01-S04 — Session-local Gate consumption port.
 *
 * Defined inside Trading Session so Session never imports Runtime Enforcement
 * (RC-23 / RC-28 dependency direction). Production adapter binds at the
 * composition root (`LiveAdmissionGatePortsModule`).
 *
 * Consumes canonical Gate semantics — does not create a second Gate.
 */

export const LIVE_ADMISSION_GATE_PORT = Symbol('LIVE_ADMISSION_GATE_PORT');

/** Minimal Gate request fields required for live admission (session_start). */
export type LiveAdmissionGateRequest = Readonly<{
  workspaceId: string;
  tradingSessionId: string;
  requestedAt: string;
  libraryEntryId?: string;
  strategyFamilyId?: string;
  strategyVersion?: string;
  exchangeScopeId?: string;
  tacticPoint?: Readonly<Record<string, unknown>>;
}>;

/**
 * Gate decision projection for admission mapping.
 * Mirrors EnforcementDecision outcome/validation without importing Enforcement.
 */
export type LiveAdmissionGateDecision = Readonly<{
  outcome: 'pass' | 'fail';
  validation: 'VALID' | 'INVALID';
}>;

/**
 * Fail-closed Gate consumer for live admission.
 * Soft-fail is forbidden. Unexpected failures should throw (service maps to unavailable).
 */
export interface LiveAdmissionGatePort {
  validateForLiveAdmission(request: LiveAdmissionGateRequest): LiveAdmissionGateDecision;
}

/**
 * Test double / missing-binding sentinel — always fails closed.
 * Must not be the production binding (composition root binds real Gate).
 */
export class UnavailableLiveAdmissionGatePort implements LiveAdmissionGatePort {
  validateForLiveAdmission(_request: LiveAdmissionGateRequest): LiveAdmissionGateDecision {
    return Object.freeze({
      outcome: 'fail' as const,
      validation: 'INVALID' as const,
    });
  }
}

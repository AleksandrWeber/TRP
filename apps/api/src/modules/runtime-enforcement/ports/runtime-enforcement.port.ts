/**
 * RC-23 — Runtime Enforcement application ports.
 *
 * Activation schedule:
 * - libraryLookup / libraryEligibility consumption → Epic 2 (active)
 * - validateDeployment → Epic 3 (active)
 *
 * Contract: docs/project/rc-23-api-contract.md
 */

/** Nest injection token for RuntimeEnforcementPort (Epic 3+). */
export const RUNTIME_ENFORCEMENT_PORT = Symbol('RUNTIME_ENFORCEMENT_PORT');

/** Enforcement purpose — correlation context only. */
export type EnforcementPurpose = 'deployment_bind' | 'session_start';

/** Logical validate-deployment request (API Contract §4.2). */
export type ValidateDeploymentRequest = Readonly<{
  workspaceId: string;
  strategyFamilyId?: string;
  strategyVersion?: string;
  libraryEntryId?: string;
  exchangeScopeId?: string;
  tacticPoint?: Readonly<Record<string, unknown>>;
  purpose: EnforcementPurpose;
  tradingSessionId?: string;
  requestedAt?: string;
}>;

/** Machine-readable rejection reason codes (Enforcement Contract §6). */
export type EnforcementReasonCode =
  | 'strategy_not_found'
  | 'strategy_version_not_found'
  | 'identity_ambiguous'
  | 'certification_missing'
  | 'certification_not_admitted'
  | 'certification_not_active'
  | 'certification_deprecated'
  | 'certification_archived'
  | 'eligibility_missing'
  | 'eligibility_ineligible'
  | 'envelope_missing'
  | 'envelope_not_immutable'
  | 'scope_not_allowed'
  | 'envelope_violation'
  | 'workspace_mismatch';

/** Gate decision (API Contract §4.3). VALID ≡ pass · INVALID ≡ fail. */
export type EnforcementDecision = Readonly<{
  outcome: 'pass' | 'fail';
  /** Epic/product synonym for outcome (VALID ≡ pass, INVALID ≡ fail). */
  validation: 'VALID' | 'INVALID';
  reasons: readonly EnforcementReasonCode[];
  libraryEntryId?: string;
  certificationStatus?: string;
  eligibilityOutcome?: 'eligible' | 'ineligible' | 'unknown';
  checkedAt: string;
}>;

/**
 * Runtime Enforcement Gate port.
 *
 * Epic 3: validateDeployment sequence active.
 *
 * Must not write Library SoT. Must not select strategies.
 * Soft-fail is forbidden. Expected failures return INVALID — do not throw.
 */
export interface RuntimeEnforcementPort {
  validateDeployment(cmd: ValidateDeploymentRequest): EnforcementDecision;
}

/**
 * Library Lookup consumption surface (RC-22 port; consume only).
 * Epic 2+: wired to STRATEGY_LIBRARY_LOOKUP_PORT.
 */
export const STRATEGY_LIBRARY_LOOKUP_CONSUMER = Symbol('STRATEGY_LIBRARY_LOOKUP_CONSUMER');

/**
 * Library Eligibility consumption surface (RC-22 port; consume only).
 * Epic 2+: wired to STRATEGY_LIBRARY_ELIGIBILITY_PORT.
 */
export const STRATEGY_LIBRARY_ELIGIBILITY_CONSUMER = Symbol(
  'STRATEGY_LIBRARY_ELIGIBILITY_CONSUMER',
);

/** Epic 3 Gate + PC-04 REST product transport. Persistence remains process-local history only. */
export const RUNTIME_ENFORCEMENT_PORTS_ACTIVE = Object.freeze({
  validateDeployment: true,
  libraryLookup: true,
  libraryEligibility: true,
  persistence: false,
  rest: true,
} as const);

/**
 * RC-22 / RC-23 — Strategy Library Eligibility Port (read-only check).
 *
 * Application read surface for StrategyEligibility decisions.
 * Activated for Runtime Enforcement consumption in RC-23 Epic 2.
 *
 * Contract: docs/project/rc-22-api-contract.md §7
 * Consumer: docs/project/rc-23-api-contract.md §5.2
 *
 * Forbidden by design (do not add):
 * - certify / mutate eligibility SoT writes from consumers
 * - Knowledge Lake as authority
 * - risk approval / session start / order submission
 */

import type { EligibilityReasonCode, EligibilityTacticPoint } from '../domain/strategy-eligibility';
import type { LibraryMembershipStatus } from './strategy-library-lookup.port';

export const STRATEGY_LIBRARY_ELIGIBILITY_PORT = Symbol('STRATEGY_LIBRARY_ELIGIBILITY_PORT');

export type EligibilityPurpose = 'deployment_bind' | 'session_arm' | 'selection';

export type EligibilityQuery = Readonly<{
  libraryEntryId: string;
  workspaceId: string;
  exchangeScopeId?: string;
  tacticPoint?: EligibilityTacticPoint;
  purpose?: EligibilityPurpose;
}>;

export type EligibilityDecision = Readonly<{
  outcome: 'eligible' | 'ineligible';
  reasons: readonly (EligibilityReasonCode | 'unknown_entry' | 'workspace_mismatch')[];
  status: LibraryMembershipStatus | 'unknown';
  checkedAt: string;
  libraryEntryId: string | null;
  eligibilityId: string | null;
}>;

/**
 * Read-only Strategy Library eligibility check interface.
 */
export interface StrategyLibraryEligibilityPort {
  checkEligibility(query: EligibilityQuery): EligibilityDecision;
}

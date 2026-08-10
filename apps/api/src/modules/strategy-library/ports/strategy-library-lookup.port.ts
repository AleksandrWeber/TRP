/**
 * RC-22 / RC-23 — Strategy Library Lookup Port (read-only).
 *
 * Application read surface for certified StrategyVersion facts.
 * Activated for Runtime Enforcement consumption in RC-23 Epic 2.
 *
 * Contract: docs/project/rc-22-api-contract.md §6
 * Consumer: docs/project/rc-23-api-contract.md §5.1
 *
 * Forbidden by design (do not add):
 * - register / certify / deprecate / archive writes
 * - Knowledge Lake as authority
 * - REST / persistence product
 */

import type { LibraryTacticalEnvelope } from '../domain/library-tactical-envelope';
import type { Strategy } from '../domain/strategy';
import type { StrategyCertification } from '../domain/strategy-certification';
import type { StrategyEligibility } from '../domain/strategy-eligibility';
import type { StrategyVersion } from '../domain/strategy-version';

export const STRATEGY_LIBRARY_LOOKUP_PORT = Symbol('STRATEGY_LIBRARY_LOOKUP_PORT');

/** Library membership status as exposed on read models. */
export type LibraryMembershipStatus = 'uncertified' | 'certified' | 'deprecated' | 'archived';

/**
 * Immutable Strategy Library lookup record (SoT read model).
 * Assembles Strategy + Version + Certification + Eligibility + Envelope.
 * Never a local Enforcement cache — always Library-owned facts.
 */
export type StrategyVersionRecord = Readonly<{
  authorityClass: 'source_of_truth';
  strategy: Strategy;
  version: StrategyVersion;
  certification: StrategyCertification | null;
  eligibility: StrategyEligibility | null;
  tacticalEnvelope: LibraryTacticalEnvelope | null;
  /** Derived from certification.status (active → certified). */
  membershipStatus: LibraryMembershipStatus;
}>;

export type LibraryListQuery = Readonly<{
  workspaceId: string;
  strategyFamilyId?: string;
  statuses?: readonly LibraryMembershipStatus[];
  exchangeScopeId?: string;
  includeArchived?: boolean;
  limit?: number;
  cursor?: string;
}>;

export type StrategyVersionPage = Readonly<{
  items: readonly StrategyVersionRecord[];
  nextCursor: string | null;
  authorityClass: 'source_of_truth';
}>;

/**
 * Read-only Strategy Library lookup interface.
 */
export interface StrategyLibraryLookupPort {
  getByLibraryEntryId(libraryEntryId: string): StrategyVersionRecord | null;
  getByFamilyVersion(strategyFamilyId: string, version: string): StrategyVersionRecord | null;
  list(query: LibraryListQuery): StrategyVersionPage;
}

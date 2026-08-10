/**
 * RC-23 Epic 2+ — Runtime Enforcement Library read consumer.
 *
 * Thin read-only facade over Strategy Library Lookup + Eligibility ports.
 * No Session / Deployment hooks. No Library writes.
 *
 * No caching. No local SoT copies — every call delegates to Library ports.
 */

import { Inject, Injectable } from '@nestjs/common';
import type {
  EligibilityDecision,
  EligibilityQuery,
  StrategyLibraryEligibilityPort,
} from '../strategy-library/ports/strategy-library-eligibility.port';
import type {
  StrategyLibraryLookupPort,
  StrategyVersionRecord,
} from '../strategy-library/ports/strategy-library-lookup.port';
import {
  STRATEGY_LIBRARY_ELIGIBILITY_CONSUMER,
  STRATEGY_LIBRARY_LOOKUP_CONSUMER,
} from './ports/runtime-enforcement.port';

@Injectable()
export class RuntimeEnforcementLibraryReadService {
  constructor(
    @Inject(STRATEGY_LIBRARY_LOOKUP_CONSUMER)
    private readonly lookup: StrategyLibraryLookupPort,
    @Inject(STRATEGY_LIBRARY_ELIGIBILITY_CONSUMER)
    private readonly eligibility: StrategyLibraryEligibilityPort,
  ) {}

  /** Resolve Library SoT record by entry id. Null when missing. */
  getByLibraryEntryId(libraryEntryId: string): StrategyVersionRecord | null {
    return this.lookup.getByLibraryEntryId(libraryEntryId);
  }

  /** Resolve Library SoT record by family + version. Null when missing. */
  getByFamilyVersion(strategyFamilyId: string, version: string): StrategyVersionRecord | null {
    return this.lookup.getByFamilyVersion(strategyFamilyId, version);
  }

  /**
   * True when any Library entry exists for the family in the workspace.
   * Used by the Gate to distinguish strategy_not_found vs strategy_version_not_found.
   */
  familyExistsInWorkspace(workspaceId: string, strategyFamilyId: string): boolean {
    const page = this.lookup.list({
      workspaceId,
      strategyFamilyId,
      includeArchived: true,
      statuses: ['uncertified', 'certified', 'deprecated', 'archived'],
    });
    return page.items.length > 0;
  }

  /**
   * Read Strategy / Version / Certification / Eligibility / Envelope facts
   * for a Library entry. Convenience accessors — no gate decision.
   */
  readLibraryFacts(libraryEntryId: string): {
    found: boolean;
    record: StrategyVersionRecord | null;
    strategy: StrategyVersionRecord['strategy'] | null;
    version: StrategyVersionRecord['version'] | null;
    certification: StrategyVersionRecord['certification'];
    eligibility: StrategyVersionRecord['eligibility'];
    tacticalEnvelope: StrategyVersionRecord['tacticalEnvelope'];
  } {
    const record = this.lookup.getByLibraryEntryId(libraryEntryId);
    if (!record) {
      return {
        found: false,
        record: null,
        strategy: null,
        version: null,
        certification: null,
        eligibility: null,
        tacticalEnvelope: null,
      };
    }
    return {
      found: true,
      record,
      strategy: record.strategy,
      version: record.version,
      certification: record.certification,
      eligibility: record.eligibility,
      tacticalEnvelope: record.tacticalEnvelope,
    };
  }

  /** Library eligibility check (read). Does not emit Enforcement PASS/FAIL. */
  checkEligibility(query: EligibilityQuery): EligibilityDecision {
    return this.eligibility.checkEligibility(query);
  }
}

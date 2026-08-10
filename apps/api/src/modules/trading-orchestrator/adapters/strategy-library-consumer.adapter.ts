/**
 * RC-26 Epic 5 — Strategy Library consumer adapter.
 *
 * Delegates Lookup + Eligibility to RC-22 ports. Never certifies.
 * Never invents strategies or envelope points.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  STRATEGY_LIBRARY_ELIGIBILITY_PORT,
  type StrategyLibraryEligibilityPort,
} from '../../strategy-library/ports/strategy-library-eligibility.port';
import {
  STRATEGY_LIBRARY_LOOKUP_PORT,
  type StrategyLibraryLookupPort,
} from '../../strategy-library/ports/strategy-library-lookup.port';
import type {
  LookupCertifiedQuery,
  OrchestratorEligibilityDecision,
  OrchestratorEligibilityQuery,
  OrchestratorLibraryRecord,
  OrchestratorStrategyLibraryConsumerPort,
} from '../ports/trading-orchestrator.port';

@Injectable()
export class OrchestratorStrategyLibraryConsumerAdapter implements OrchestratorStrategyLibraryConsumerPort {
  constructor(
    @Inject(STRATEGY_LIBRARY_LOOKUP_PORT)
    private readonly lookup: StrategyLibraryLookupPort,
    @Inject(STRATEGY_LIBRARY_ELIGIBILITY_PORT)
    private readonly eligibility: StrategyLibraryEligibilityPort,
  ) {}

  lookupCertified(query: LookupCertifiedQuery): OrchestratorLibraryRecord | null {
    const record = this.lookup.getByLibraryEntryId(query.libraryEntryId);
    if (!record) return null;
    if (record.strategy.workspaceId !== query.workspaceId) return null;
    if (record.membershipStatus !== 'certified') return null;

    return Object.freeze({
      libraryEntryId: record.version.libraryEntryId,
      strategyVersionId: record.version.version,
      strategyFamilyId: record.version.strategyFamilyId,
      workspaceId: record.strategy.workspaceId,
      membershipStatus: record.membershipStatus,
      envelopeVersion: record.tacticalEnvelope?.envelopeVersion ?? null,
      exchangeScopeIds: Object.freeze([...(record.version.supportedExchangeScopeIds ?? [])]),
    });
  }

  checkEligibility(query: OrchestratorEligibilityQuery): OrchestratorEligibilityDecision {
    const decision = this.eligibility.checkEligibility({
      libraryEntryId: query.libraryEntryId,
      workspaceId: query.workspaceId,
      exchangeScopeId: query.exchangeScopeId,
      tacticPoint: query.tacticPoint,
      purpose: 'selection',
    });
    return Object.freeze({
      outcome: decision.outcome,
      reasons: Object.freeze([...decision.reasons]),
      libraryEntryId: decision.libraryEntryId,
      checkedAt: decision.checkedAt,
    });
  }
}

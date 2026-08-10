/**
 * RC-23 Epic 2 — process-local Strategy Library read adapter.
 *
 * Implements Lookup + Eligibility application ports over an in-memory SoT buffer.
 * This is NOT a database / REST / queue product.
 *
 * Seed helpers exist for tests and epic wiring only — they are NOT consumer write ports
 * (Registration / Certification / Lifecycle Nest ports remain deferred).
 *
 * Returns frozen records. Never mutates stored domain objects after seed.
 */

import { Injectable } from '@nestjs/common';
import type { Strategy } from '../domain/strategy';
import type { StrategyCertification } from '../domain/strategy-certification';
import {
  evaluateStrategyEligibility,
  type EligibilityTacticPoint,
  type StrategyEligibility,
} from '../domain/strategy-eligibility';
import type { StrategyVersion } from '../domain/strategy-version';
import type {
  EligibilityDecision,
  EligibilityQuery,
  StrategyLibraryEligibilityPort,
} from '../ports/strategy-library-eligibility.port';
import type {
  LibraryListQuery,
  LibraryMembershipStatus,
  StrategyLibraryLookupPort,
  StrategyVersionPage,
  StrategyVersionRecord,
} from '../ports/strategy-library-lookup.port';

type LibraryEntryStore = Readonly<{
  strategy: Strategy;
  version: StrategyVersion;
  certification: StrategyCertification | null;
  eligibility: StrategyEligibility | null;
}>;

@Injectable()
export class InMemoryStrategyLibraryReadAdapter
  implements StrategyLibraryLookupPort, StrategyLibraryEligibilityPort
{
  /** SoT buffer keyed by libraryEntryId. */
  private readonly entriesById = new Map<string, LibraryEntryStore>();

  /** Secondary index: familyId\0version → libraryEntryId. */
  private readonly entryIdByFamilyVersion = new Map<string, string>();

  /**
   * Seed / replace a Library entry for tests and epic wiring.
   * Not a RegistrationPort — consumers must not treat this as production write API.
   * Freezes the assembled record views; stored refs remain domain-immutable objects.
   */
  seedEntry(input: {
    strategy: Strategy;
    version: StrategyVersion;
    certification?: StrategyCertification | null;
    eligibility?: StrategyEligibility | null;
  }): StrategyVersionRecord {
    if (input.strategy.strategyFamilyId !== input.version.strategyFamilyId) {
      throw new Error('strategy.strategyFamilyId must match version.strategyFamilyId');
    }
    if (input.strategy.workspaceId !== input.version.workspaceId) {
      throw new Error('strategy.workspaceId must match version.workspaceId');
    }
    if (
      input.certification &&
      input.certification.libraryEntryId !== input.version.libraryEntryId
    ) {
      throw new Error('certification.libraryEntryId must match version.libraryEntryId');
    }

    const store: LibraryEntryStore = Object.freeze({
      strategy: input.strategy,
      version: input.version,
      certification: input.certification ?? null,
      eligibility: input.eligibility ?? null,
    });

    this.entriesById.set(input.version.libraryEntryId, store);
    this.entryIdByFamilyVersion.set(
      familyVersionKey(input.version.strategyFamilyId, input.version.version),
      input.version.libraryEntryId,
    );

    return toRecord(store);
  }

  /** Test helper: clear all seeded entries. */
  clear(): void {
    this.entriesById.clear();
    this.entryIdByFamilyVersion.clear();
  }

  /** Test helper: entry count. */
  peekSize(): number {
    return this.entriesById.size;
  }

  getByLibraryEntryId(libraryEntryId: string): StrategyVersionRecord | null {
    if (typeof libraryEntryId !== 'string' || libraryEntryId.trim() === '') {
      return null;
    }
    const store = this.entriesById.get(libraryEntryId.trim());
    return store ? toRecord(store) : null;
  }

  getByFamilyVersion(strategyFamilyId: string, version: string): StrategyVersionRecord | null {
    if (
      typeof strategyFamilyId !== 'string' ||
      strategyFamilyId.trim() === '' ||
      typeof version !== 'string' ||
      version.trim() === ''
    ) {
      return null;
    }
    const entryId = this.entryIdByFamilyVersion.get(
      familyVersionKey(strategyFamilyId.trim(), version.trim()),
    );
    if (!entryId) {
      return null;
    }
    return this.getByLibraryEntryId(entryId);
  }

  list(query: LibraryListQuery): StrategyVersionPage {
    const workspaceId = query.workspaceId?.trim() ?? '';
    if (!workspaceId) {
      return Object.freeze({
        items: Object.freeze([]),
        nextCursor: null,
        authorityClass: 'source_of_truth',
      });
    }

    const includeArchived = query.includeArchived === true;
    const statuses = query.statuses;
    const familyFilter = query.strategyFamilyId?.trim();
    const scopeFilter = query.exchangeScopeId?.trim();
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const cursor = query.cursor?.trim() ?? '';

    let records = [...this.entriesById.values()]
      .map(toRecord)
      .filter((record) => record.strategy.workspaceId === workspaceId);

    if (familyFilter) {
      records = records.filter((r) => r.strategy.strategyFamilyId === familyFilter);
    }
    if (!includeArchived) {
      records = records.filter((r) => r.membershipStatus !== 'archived');
    }
    if (statuses && statuses.length > 0) {
      const allowed = new Set(statuses);
      records = records.filter((r) => allowed.has(r.membershipStatus));
    } else if (!includeArchived && !statuses) {
      // Default: certified only (API Contract §6.2).
      records = records.filter((r) => r.membershipStatus === 'certified');
    }
    if (scopeFilter) {
      records = records.filter((r) =>
        r.version.supportedExchangeScopeIds.includes(
          scopeFilter as (typeof r.version.supportedExchangeScopeIds)[number],
        ),
      );
    }

    records.sort((a, b) => a.version.libraryEntryId.localeCompare(b.version.libraryEntryId));

    if (cursor) {
      records = records.filter((r) => r.version.libraryEntryId > cursor);
    }

    const page = records.slice(0, limit);
    const nextCursor =
      records.length > limit ? (page[page.length - 1]?.version.libraryEntryId ?? null) : null;

    return Object.freeze({
      items: Object.freeze(page),
      nextCursor,
      authorityClass: 'source_of_truth',
    });
  }

  checkEligibility(query: EligibilityQuery): EligibilityDecision {
    const checkedAt = new Date().toISOString();
    const libraryEntryId = query.libraryEntryId?.trim() ?? '';
    const workspaceId = query.workspaceId?.trim() ?? '';

    if (!libraryEntryId || !workspaceId) {
      return freezeDecision({
        outcome: 'ineligible',
        reasons: Object.freeze(['unknown_entry']),
        status: 'unknown',
        checkedAt,
        libraryEntryId: libraryEntryId || null,
        eligibilityId: null,
      });
    }

    const store = this.entriesById.get(libraryEntryId);
    if (!store) {
      return freezeDecision({
        outcome: 'ineligible',
        reasons: Object.freeze(['unknown_entry']),
        status: 'unknown',
        checkedAt,
        libraryEntryId,
        eligibilityId: null,
      });
    }

    if (store.version.workspaceId !== workspaceId) {
      return freezeDecision({
        outcome: 'ineligible',
        reasons: Object.freeze(['workspace_mismatch']),
        status: membershipStatus(store.certification),
        checkedAt,
        libraryEntryId,
        eligibilityId: store.eligibility?.eligibilityId ?? null,
      });
    }

    const tacticPoint = mergeTacticPoint(query);
    const evaluated = evaluateStrategyEligibility({
      eligibilityId: store.eligibility?.eligibilityId ?? `elig-check-${libraryEntryId}`,
      certification: store.certification,
      rulesVersion: store.eligibility?.rulesVersion ?? 'rules-v1',
      evaluatedAt: checkedAt,
      workspaceId,
      tacticPoint,
    });

    return freezeDecision({
      outcome: evaluated.outcome,
      reasons: evaluated.reasons,
      status: membershipStatus(store.certification),
      checkedAt,
      libraryEntryId,
      eligibilityId: store.eligibility?.eligibilityId ?? evaluated.eligibilityId,
    });
  }
}

function familyVersionKey(familyId: string, version: string): string {
  return `${familyId}\0${version}`;
}

function membershipStatus(certification: StrategyCertification | null): LibraryMembershipStatus {
  if (!certification) {
    return 'uncertified';
  }
  switch (certification.status) {
    case 'active':
      return 'certified';
    case 'deprecated':
      return 'deprecated';
    case 'archived':
      return 'archived';
    default:
      return 'uncertified';
  }
}

function toRecord(store: LibraryEntryStore): StrategyVersionRecord {
  const certification = store.certification;
  return Object.freeze({
    authorityClass: 'source_of_truth',
    strategy: store.strategy,
    version: store.version,
    certification,
    eligibility: store.eligibility,
    tacticalEnvelope: certification?.tacticalEnvelope ?? null,
    membershipStatus: membershipStatus(certification),
  });
}

function freezeDecision(decision: EligibilityDecision): EligibilityDecision {
  return Object.freeze({
    ...decision,
    reasons: Object.freeze([...decision.reasons]),
  });
}

function mergeTacticPoint(query: EligibilityQuery): EligibilityTacticPoint | undefined {
  if (!query.tacticPoint && !query.exchangeScopeId) {
    return undefined;
  }
  return {
    ...(query.tacticPoint ?? {}),
    ...(query.exchangeScopeId ? { exchangeScopeId: query.exchangeScopeId.trim() } : {}),
  };
}

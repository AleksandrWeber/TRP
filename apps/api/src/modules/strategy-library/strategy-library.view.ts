import type { EligibilityDecision } from './ports/strategy-library-eligibility.port';
import type {
  LibraryMembershipStatus,
  StrategyVersionPage,
  StrategyVersionRecord,
} from './ports/strategy-library-lookup.port';

export const LIBRARY_MEMBERSHIP_STATUSES: readonly LibraryMembershipStatus[] = Object.freeze([
  'uncertified',
  'certified',
  'deprecated',
  'archived',
]);

export type StrategyLibraryRecordView = {
  authorityClass: 'source_of_truth';
  membershipStatus: LibraryMembershipStatus;
  strategy: {
    strategyFamilyId: string;
    name: string;
    description: string | null;
    registryRef: string | null;
    workspaceId: string;
    createdAt: string;
  };
  version: {
    libraryEntryId: string;
    strategyFamilyId: string;
    version: string;
    contentHash: string;
    market: string;
    supportedExchangeScopeIds: readonly string[];
    supportedTimeframes: readonly string[];
    supportedUniverse: StrategyVersionRecord['version']['supportedUniverse'];
    workspaceId: string;
    createdAt: string;
    immutable: true;
  };
  certification: {
    certificationId: string;
    status: string;
    decision: string;
    certifiedAt: string;
    certifiedBy: string;
    notes: string | null;
    contentHash: string;
    evidence: readonly {
      evidenceId: string;
      type: string;
      sourceRef: { owner: string; id: string };
    }[];
  } | null;
  eligibility: {
    eligibilityId: string;
    outcome: string;
    reasons: readonly string[];
    rulesVersion: string;
    evaluatedAt: string;
  } | null;
  tacticalEnvelope: StrategyVersionRecord['tacticalEnvelope'];
  envelopeState: 'present' | 'empty';
};

export type StrategyLibraryPageView = {
  authorityClass: 'source_of_truth';
  items: StrategyLibraryRecordView[];
  nextCursor: string | null;
};

export type StrategyLibraryEligibilityView = {
  outcome: EligibilityDecision['outcome'];
  reasons: readonly string[];
  status: EligibilityDecision['status'];
  checkedAt: string;
  libraryEntryId: string | null;
  eligibilityId: string | null;
};

/** HTTP view of a Lookup record. No derived authority beyond Library facts. */
export function toLibraryRecordView(record: StrategyVersionRecord): StrategyLibraryRecordView {
  const certification = record.certification;
  const eligibility = record.eligibility;
  return {
    authorityClass: 'source_of_truth',
    membershipStatus: record.membershipStatus,
    strategy: {
      strategyFamilyId: record.strategy.strategyFamilyId,
      name: record.strategy.name,
      description: record.strategy.description,
      registryRef: record.strategy.registryRef,
      workspaceId: record.strategy.workspaceId,
      createdAt: record.strategy.createdAt,
    },
    version: {
      libraryEntryId: record.version.libraryEntryId,
      strategyFamilyId: record.version.strategyFamilyId,
      version: record.version.version,
      contentHash: record.version.contentHash,
      market: record.version.market,
      supportedExchangeScopeIds: [...record.version.supportedExchangeScopeIds],
      supportedTimeframes: [...record.version.supportedTimeframes],
      supportedUniverse: record.version.supportedUniverse,
      workspaceId: record.version.workspaceId,
      createdAt: record.version.createdAt,
      immutable: true,
    },
    certification: certification
      ? {
          certificationId: certification.certificationId,
          status: certification.status,
          decision: certification.decision,
          certifiedAt: certification.certifiedAt,
          certifiedBy: certification.certifiedBy,
          notes: certification.notes,
          contentHash: certification.contentHash,
          evidence: certification.evidence.map((item) => ({
            evidenceId: item.evidenceId,
            type: item.type,
            sourceRef: { owner: item.sourceRef.owner, id: item.sourceRef.id },
          })),
        }
      : null,
    eligibility: eligibility
      ? {
          eligibilityId: eligibility.eligibilityId,
          outcome: eligibility.outcome,
          reasons: [...eligibility.reasons],
          rulesVersion: eligibility.rulesVersion,
          evaluatedAt: eligibility.evaluatedAt,
        }
      : null,
    tacticalEnvelope: record.tacticalEnvelope,
    envelopeState: record.tacticalEnvelope ? 'present' : 'empty',
  };
}

export function toLibraryPageView(page: StrategyVersionPage): StrategyLibraryPageView {
  return {
    authorityClass: 'source_of_truth',
    items: page.items.map(toLibraryRecordView),
    nextCursor: page.nextCursor,
  };
}

export function toEligibilityView(decision: EligibilityDecision): StrategyLibraryEligibilityView {
  return {
    outcome: decision.outcome,
    reasons: [...decision.reasons],
    status: decision.status,
    checkedAt: decision.checkedAt,
    libraryEntryId: decision.libraryEntryId,
    eligibilityId: decision.eligibilityId,
  };
}

/** Presentation filter over Lookup records. Not a new Library query port. */
export function recordMatchesQuery(record: StrategyVersionRecord, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    record.strategy.name,
    record.strategy.strategyFamilyId,
    record.version.version,
    record.version.libraryEntryId,
    record.membershipStatus,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

export function parseMembershipStatuses(
  raw: string | undefined,
): LibraryMembershipStatus[] | undefined {
  if (raw === undefined || raw.trim() === '') return undefined;
  const values = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (values.length === 0) return undefined;
  const allowed = new Set<string>(LIBRARY_MEMBERSHIP_STATUSES);
  const invalid = values.filter((value) => !allowed.has(value));
  if (invalid.length > 0) {
    throw new Error(`invalid membership status: ${invalid.join(',')}`);
  }
  return values as LibraryMembershipStatus[];
}

export function parseIncludeArchived(raw: string | undefined): boolean {
  if (raw === undefined || raw.trim() === '') return false;
  const normalized = raw.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

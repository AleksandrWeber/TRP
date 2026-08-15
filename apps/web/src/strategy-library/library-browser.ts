import type {
  LibraryListQuery,
  LibraryMembershipStatus,
  StrategyLibraryRecordView,
} from '../shared/api';

export type MembershipFilter = LibraryMembershipStatus | 'all';

export type LibraryFamilyGroup = {
  strategyFamilyId: string;
  name: string;
  versions: StrategyLibraryRecordView[];
};

export function libraryListQuery(filter: MembershipFilter, q: string): LibraryListQuery {
  const query: LibraryListQuery = { limit: 100 };
  if (q.trim()) query.q = q.trim();
  if (filter === 'all') {
    query.statuses = 'certified,deprecated,uncertified,archived';
    query.includeArchived = true;
  } else if (filter === 'archived') {
    query.statuses = 'archived';
    query.includeArchived = true;
  } else if (filter !== 'certified') {
    query.statuses = filter;
  }
  return query;
}

export function groupLibraryByFamily(
  records: readonly StrategyLibraryRecordView[],
): LibraryFamilyGroup[] {
  const groups = new Map<string, LibraryFamilyGroup>();
  for (const record of records) {
    const id = record.strategy.strategyFamilyId;
    let group = groups.get(id);
    if (!group) {
      group = { strategyFamilyId: id, name: record.strategy.name, versions: [] };
      groups.set(id, group);
    }
    group.versions.push(record);
  }
  for (const group of groups.values()) {
    group.versions.sort((left, right) =>
      right.version.createdAt.localeCompare(left.version.createdAt),
    );
  }
  return [...groups.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function membershipLabel(status: LibraryMembershipStatus): string {
  switch (status) {
    case 'certified':
      return 'Certified';
    case 'deprecated':
      return 'Deprecated';
    case 'archived':
      return 'Archived';
    case 'uncertified':
      return 'Uncertified';
  }
}

export function membershipBadgeClass(status: LibraryMembershipStatus): string {
  if (status === 'certified') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  if (status === 'deprecated') return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
  if (status === 'archived') return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
  return 'text-sky-300 border-sky-500/30 bg-sky-500/10';
}

export function eligibilityBadgeClass(outcome: string | null | undefined): string {
  if (outcome === 'eligible') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  if (outcome === 'ineligible') return 'text-rose-300 border-rose-500/30 bg-rose-500/10';
  return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
}

export function envelopeBadgeClass(state: 'present' | 'empty'): string {
  if (state === 'present') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  return 'text-slate-400 border-slate-500/30 bg-slate-500/10';
}

export function formatUniverse(
  universe: StrategyLibraryRecordView['version']['supportedUniverse'],
): string {
  if (universe.kind === 'universe-ref') return universe.universeRef;
  return universe.symbols.join(', ');
}

export function formatRiskPerTrade(
  limit: NonNullable<StrategyLibraryRecordView['tacticalEnvelope']>['riskPerTrade'],
): string {
  if ('kind' in limit && limit.kind === 'set') return limit.values.join(', ');
  const range = limit as { min: number; max: number; step?: number };
  return range.step === undefined
    ? `${range.min}–${range.max}`
    : `${range.min}–${range.max} step ${range.step}`;
}

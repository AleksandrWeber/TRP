/**
 * PC-16 — HTTP product views of existing Knowledge Lake query artifacts.
 *
 * Knowledge Lake remains the warehouse owner. Reporting remains report owner.
 * AI remains narrative only. Research `/knowledge` remains a different slice.
 * Not a new Source of Truth. Not an index redesign. Not semantic search.
 */

import type { AnalyticalFact } from '../knowledge-lake/domain/analytical-fact-admission';
import type { AnalyticalFactPage } from '../knowledge-lake/domain/analytical-fact-query';
import type { ReportRun } from '../reporting/domain/report-run';
import type { StrategyVersionRecord } from '../strategy-library/ports/strategy-library-lookup.port';

export const KNOWLEDGE_LAKE_PRODUCT_AUTHORITY_CLASS = 'projection' as const;
export const KNOWLEDGE_LAKE_PRODUCT_EXPORT_KIND = 'projection-json' as const;

export type KnowledgeLakeSourceRefView = {
  ownerType: string;
  id: string;
};

export type KnowledgeLakeListItemView = {
  entryId: string;
  eventId: string;
  workspaceId: string;
  producer: string;
  category: string;
  mode: string;
  occurredAt: string;
  admittedAt: string;
  exchangeScopeId: string;
  tradingSessionId: string | null;
  correlationId: string | null;
  sourceRef: KnowledgeLakeSourceRefView | null;
  schemaVersion: string;
  authorityClass: 'projection';
  ledgerSoT: false;
  analyticalCopy: true;
};

export type KnowledgeLakePageView = {
  items: KnowledgeLakeListItemView[];
  nextCursor: string | null;
  authorityClass: 'projection';
  ledgerSoT: false;
  analyticalCopy: true;
};

export type KnowledgeLakeRelationshipView = {
  kind: 'correlation' | 'session' | 'source-ref';
  relatedEntryId: string;
  reason: string;
  producer: string;
  category: string;
  authorityClass: 'projection';
};

export type KnowledgeLakeProvenanceView = {
  entryId: string;
  producer: string;
  occurredAt: string;
  admittedAt: string;
  schemaVersion: string;
  sourceRef: KnowledgeLakeSourceRefView | null;
  ownershipChain: readonly ['source-of-truth', 'projection', 'knowledge-lake'];
  authorityClass: 'projection';
  ledgerSoT: false;
  mutatesSource: false;
};

export type KnowledgeLakeConnectedReportView = {
  reportRunId: string;
  name: string;
  kind: string;
  status: string;
  createdAt: string;
  href: string;
  authorityClass: 'projection';
};

export type KnowledgeLakeConnectedNarrativeView = {
  reportRunId: string;
  availableOnReporting: true;
  href: string;
  authorsNarrative: false;
  authorityClass: 'narrative-reference';
};

export type KnowledgeLakeConnectedResearchView = {
  ownerType: string;
  id: string;
  producer: string;
  outcomeKind: string | null;
  href: string | null;
  authorityClass: 'projection';
};

export type KnowledgeLakeConnectedStrategyView = {
  libraryEntryId: string;
  strategyFamilyId: string | null;
  version: string | null;
  present: boolean;
  href: string;
  authorityClass: 'source_of_truth' | 'projection';
};

export type KnowledgeLakeConnectedMarketView = {
  kind: 'qualification' | 'market-profile' | 'market-state';
  ownerType: string;
  id: string;
  href: string | null;
  present: true;
  authorityClass: 'projection';
};

export type KnowledgeLakeDetailView = KnowledgeLakeListItemView & {
  payload: unknown;
  provenance: KnowledgeLakeProvenanceView;
  relationships: readonly KnowledgeLakeRelationshipView[];
  references: readonly KnowledgeLakeSourceRefView[];
  connectedReports: readonly KnowledgeLakeConnectedReportView[];
  connectedNarratives: readonly KnowledgeLakeConnectedNarrativeView[];
  connectedResearch: readonly KnowledgeLakeConnectedResearchView[];
  connectedStrategies: readonly KnowledgeLakeConnectedStrategyView[];
  connectedMarket: readonly KnowledgeLakeConnectedMarketView[];
  exportAvailable: true;
  exportKind: 'projection-json';
};

export type KnowledgeLakeHistoryItemView = KnowledgeLakeListItemView & {
  ingestedAt: string;
};

export type KnowledgeLakeHistoryPageView = {
  items: KnowledgeLakeHistoryItemView[];
  nextCursor: string | null;
  authorityClass: 'projection';
  ledgerSoT: false;
  analyticalCopy: true;
};

export type KnowledgeLakeRelationshipPageView = {
  entryId: string;
  items: KnowledgeLakeRelationshipView[];
  authorityClass: 'projection';
  ledgerSoT: false;
};

export type ListKnowledgeLakeQuery = Readonly<{
  workspaceId: string;
  q?: string;
  producer?: string;
  category?: string;
  mode?: string;
  libraryEntryId?: string;
  reportRunId?: string;
  tradingSessionId?: string;
  exchangeScopeId?: string;
  correlationId?: string;
  occurredFrom?: string;
  occurredTo?: string;
  limit?: number;
  cursor?: string;
}>;

const RESEARCH_OWNER_TYPES = new Set([
  'CampaignSession',
  'Experiment',
  'KnowledgeEntry',
  'campaign',
]);

const MARKET_OWNER_TYPES: Record<string, KnowledgeLakeConnectedMarketView['kind']> = {
  Qualification: 'qualification',
  MarketQualification: 'qualification',
  qualification: 'qualification',
  MarketProfile: 'market-profile',
  'market-profile': 'market-profile',
  Profile: 'market-profile',
  MarketState: 'market-state',
  'market-state': 'market-state',
};

const STRATEGY_OWNER_TYPES = new Set([
  'Strategy',
  'StrategyVersion',
  'strategy-library',
  'library-entry',
  'LibraryEntry',
]);

export function toListItemView(fact: AnalyticalFact): KnowledgeLakeListItemView {
  return {
    entryId: fact.eventId,
    eventId: fact.eventId,
    workspaceId: fact.workspaceId,
    producer: fact.producer,
    category: fact.category,
    mode: fact.mode,
    occurredAt: fact.occurredAt,
    admittedAt: fact.admittedAt,
    exchangeScopeId: fact.exchangeScopeId,
    tradingSessionId: fact.tradingSessionId ?? null,
    correlationId: fact.correlationId ?? null,
    sourceRef: fact.sourceRef
      ? { ownerType: fact.sourceRef.ownerType, id: fact.sourceRef.id }
      : null,
    schemaVersion: fact.schemaVersion,
    authorityClass: KNOWLEDGE_LAKE_PRODUCT_AUTHORITY_CLASS,
    ledgerSoT: false,
    analyticalCopy: true,
  };
}

export function toPageView(page: AnalyticalFactPage): KnowledgeLakePageView {
  return {
    items: page.items.map(toListItemView),
    nextCursor: page.nextCursor,
    authorityClass: KNOWLEDGE_LAKE_PRODUCT_AUTHORITY_CLASS,
    ledgerSoT: false,
    analyticalCopy: true,
  };
}

export function toHistoryPageView(facts: readonly AnalyticalFact[]): KnowledgeLakeHistoryPageView {
  const items = [...facts]
    .sort((left, right) => {
      const byAdmitted = right.admittedAt.localeCompare(left.admittedAt);
      if (byAdmitted !== 0) return byAdmitted;
      return right.eventId.localeCompare(left.eventId);
    })
    .map((fact) => ({
      ...toListItemView(fact),
      ingestedAt: fact.admittedAt,
    }));
  return {
    items,
    nextCursor: null,
    authorityClass: KNOWLEDGE_LAKE_PRODUCT_AUTHORITY_CLASS,
    ledgerSoT: false,
    analyticalCopy: true,
  };
}

export function toProvenanceView(fact: AnalyticalFact): KnowledgeLakeProvenanceView {
  return {
    entryId: fact.eventId,
    producer: fact.producer,
    occurredAt: fact.occurredAt,
    admittedAt: fact.admittedAt,
    schemaVersion: fact.schemaVersion,
    sourceRef: fact.sourceRef
      ? { ownerType: fact.sourceRef.ownerType, id: fact.sourceRef.id }
      : null,
    ownershipChain: Object.freeze(['source-of-truth', 'projection', 'knowledge-lake'] as const),
    authorityClass: KNOWLEDGE_LAKE_PRODUCT_AUTHORITY_CLASS,
    ledgerSoT: false,
    mutatesSource: false,
  };
}

export function toRelationshipViews(
  fact: AnalyticalFact,
  related: readonly AnalyticalFact[],
): KnowledgeLakeRelationshipView[] {
  const items: KnowledgeLakeRelationshipView[] = [];
  for (const other of related) {
    if (other.eventId === fact.eventId) continue;
    if (fact.correlationId && other.correlationId === fact.correlationId) {
      items.push({
        kind: 'correlation',
        relatedEntryId: other.eventId,
        reason: `Shares correlation ${fact.correlationId}`,
        producer: other.producer,
        category: other.category,
        authorityClass: KNOWLEDGE_LAKE_PRODUCT_AUTHORITY_CLASS,
      });
      continue;
    }
    if (fact.tradingSessionId && other.tradingSessionId === fact.tradingSessionId) {
      items.push({
        kind: 'session',
        relatedEntryId: other.eventId,
        reason: `Shares trading session ${fact.tradingSessionId}`,
        producer: other.producer,
        category: other.category,
        authorityClass: KNOWLEDGE_LAKE_PRODUCT_AUTHORITY_CLASS,
      });
      continue;
    }
    if (
      fact.sourceRef &&
      other.sourceRef &&
      fact.sourceRef.ownerType === other.sourceRef.ownerType &&
      fact.sourceRef.id === other.sourceRef.id
    ) {
      items.push({
        kind: 'source-ref',
        relatedEntryId: other.eventId,
        reason: `Shares source ${fact.sourceRef.ownerType}:${fact.sourceRef.id}`,
        producer: other.producer,
        category: other.category,
        authorityClass: KNOWLEDGE_LAKE_PRODUCT_AUTHORITY_CLASS,
      });
    }
  }
  return items;
}

export function toConnectedReportView(run: ReportRun): KnowledgeLakeConnectedReportView {
  return {
    reportRunId: run.reportRunId,
    name: run.definitionSnapshot.name,
    kind: run.definitionSnapshot.kind,
    status: run.status,
    createdAt: run.createdAt,
    href: `/reporting/${run.reportRunId}`,
    authorityClass: 'projection',
  };
}

export function toConnectedNarrativeView(run: ReportRun): KnowledgeLakeConnectedNarrativeView {
  return {
    reportRunId: run.reportRunId,
    availableOnReporting: true,
    href: `/reporting/${run.reportRunId}`,
    authorsNarrative: false,
    authorityClass: 'narrative-reference',
  };
}

export function toConnectedResearchView(
  fact: AnalyticalFact,
): KnowledgeLakeConnectedResearchView | null {
  const payload = asRecord(fact.payload);
  const outcomeKind = typeof payload?.outcomeKind === 'string' ? payload.outcomeKind : null;
  if (
    fact.producer === 'research-lab' ||
    (fact.sourceRef && RESEARCH_OWNER_TYPES.has(fact.sourceRef.ownerType))
  ) {
    const ownerType = fact.sourceRef?.ownerType ?? 'research-lab';
    const id = fact.sourceRef?.id ?? fact.eventId;
    return {
      ownerType,
      id,
      producer: fact.producer,
      outcomeKind,
      href: researchHref(ownerType, id),
      authorityClass: KNOWLEDGE_LAKE_PRODUCT_AUTHORITY_CLASS,
    };
  }
  return null;
}

export function toConnectedStrategyView(
  fact: AnalyticalFact,
  record: StrategyVersionRecord | null,
): KnowledgeLakeConnectedStrategyView | null {
  const libraryEntryId = strategyIdFromFact(fact);
  if (!libraryEntryId) return null;
  return {
    libraryEntryId,
    strategyFamilyId: record?.strategy.strategyFamilyId ?? null,
    version: record?.version.version ?? null,
    present: record !== null,
    href: `/strategy-library/${libraryEntryId}`,
    authorityClass: record ? 'source_of_truth' : KNOWLEDGE_LAKE_PRODUCT_AUTHORITY_CLASS,
  };
}

export function toConnectedMarketView(
  fact: AnalyticalFact,
): KnowledgeLakeConnectedMarketView | null {
  const ownerType = fact.sourceRef?.ownerType;
  if (!ownerType) return null;
  const kind = MARKET_OWNER_TYPES[ownerType];
  if (!kind) return null;
  const id = fact.sourceRef?.id ?? fact.eventId;
  return {
    kind,
    ownerType,
    id,
    href: marketHref(kind, id),
    present: true,
    authorityClass: KNOWLEDGE_LAKE_PRODUCT_AUTHORITY_CLASS,
  };
}

export function toDetailView(input: {
  fact: AnalyticalFact;
  related: readonly AnalyticalFact[];
  reports: readonly ReportRun[];
  strategy: StrategyVersionRecord | null;
}): KnowledgeLakeDetailView {
  const research = uniqueBy(
    [toConnectedResearchView(input.fact), ...input.related.map(toConnectedResearchView)].filter(
      (row): row is KnowledgeLakeConnectedResearchView => row !== null,
    ),
    (row) => `${row.ownerType}:${row.id}`,
  );
  const market = uniqueBy(
    [toConnectedMarketView(input.fact), ...input.related.map(toConnectedMarketView)].filter(
      (row): row is KnowledgeLakeConnectedMarketView => row !== null,
    ),
    (row) => `${row.kind}:${row.id}`,
  );
  const strategy = toConnectedStrategyView(input.fact, input.strategy);
  const references: KnowledgeLakeSourceRefView[] = [];
  if (input.fact.sourceRef) {
    references.push({ ownerType: input.fact.sourceRef.ownerType, id: input.fact.sourceRef.id });
  }
  return {
    ...toListItemView(input.fact),
    payload: input.fact.payload,
    provenance: toProvenanceView(input.fact),
    relationships: toRelationshipViews(input.fact, input.related),
    references,
    connectedReports: input.reports.map(toConnectedReportView),
    connectedNarratives: input.reports.map(toConnectedNarrativeView),
    connectedResearch: research,
    connectedStrategies: strategy ? [strategy] : [],
    connectedMarket: market,
    exportAvailable: true,
    exportKind: KNOWLEDGE_LAKE_PRODUCT_EXPORT_KIND,
  };
}

export function toProjectionExport(detail: KnowledgeLakeDetailView): string {
  return JSON.stringify(
    {
      authorityClass: KNOWLEDGE_LAKE_PRODUCT_AUTHORITY_CLASS,
      ledgerSoT: false,
      exportKind: KNOWLEDGE_LAKE_PRODUCT_EXPORT_KIND,
      analyticalCopy: true,
      entryId: detail.entryId,
      eventId: detail.eventId,
      workspaceId: detail.workspaceId,
      producer: detail.producer,
      category: detail.category,
      mode: detail.mode,
      occurredAt: detail.occurredAt,
      admittedAt: detail.admittedAt,
      payload: detail.payload,
      sourceRef: detail.sourceRef,
      schemaVersion: detail.schemaVersion,
    },
    null,
    2,
  );
}

export function factMatchesQuery(fact: AnalyticalFact, query: ListKnowledgeLakeQuery): boolean {
  if (query.libraryEntryId && strategyIdFromFact(fact) !== query.libraryEntryId) return false;
  const needle = query.q?.trim().toLowerCase();
  if (!needle) return true;
  return factSearchHaystack(fact).includes(needle);
}

export function reportCitesEntry(run: ReportRun, entryId: string): boolean {
  if (run.sourceSummary.lakeEventIds.includes(entryId)) return true;
  return run.sourceSummary.sourceRefs.some(
    (ref) => ref.ownerType === 'knowledge-lake' && ref.id === entryId,
  );
}

export function strategyIdFromFact(fact: AnalyticalFact): string | null {
  const payload = asRecord(fact.payload);
  if (typeof payload?.libraryEntryId === 'string' && payload.libraryEntryId.trim()) {
    return payload.libraryEntryId.trim();
  }
  if (typeof payload?.strategyId === 'string' && payload.strategyId.trim()) {
    return payload.strategyId.trim();
  }
  if (fact.sourceRef && STRATEGY_OWNER_TYPES.has(fact.sourceRef.ownerType)) {
    return fact.sourceRef.id;
  }
  return null;
}

export function factSearchHaystack(fact: AnalyticalFact): string {
  return [
    fact.eventId,
    fact.producer,
    fact.category,
    fact.mode,
    fact.correlationId ?? '',
    fact.tradingSessionId ?? '',
    fact.exchangeScopeId,
    fact.sourceRef?.ownerType ?? '',
    fact.sourceRef?.id ?? '',
    stringifyPayload(fact.payload),
  ]
    .join(' ')
    .toLowerCase();
}

function researchHref(ownerType: string, id: string): string | null {
  if (ownerType === 'Experiment') return `/research/${id}`;
  if (ownerType === 'KnowledgeEntry') return `/knowledge`;
  if (ownerType === 'CampaignSession' || ownerType === 'campaign') return `/campaigns/results`;
  return null;
}

function marketHref(kind: KnowledgeLakeConnectedMarketView['kind'], id: string): string | null {
  if (kind === 'qualification') return `/qualification/targets/${id}`;
  if (kind === 'market-profile') return `/market-profile/targets/${id}`;
  if (kind === 'market-state') return `/market-state/targets/${id}`;
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringifyPayload(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}

function uniqueBy<T>(items: readonly T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const id = key(item);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

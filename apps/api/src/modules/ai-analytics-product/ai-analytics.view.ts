/**
 * PC-17 — HTTP product views of existing AI Analytics narratives.
 *
 * AI Analytics remains narrative owner. Reporting remains report owner.
 * Knowledge Lake remains warehouse owner. Strategy Library remains membership SoT.
 * Not a new Source of Truth. Not persistence. Not trading. Not `/ai/execute`.
 */

import type {
  AnalyticalNarrative,
  AnalyticalNarrativeKind,
} from '../ai-analytics/domain/analytical-narrative';
import type { AnalyticalFact } from '../knowledge-lake/domain/analytical-fact-admission';
import type { ComparisonSlice } from '../reporting/ports/reporting.port';
import type { ReportRun } from '../reporting/domain/report-run';
import type { StrategyVersionRecord } from '../strategy-library/ports/strategy-library-lookup.port';

export const AI_ANALYTICS_PRODUCT_AUTHORITY_CLASS = 'narrative' as const;
export const AI_ANALYTICS_PRODUCT_KINDS = Object.freeze([
  'explain',
  'summarize',
  'trends',
  'narrative',
] as const);

export type AiAnalyticsProductKind = (typeof AI_ANALYTICS_PRODUCT_KINDS)[number];

export type AiAnalyticsSourceRefView = {
  ownerType: string;
  id: string;
  href: string | null;
};

export type AiAnalyticsListItemView = {
  analysisId: string;
  narrativeId: string;
  workspaceId: string;
  kind: AiAnalyticsProductKind;
  reportRunId: string | null;
  createdAt: string;
  summary: string;
  authorityClass: 'narrative';
  sourceOfTruth: false;
  forcesTrade: false;
};

export type AiAnalyticsPageView = {
  items: AiAnalyticsListItemView[];
  nextCursor: string | null;
  authorityClass: 'narrative';
  sourceOfTruth: false;
  forcesTrade: false;
};

export type AiAnalyticsHistoryItemView = AiAnalyticsListItemView & {
  generatedAt: string;
};

export type AiAnalyticsHistoryPageView = {
  items: AiAnalyticsHistoryItemView[];
  nextCursor: string | null;
  authorityClass: 'narrative';
  sourceOfTruth: false;
  forcesTrade: false;
};

export type AiAnalyticsRecommendationView = {
  recommendationId: string;
  text: string;
  href: string | null;
  forcesTrade: false;
  ownsStrategy: false;
  ownsReport: false;
};

export type AiAnalyticsInsightView = {
  insightId: string;
  kind: string;
  text: string;
  forcesTrade: false;
};

export type AiAnalyticsReasoningView = {
  provider: string;
  modelId: string;
  templateVersion: string;
  method: string;
  ownsFacts: false;
  ownsReports: false;
};

export type AiAnalyticsProvenanceView = {
  analysisId: string;
  narrativeId: string;
  kind: AiAnalyticsProductKind;
  createdAt: string;
  modelMeta: Readonly<Record<string, unknown>> | null;
  sourceRefs: readonly AiAnalyticsSourceRefView[];
  ownershipChain: readonly ['source-of-truth', 'projection', 'narrative'];
  authorityClass: 'narrative';
  sourceOfTruth: false;
  mutatesSource: false;
  forcesTrade: false;
};

export type AiAnalyticsKnowledgeRefView = {
  entryId: string;
  href: string;
  present: boolean;
  authorityClass: 'projection';
};

export type AiAnalyticsReportRefView = {
  reportRunId: string;
  name: string;
  kind: string;
  status: string;
  href: string;
  ownsReport: false;
  authorityClass: 'projection';
};

export type AiAnalyticsStrategyRefView = {
  libraryEntryId: string;
  version: string | null;
  present: boolean;
  href: string;
  ownsStrategy: false;
  authorityClass: 'source_of_truth' | 'projection';
};

export type AiAnalyticsMarketRefView = {
  kind: 'qualification' | 'market-profile' | 'market-state' | 'deployment' | 'trading-session';
  ownerType: string;
  id: string;
  href: string | null;
  present: true;
};

export type AiAnalyticsComparisonSliceView = {
  metricKey: string;
  leftValue: unknown;
  rightValue: unknown;
  delta: unknown;
  authorityClass: 'projection';
  ownsReports: false;
};

export type AiAnalyticsComparisonView = {
  leftAnalysisId: string;
  rightAnalysisId: string;
  leftReportRunId: string;
  rightReportRunId: string;
  leftKind: AiAnalyticsProductKind;
  rightKind: AiAnalyticsProductKind;
  leftText: string;
  rightText: string;
  slices: readonly AiAnalyticsComparisonSliceView[];
  leftStrategy: AiAnalyticsStrategyRefView | null;
  rightStrategy: AiAnalyticsStrategyRefView | null;
  authorityClass: 'narrative';
  sourceOfTruth: false;
  forcesTrade: false;
};

export type AiAnalyticsDetailView = AiAnalyticsListItemView & {
  text: string;
  disclaimer: string;
  modesCovered: readonly string[];
  provenance: AiAnalyticsProvenanceView;
  reasoning: AiAnalyticsReasoningView;
  recommendations: readonly AiAnalyticsRecommendationView[];
  insights: readonly AiAnalyticsInsightView[];
  sources: readonly AiAnalyticsSourceRefView[];
  knowledgeRefs: readonly AiAnalyticsKnowledgeRefView[];
  reportRefs: readonly AiAnalyticsReportRefView[];
  strategyRefs: readonly AiAnalyticsStrategyRefView[];
  marketRefs: readonly AiAnalyticsMarketRefView[];
  comparison: AiAnalyticsComparisonView | null;
};

export type ListAiAnalyticsQuery = Readonly<{
  workspaceId: string;
  q?: string;
  kind?: AiAnalyticsProductKind;
  reportRunId?: string;
  libraryEntryId?: string;
  limit?: number;
}>;

export type GenerateAiAnalyticsCommand = Readonly<{
  workspaceId: string;
  kind?: AiAnalyticsProductKind;
  reportRunId?: string;
  compareReportRunId?: string;
  libraryEntryId?: string;
  compareLibraryEntryId?: string;
  focus?: string;
  requestedAt?: string;
}>;

const MARKET_OWNER_TYPES: Record<string, AiAnalyticsMarketRefView['kind']> = {
  Qualification: 'qualification',
  MarketQualification: 'qualification',
  qualification: 'qualification',
  MarketProfile: 'market-profile',
  'market-profile': 'market-profile',
  Profile: 'market-profile',
  MarketState: 'market-state',
  'market-state': 'market-state',
  StrategyDeployment: 'deployment',
  'strategy-deployment': 'deployment',
  deployment: 'deployment',
  TradingSession: 'trading-session',
  'trading-session': 'trading-session',
};

export function isAiAnalyticsProductKind(
  value: string | undefined,
): value is AiAnalyticsProductKind {
  return value !== undefined && (AI_ANALYTICS_PRODUCT_KINDS as readonly string[]).includes(value);
}

export function narrativeSummary(text: string): string {
  const line = text.split('\n').find((row) => row.trim().length > 0) ?? text;
  return line.trim().slice(0, 240);
}

export function toSourceRefView(ref: { ownerType: string; id: string }): AiAnalyticsSourceRefView {
  return {
    ownerType: ref.ownerType,
    id: ref.id,
    href: sourceHref(ref.ownerType, ref.id),
  };
}

export function toListItemView(narrative: AnalyticalNarrative): AiAnalyticsListItemView {
  return {
    analysisId: narrative.narrativeId,
    narrativeId: narrative.narrativeId,
    workspaceId: narrative.workspaceId,
    kind: narrative.kind,
    reportRunId: narrative.reportRunId ?? null,
    createdAt: narrative.createdAt,
    summary: narrativeSummary(narrative.text),
    authorityClass: AI_ANALYTICS_PRODUCT_AUTHORITY_CLASS,
    sourceOfTruth: false,
    forcesTrade: false,
  };
}

export function toPageView(items: readonly AnalyticalNarrative[]): AiAnalyticsPageView {
  return {
    items: items.map(toListItemView),
    nextCursor: null,
    authorityClass: AI_ANALYTICS_PRODUCT_AUTHORITY_CLASS,
    sourceOfTruth: false,
    forcesTrade: false,
  };
}

export function toHistoryPageView(
  items: readonly AnalyticalNarrative[],
): AiAnalyticsHistoryPageView {
  const ordered = [...items].sort((left, right) => {
    const byCreated = right.createdAt.localeCompare(left.createdAt);
    if (byCreated !== 0) return byCreated;
    return right.narrativeId.localeCompare(left.narrativeId);
  });
  return {
    items: ordered.map((narrative) => ({
      ...toListItemView(narrative),
      generatedAt: narrative.createdAt,
    })),
    nextCursor: null,
    authorityClass: AI_ANALYTICS_PRODUCT_AUTHORITY_CLASS,
    sourceOfTruth: false,
    forcesTrade: false,
  };
}

export function toProvenanceView(narrative: AnalyticalNarrative): AiAnalyticsProvenanceView {
  return {
    analysisId: narrative.narrativeId,
    narrativeId: narrative.narrativeId,
    kind: narrative.kind,
    createdAt: narrative.createdAt,
    modelMeta: narrative.modelMeta ? { ...narrative.modelMeta } : null,
    sourceRefs: narrative.sourceRefs.map(toSourceRefView),
    ownershipChain: Object.freeze(['source-of-truth', 'projection', 'narrative'] as const),
    authorityClass: AI_ANALYTICS_PRODUCT_AUTHORITY_CLASS,
    sourceOfTruth: false,
    mutatesSource: false,
    forcesTrade: false,
  };
}

export function toReasoningView(narrative: AnalyticalNarrative): AiAnalyticsReasoningView {
  const meta = asRecord(narrative.modelMeta);
  return {
    provider: typeof meta?.provider === 'string' ? meta.provider : 'deterministic',
    modelId: typeof meta?.modelId === 'string' ? meta.modelId : 'deterministic-report-narrator-v1',
    templateVersion: typeof meta?.templateVersion === 'string' ? meta.templateVersion : '1',
    method: 'ReportRun + AggregationSlice → AnalyticalNarrative',
    ownsFacts: false,
    ownsReports: false,
  };
}

export function toRecommendations(input: {
  narrative: AnalyticalNarrative;
  run: ReportRun | null;
}): AiAnalyticsRecommendationView[] {
  const reportHref = input.run ? `/reporting/${input.run.reportRunId}` : null;
  return [
    {
      recommendationId: 'inspect-report',
      text: 'Inspect the cited ReportRun. Reporting remains the projection owner; this narrative does not become a report.',
      href: reportHref,
      forcesTrade: false,
      ownsStrategy: false,
      ownsReport: false,
    },
    {
      recommendationId: 'inspect-sources',
      text: 'Inspect provenance and Knowledge Lake citations. If this text conflicts with Ledger, Fills, Orders, or Session, Source of Truth wins.',
      href: '/knowledge-lake',
      forcesTrade: false,
      ownsStrategy: false,
      ownsReport: false,
    },
    {
      recommendationId: 'no-orders',
      text: 'This analysis does not authorize orders, edit strategies, send notifications, or execute trades.',
      href: null,
      forcesTrade: false,
      ownsStrategy: false,
      ownsReport: false,
    },
  ];
}

export function toInsights(narrative: AnalyticalNarrative): AiAnalyticsInsightView[] {
  const byKind: Record<AnalyticalNarrativeKind, string> = {
    explain: 'This commentary explains the cited report projection only.',
    summarize: 'This is a non-authoritative summary of the cited report.',
    trends: 'Trend observations describe report aggregations. They are not trading signals.',
    narrative: 'Narrative artifact only. Source of Truth wins on conflict.',
  };
  return [
    {
      insightId: `${narrative.narrativeId}-kind`,
      kind: narrative.kind,
      text: byKind[narrative.kind],
      forcesTrade: false,
    },
    {
      insightId: `${narrative.narrativeId}-disclaimer`,
      kind: 'disclaimer',
      text: narrative.disclaimer,
      forcesTrade: false,
    },
  ];
}

export function toReportRefView(run: ReportRun): AiAnalyticsReportRefView {
  return {
    reportRunId: run.reportRunId,
    name: run.definitionSnapshot.name,
    kind: run.definitionSnapshot.kind,
    status: run.status,
    href: `/reporting/${run.reportRunId}`,
    ownsReport: false,
    authorityClass: 'projection',
  };
}

export function toStrategyRefView(
  libraryEntryId: string,
  record: StrategyVersionRecord | null,
): AiAnalyticsStrategyRefView {
  return {
    libraryEntryId,
    version: record?.version.version ?? null,
    present: record !== null,
    href: `/strategy-library/${libraryEntryId}`,
    ownsStrategy: false,
    authorityClass: record ? 'source_of_truth' : 'projection',
  };
}

export function toKnowledgeRefView(entryId: string, present: boolean): AiAnalyticsKnowledgeRefView {
  return {
    entryId,
    href: `/knowledge-lake/${entryId}`,
    present,
    authorityClass: 'projection',
  };
}

export function toMarketRefView(fact: AnalyticalFact): AiAnalyticsMarketRefView | null {
  const ownerType = fact.sourceRef?.ownerType;
  if (ownerType) {
    const kind = MARKET_OWNER_TYPES[ownerType];
    if (kind) {
      const id = fact.sourceRef?.id ?? fact.eventId;
      return {
        kind,
        ownerType,
        id,
        href: marketHref(kind, id),
        present: true,
      };
    }
  }
  if (fact.tradingSessionId) {
    return {
      kind: 'trading-session',
      ownerType: 'trading-session',
      id: fact.tradingSessionId,
      href: `/command-center/sessions/${fact.tradingSessionId}`,
      present: true,
    };
  }
  return null;
}

export function toSessionMarketRef(run: ReportRun): AiAnalyticsMarketRefView | null {
  if (!run.tradingSessionId) return null;
  return {
    kind: 'trading-session',
    ownerType: 'trading-session',
    id: run.tradingSessionId,
    href: `/command-center/sessions/${run.tradingSessionId}`,
    present: true,
  };
}

export function toComparisonView(input: {
  left: AnalyticalNarrative;
  right: AnalyticalNarrative;
  slices: readonly ComparisonSlice[];
  leftStrategy: AiAnalyticsStrategyRefView | null;
  rightStrategy: AiAnalyticsStrategyRefView | null;
}): AiAnalyticsComparisonView {
  return {
    leftAnalysisId: input.left.narrativeId,
    rightAnalysisId: input.right.narrativeId,
    leftReportRunId: input.left.reportRunId ?? '',
    rightReportRunId: input.right.reportRunId ?? '',
    leftKind: input.left.kind,
    rightKind: input.right.kind,
    leftText: input.left.text,
    rightText: input.right.text,
    slices: input.slices.map((slice) => ({
      metricKey: slice.metricKey,
      leftValue: slice.leftValue,
      rightValue: slice.rightValue,
      delta: slice.delta,
      authorityClass: 'projection',
      ownsReports: false,
    })),
    leftStrategy: input.leftStrategy,
    rightStrategy: input.rightStrategy,
    authorityClass: AI_ANALYTICS_PRODUCT_AUTHORITY_CLASS,
    sourceOfTruth: false,
    forcesTrade: false,
  };
}

export function toDetailView(input: {
  narrative: AnalyticalNarrative;
  run: ReportRun | null;
  lakeFacts: readonly AnalyticalFact[];
  strategy: StrategyVersionRecord | null;
  comparison: AiAnalyticsComparisonView | null;
}): AiAnalyticsDetailView {
  const knowledgeIds = input.run?.sourceSummary.lakeEventIds ?? [];
  const presentIds = new Set(input.lakeFacts.map((fact) => fact.eventId));
  const knowledgeRefs = uniqueBy(
    knowledgeIds.map((entryId) => toKnowledgeRefView(entryId, presentIds.has(entryId))),
    (row) => row.entryId,
  );
  const strategyId = input.run?.libraryEntryId ?? strategyIdFromRefs(input.run);
  const strategyRefs = strategyId ? [toStrategyRefView(strategyId, input.strategy)] : [];
  const market = uniqueBy(
    [
      input.run ? toSessionMarketRef(input.run) : null,
      ...input.lakeFacts.map(toMarketRefView),
    ].filter((row): row is AiAnalyticsMarketRefView => row !== null),
    (row) => `${row.kind}:${row.id}`,
  );
  return {
    ...toListItemView(input.narrative),
    text: input.narrative.text,
    disclaimer: input.narrative.disclaimer,
    modesCovered: [...input.narrative.modesCovered],
    provenance: toProvenanceView(input.narrative),
    reasoning: toReasoningView(input.narrative),
    recommendations: toRecommendations({ narrative: input.narrative, run: input.run }),
    insights: toInsights(input.narrative),
    sources: input.narrative.sourceRefs.map(toSourceRefView),
    knowledgeRefs,
    reportRefs: input.run ? [toReportRefView(input.run)] : [],
    strategyRefs,
    marketRefs: market,
    comparison: input.comparison,
  };
}

export function narrativeMatchesQuery(
  narrative: AnalyticalNarrative,
  query: ListAiAnalyticsQuery,
): boolean {
  if (query.kind && narrative.kind !== query.kind) return false;
  if (query.reportRunId && narrative.reportRunId !== query.reportRunId) return false;
  const needle = query.q?.trim().toLowerCase();
  if (!needle) return true;
  return [narrative.narrativeId, narrative.kind, narrative.text, narrative.reportRunId ?? '']
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

export function runCitesLibrary(run: ReportRun, libraryEntryId: string): boolean {
  if (run.libraryEntryId === libraryEntryId) return true;
  return run.sourceSummary.sourceRefs.some(
    (ref) => ref.ownerType === 'strategy-library' && ref.id === libraryEntryId,
  );
}

function strategyIdFromRefs(run: ReportRun | null): string | null {
  if (!run) return null;
  const cited = run.sourceSummary.sourceRefs.find((ref) => ref.ownerType === 'strategy-library');
  return cited?.id ?? null;
}

function sourceHref(ownerType: string, id: string): string | null {
  if (ownerType === 'report-run') return `/reporting/${id}`;
  if (ownerType === 'knowledge-lake') return `/knowledge-lake/${id}`;
  if (ownerType === 'strategy-library') return `/strategy-library/${id}`;
  return null;
}

function marketHref(kind: AiAnalyticsMarketRefView['kind'], id: string): string | null {
  if (kind === 'qualification') return `/qualification/targets/${id}`;
  if (kind === 'market-profile') return `/market-profile/targets/${id}`;
  if (kind === 'market-state') return `/market-state/targets/${id}`;
  if (kind === 'deployment') return `/deployments/${id}`;
  if (kind === 'trading-session') return `/command-center/sessions/${id}`;
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
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

/**
 * PC-05 — HTTP product views of existing Reporting query artifacts.
 *
 * Reporting remains report owner. AI remains narrative only.
 * Notification remains delivery only. Dashboard remains projection.
 * Not `/reports` (research-report). Not a new report engine. Not ledger SoT.
 */

import type { AggregationSlice } from '../reporting/domain/aggregation-slice';
import type { ReportDefinition } from '../reporting/domain/report-definition';
import type { ReportRun } from '../reporting/domain/report-run';
import type { ReportRunDeliveryView } from '../product-flow/report-run-delivery.view';
import type { ReportRunNarrativeView } from '../product-flow/report-run-narrative.view';

export type ReportDefinitionView = {
  reportDefinitionId: string;
  workspaceId: string;
  name: string;
  description: string | null;
  kind: string;
  defaultModes: readonly string[];
  metricKeys: readonly string[];
  compareEnabled: boolean;
  createdAt: string;
  updatedAt: string | null;
  authorityClass: 'projection';
  ledgerSoT: false;
};

export type ReportDefinitionPageView = {
  items: ReportDefinitionView[];
  authorityClass: 'projection';
  ledgerSoT: false;
};

export type ReportRunListItemView = {
  reportRunId: string;
  workspaceId: string;
  reportDefinitionId: string;
  name: string;
  kind: string;
  status: string;
  modes: readonly string[];
  exchangeScopeId: string;
  tradingSessionId: string | null;
  libraryEntryId: string | null;
  windowFrom: string;
  windowTo: string;
  windowPreset: string | null;
  factCount: number;
  createdAt: string;
  deliveryOutcome: string | null;
  deliveryId: string | null;
  authorityClass: 'projection';
  ledgerSoT: false;
};

export type ReportRunPageView = {
  items: ReportRunListItemView[];
  authorityClass: 'projection';
  ledgerSoT: false;
};

export type ReportAggregationView = {
  sliceId: string;
  reportRunId: string;
  metricKey: string;
  mode: string | null;
  label: string;
  value: unknown;
  comparison: unknown;
  sourceRefs: readonly { ownerType: string; id: string }[];
  visualizationHint: string | null;
  authorityClass: 'projection';
};

export type ReportRunDetailView = ReportRunListItemView & {
  description: string | null;
  metricKeys: readonly string[];
  compareEnabled: boolean;
  rejectionReasons: readonly string[];
  sourceSummary: {
    factCount: number;
    lakeEventIds: readonly string[];
    sourceRefs: readonly { ownerType: string; id: string }[];
  };
  aggregations: readonly ReportAggregationView[];
  narrative: ReportRunNarrativeView | null;
  delivery: ReportRunDeliveryView | null;
  exportAvailable: true;
  exportKind: 'projection-json';
};

export type ListReportRunsQuery = Readonly<{
  workspaceId: string;
  reportDefinitionId?: string;
  kind?: string;
  status?: string;
  mode?: string;
  tradingSessionId?: string;
  q?: string;
  limit?: number;
}>;

export function toReportDefinitionView(definition: ReportDefinition): ReportDefinitionView {
  return {
    reportDefinitionId: definition.reportDefinitionId,
    workspaceId: definition.workspaceId,
    name: definition.name,
    description: definition.description ?? null,
    kind: definition.kind,
    defaultModes: [...definition.defaultModes],
    metricKeys: [...definition.metricKeys],
    compareEnabled: definition.compareEnabled === true,
    createdAt: definition.createdAt,
    updatedAt: definition.updatedAt ?? null,
    authorityClass: 'projection',
    ledgerSoT: false,
  };
}

export function toReportDefinitionPageView(
  items: readonly ReportDefinition[],
): ReportDefinitionPageView {
  return {
    items: items.map(toReportDefinitionView),
    authorityClass: 'projection',
    ledgerSoT: false,
  };
}

export function toReportAggregationView(slice: AggregationSlice): ReportAggregationView {
  return {
    sliceId: slice.sliceId,
    reportRunId: slice.reportRunId,
    metricKey: slice.metricKey,
    mode: slice.mode ?? null,
    label: slice.label,
    value: slice.value ?? null,
    comparison: slice.comparison ?? null,
    sourceRefs: slice.sourceRefs.map((ref) => ({ ownerType: ref.ownerType, id: ref.id })),
    visualizationHint: slice.visualizationHint ?? null,
    authorityClass: 'projection',
  };
}

export function toReportRunListItemView(
  run: ReportRun,
  delivery?: { deliveryId: string; outcome: string } | null,
): ReportRunListItemView {
  return {
    reportRunId: run.reportRunId,
    workspaceId: run.workspaceId,
    reportDefinitionId: run.reportDefinitionId,
    name: run.definitionSnapshot.name,
    kind: run.definitionSnapshot.kind,
    status: run.status,
    modes: [...run.modes],
    exchangeScopeId: run.exchangeScopeId,
    tradingSessionId: run.tradingSessionId ?? null,
    libraryEntryId: run.libraryEntryId ?? null,
    windowFrom: run.window.from,
    windowTo: run.window.to,
    windowPreset: run.window.preset ?? null,
    factCount: run.sourceSummary.factCount,
    createdAt: run.createdAt,
    deliveryOutcome: delivery?.outcome ?? null,
    deliveryId: delivery?.deliveryId ?? null,
    authorityClass: 'projection',
    ledgerSoT: false,
  };
}

export function toReportRunPageView(items: readonly ReportRunListItemView[]): ReportRunPageView {
  return {
    items: [...items],
    authorityClass: 'projection',
    ledgerSoT: false,
  };
}

export function toReportRunDetailView(input: {
  run: ReportRun;
  aggregations: readonly AggregationSlice[];
  narrative: ReportRunNarrativeView | null;
  delivery: ReportRunDeliveryView | null;
}): ReportRunDetailView {
  const deliverySummary = input.delivery
    ? { deliveryId: input.delivery.deliveryId ?? '', outcome: input.delivery.outcome }
    : null;
  return {
    ...toReportRunListItemView(
      input.run,
      deliverySummary && deliverySummary.deliveryId ? deliverySummary : null,
    ),
    description: input.run.definitionSnapshot.description ?? null,
    metricKeys: [...input.run.definitionSnapshot.metricKeys],
    compareEnabled: input.run.definitionSnapshot.compareEnabled === true,
    rejectionReasons: [...(input.run.rejectionReasons ?? [])],
    sourceSummary: {
      factCount: input.run.sourceSummary.factCount,
      lakeEventIds: [...input.run.sourceSummary.lakeEventIds],
      sourceRefs: input.run.sourceSummary.sourceRefs.map((ref) => ({
        ownerType: ref.ownerType,
        id: ref.id,
      })),
    },
    aggregations: input.aggregations.map(toReportAggregationView),
    narrative: input.narrative,
    delivery: input.delivery,
    exportAvailable: true,
    exportKind: 'projection-json',
  };
}

export function runMatchesQuery(run: ReportRun, query: ListReportRunsQuery): boolean {
  if (query.kind && run.definitionSnapshot.kind !== query.kind) return false;
  if (query.status && run.status !== query.status) return false;
  if (query.mode && !(run.modes as readonly string[]).includes(query.mode)) return false;
  if (query.tradingSessionId && run.tradingSessionId !== query.tradingSessionId) return false;
  const needle = query.q?.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    run.reportRunId,
    run.reportDefinitionId,
    run.definitionSnapshot.name,
    run.definitionSnapshot.kind,
    run.status,
    run.tradingSessionId ?? '',
    run.libraryEntryId ?? '',
    run.exchangeScopeId,
    ...run.modes,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

export function toProjectionExport(detail: ReportRunDetailView): string {
  return JSON.stringify(
    {
      authorityClass: 'projection',
      ledgerSoT: false,
      exportKind: 'projection-json',
      reportRunId: detail.reportRunId,
      workspaceId: detail.workspaceId,
      name: detail.name,
      kind: detail.kind,
      status: detail.status,
      modes: detail.modes,
      createdAt: detail.createdAt,
      aggregations: detail.aggregations,
    },
    null,
    2,
  );
}

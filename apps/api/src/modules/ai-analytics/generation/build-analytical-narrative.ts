/**
 * RC-24 Epic 5 — Deterministic analytical narrative builder.
 *
 * Builds immutable narrative text from ReportRun + AggregationSlice only.
 * Never calls Lake / Session / Library / Enforcement / Orders / Ledger.
 * Never mutates the report. Never authorizes or recommends trades.
 */

import type { AggregationSlice } from '../../reporting/domain/aggregation-slice';
import type { ReportRun } from '../../reporting/domain/report-run';
import {
  createAnalyticalNarrative,
  type AnalyticalNarrative,
  type AnalyticalNarrativeKind,
} from '../domain/analytical-narrative';

const MODEL_ID = 'deterministic-report-narrator-v1' as const;

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'n/a';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return '[unserializable]';
  }
}

function sortedSlices(slices: readonly AggregationSlice[]): AggregationSlice[] {
  return [...slices].sort((a, b) => {
    if (a.metricKey !== b.metricKey) {
      return a.metricKey < b.metricKey ? -1 : 1;
    }
    const am = a.mode ?? '';
    const bm = b.mode ?? '';
    if (am !== bm) return am < bm ? -1 : 1;
    return a.sliceId < b.sliceId ? -1 : a.sliceId > b.sliceId ? 1 : 0;
  });
}

function sliceLines(slices: readonly AggregationSlice[]): string[] {
  return sortedSlices(slices).map((slice) => {
    const mode = slice.mode ? ` [${slice.mode}]` : '';
    return `- ${slice.metricKey}${mode}: ${formatValue(slice.value)}`;
  });
}

function buildText(
  kind: AnalyticalNarrativeKind,
  run: ReportRun,
  slices: readonly AggregationSlice[],
  focus?: string,
): string {
  const lines = sliceLines(slices);
  const metricsBlock = lines.length > 0 ? lines.join('\n') : '- (no aggregation slices)';
  const focusLine = focus?.trim() ? `\nFocus: ${focus.trim()}` : '';
  const window = `${run.window.from} → ${run.window.to}`;
  const modes = run.modes.join(', ');
  const definition = run.definitionSnapshot.name;

  switch (kind) {
    case 'explain':
      return [
        `Explanation for report run ${run.reportRunId} (${run.status}).`,
        `Definition: ${definition}. Window: ${window}. Modes: ${modes}.`,
        `Fact count cited by report: ${run.sourceSummary.factCount}.`,
        'Observed aggregation slices:',
        metricsBlock,
        focusLine,
        'This commentary explains the report projection only; it does not authorize trades or change Source of Truth.',
      ]
        .filter((line) => line !== '')
        .join('\n');
    case 'summarize':
      return [
        `Summary of report run ${run.reportRunId}: status=${run.status}, facts=${run.sourceSummary.factCount}, definition=${definition}.`,
        `Window ${window}; modes ${modes}.`,
        'Key slices:',
        metricsBlock,
        focusLine,
        'Non-authoritative summary derived from Reporting projections.',
      ]
        .filter((line) => line !== '')
        .join('\n');
    case 'trends':
      return [
        `Trend observations for report run ${run.reportRunId}.`,
        `Compared slices within window ${window} (modes: ${modes}).`,
        metricsBlock,
        focusLine,
        'Trends are descriptive observations of report aggregations only — not trading signals.',
      ]
        .filter((line) => line !== '')
        .join('\n');
    case 'narrative':
    default:
      return [
        `Report commentary for ${run.reportRunId} (${definition}).`,
        `Status ${run.status}; window ${window}; modes ${modes}; cited facts ${run.sourceSummary.factCount}.`,
        'Commentary sections:',
        metricsBlock,
        focusLine,
        'Narrative artifact only. Reports remain unchanged. Source of Truth wins on conflict.',
      ]
        .filter((line) => line !== '')
        .join('\n');
  }
}

export type BuildAnalyticalNarrativeInput = Readonly<{
  kind: AnalyticalNarrativeKind;
  run: ReportRun;
  slices: readonly AggregationSlice[];
  focus?: string;
  requestedAt?: string;
}>;

/**
 * Build a deterministic AnalyticalNarrative from a completed ReportRun snapshot.
 */
export function buildAnalyticalNarrativeFromReport(
  input: BuildAnalyticalNarrativeInput,
): AnalyticalNarrative {
  const { run, slices, kind } = input;
  const createdAt = input.requestedAt?.trim() || run.createdAt;
  const text = buildText(kind, run, slices, input.focus);
  const narrativeId = `nar-${stableHash(`${run.reportRunId}|${kind}|${text}`)}`;

  const sourceRefs = [
    { ownerType: 'report-run' as const, id: run.reportRunId },
    ...sortedSlices(slices).map((slice) => ({
      ownerType: 'aggregation-slice' as const,
      id: slice.sliceId,
    })),
  ];

  return createAnalyticalNarrative({
    narrativeId,
    workspaceId: run.workspaceId,
    reportRunId: run.reportRunId,
    kind,
    text,
    sourceRefs,
    modesCovered: [...run.modes],
    createdAt,
    modelMeta: Object.freeze({
      provider: 'deterministic',
      modelId: MODEL_ID,
      templateVersion: '1',
    }),
  });
}

/**
 * Fail-soft unavailable narrative when Reporting cannot supply the run.
 * Core platform continues; no SoT access attempted.
 */
export function buildUnavailableNarrative(input: {
  workspaceId: string;
  reportRunId: string;
  kind: AnalyticalNarrativeKind;
  requestedAt?: string;
}): AnalyticalNarrative {
  const createdAt = input.requestedAt?.trim() || '1970-01-01T00:00:00.000Z';
  const text = `Narrative unavailable: report run ${input.reportRunId} was not found in Reporting. No Source of Truth was queried.`;
  return createAnalyticalNarrative({
    narrativeId: `nar-${stableHash(`unavailable|${input.reportRunId}|${input.kind}`)}`,
    workspaceId: input.workspaceId,
    reportRunId: input.reportRunId,
    kind: input.kind,
    text,
    sourceRefs: [{ ownerType: 'report-run', id: input.reportRunId }],
    modesCovered: [],
    createdAt,
    modelMeta: Object.freeze({
      provider: 'deterministic',
      modelId: MODEL_ID,
      outcome: 'unavailable',
    }),
  });
}

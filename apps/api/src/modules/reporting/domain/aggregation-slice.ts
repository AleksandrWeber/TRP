/**
 * RC-24 Epic 3 — AggregationSlice (Report Section).
 *
 * Domain Model Contract §7.
 * One summarized/compared view inside a run — structure only.
 * Product alias: Report Section ≡ AggregationSlice.
 *
 * Does not compute aggregations. Does not recompute ledger balances.
 */

import {
  AGGREGATION_VISUALIZATION_HINTS,
  REPORTING_DOMAIN_AUTHORITY_CLASS,
  assertNonEmptyString,
  deepFreeze,
  isMoneyAdjacentMetricKey,
  isReportingAllowedMetricKey,
  isReportingFactMode,
  isReportingForbiddenMetricKey,
  type AggregationVisualizationHint,
  type ReportingFactMode,
  type ReportingMetricKey,
} from './reporting-domain-shared';
import { createReportingSourceRef, type ReportingSourceRef } from './reporting-source-ref';

export type AggregationSlice = Readonly<{
  sliceId: string;
  reportRunId: string;
  metricKey: ReportingMetricKey;
  /** Required when metric is money-adjacent. */
  mode?: ReportingFactMode;
  label: string;
  value?: unknown;
  comparison?: unknown;
  sourceRefs: readonly ReportingSourceRef[];
  authorityClass: typeof REPORTING_DOMAIN_AUTHORITY_CLASS;
  visualizationHint?: AggregationVisualizationHint;
}>;

export type CreateAggregationSliceInput = Readonly<{
  sliceId: string;
  reportRunId: string;
  metricKey: string;
  mode?: string;
  label: string;
  value?: unknown;
  comparison?: unknown;
  sourceRefs: readonly Readonly<{ ownerType: string; id: string }>[];
  visualizationHint?: string;
}>;

/**
 * Create an immutable AggregationSlice (Report Section).
 * Validates mode labeling for money-adjacent metrics.
 * Rejects forbidden shadow-accounting metric keys.
 * Does not aggregate Lake data.
 */
export function createAggregationSlice(input: CreateAggregationSliceInput): AggregationSlice {
  const sliceId = assertNonEmptyString(input.sliceId, 'sliceId');
  const reportRunId = assertNonEmptyString(input.reportRunId, 'reportRunId');
  const label = assertNonEmptyString(input.label, 'label');
  const metricKeyRaw = assertNonEmptyString(input.metricKey, 'metricKey');

  if (isReportingForbiddenMetricKey(metricKeyRaw)) {
    throw new Error(`forbidden metric key (shadow accounting): ${metricKeyRaw}`);
  }
  if (!isReportingAllowedMetricKey(metricKeyRaw)) {
    throw new Error(`metric key not in allowlist: ${metricKeyRaw}`);
  }

  if (!input.sourceRefs || input.sourceRefs.length === 0) {
    throw new Error('sourceRefs must be non-empty (Reporting references facts; never owns them)');
  }
  const sourceRefs = Object.freeze(input.sourceRefs.map((ref) => createReportingSourceRef(ref)));

  let mode: ReportingFactMode | undefined;
  if (input.mode !== undefined && input.mode !== null && input.mode.trim() !== '') {
    const trimmed = input.mode.trim();
    if (!isReportingFactMode(trimmed)) {
      throw new Error(`unknown reporting mode: ${input.mode}`);
    }
    mode = trimmed;
  }

  if (isMoneyAdjacentMetricKey(metricKeyRaw) && mode === undefined) {
    throw new Error(`money-adjacent metric ${metricKeyRaw} requires mode labeling`);
  }

  let visualizationHint: AggregationVisualizationHint | undefined;
  if (
    input.visualizationHint !== undefined &&
    input.visualizationHint !== null &&
    input.visualizationHint.trim() !== ''
  ) {
    const hint = input.visualizationHint.trim();
    if (!(AGGREGATION_VISUALIZATION_HINTS as readonly string[]).includes(hint)) {
      throw new Error(
        `visualizationHint must be one of: ${AGGREGATION_VISUALIZATION_HINTS.join(', ')}`,
      );
    }
    visualizationHint = hint as AggregationVisualizationHint;
  }

  return deepFreeze({
    sliceId,
    reportRunId,
    metricKey: metricKeyRaw,
    ...(mode !== undefined ? { mode } : {}),
    label,
    ...(input.value !== undefined ? { value: input.value } : {}),
    ...(input.comparison !== undefined ? { comparison: input.comparison } : {}),
    sourceRefs,
    authorityClass: REPORTING_DOMAIN_AUTHORITY_CLASS,
    ...(visualizationHint !== undefined ? { visualizationHint } : {}),
  });
}

/** Product / UX alias — Report Section ≡ AggregationSlice. */
export type ReportSection = AggregationSlice;
export const createReportSection = createAggregationSlice;

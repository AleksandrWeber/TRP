/**
 * RC-24 Epic 4 — Deterministic aggregation over Reporting Lake read models.
 *
 * Pure functions. Sorted inputs. Stable outputs.
 * Never recomputes authoritative ledger balances.
 */

import { createAggregationSlice, type AggregationSlice } from '../domain/aggregation-slice';
import type { ReportingAnalyticalFact } from '../domain/reporting-analytical-read-model';
import {
  isMoneyAdjacentMetricKey,
  type ReportingFactMode,
  type ReportingMetricKey,
} from '../domain/reporting-domain-shared';

function sortedFacts(facts: readonly ReportingAnalyticalFact[]): ReportingAnalyticalFact[] {
  return [...facts].sort((a, b) => {
    if (a.occurredAt !== b.occurredAt) {
      return a.occurredAt < b.occurredAt ? -1 : 1;
    }
    return a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0;
  });
}

function countBy(
  facts: readonly ReportingAnalyticalFact[],
  keyFn: (f: ReportingAnalyticalFact) => string | undefined,
): Readonly<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const fact of facts) {
    const key = keyFn(fact) ?? '_none';
    out[key] = (out[key] ?? 0) + 1;
  }
  return Object.freeze(
    Object.fromEntries(Object.entries(out).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
  );
}

function sumPayloadNumber(facts: readonly ReportingAnalyticalFact[], field: string): number | null {
  let sum = 0;
  let seen = false;
  for (const fact of facts) {
    if (fact.payload && typeof fact.payload === 'object' && !Array.isArray(fact.payload)) {
      const value = (fact.payload as Record<string, unknown>)[field];
      if (typeof value === 'number' && Number.isFinite(value)) {
        sum += value;
        seen = true;
      }
    }
  }
  return seen ? sum : null;
}

function sourceRefsFor(facts: readonly ReportingAnalyticalFact[]) {
  return facts.map((fact) => ({
    ownerType: 'knowledge-lake' as const,
    id: fact.eventId,
  }));
}

function sliceId(reportRunId: string, metricKey: string, mode?: string): string {
  return mode ? `${reportRunId}::${metricKey}::${mode}` : `${reportRunId}::${metricKey}`;
}

export type AggregateReportingFactsInput = Readonly<{
  reportRunId: string;
  metricKeys: readonly ReportingMetricKey[];
  facts: readonly ReportingAnalyticalFact[];
  modes: readonly ReportingFactMode[];
}>;

/**
 * Build AggregationSlices deterministically from sorted Lake facts.
 * Money-adjacent metrics are emitted per requested mode with mode labels.
 */
export function aggregateReportingFacts(
  input: AggregateReportingFactsInput,
): readonly AggregationSlice[] {
  const facts = sortedFacts(input.facts);
  const modes = [...input.modes].sort();
  const slices: AggregationSlice[] = [];

  for (const metricKey of input.metricKeys) {
    if (isMoneyAdjacentMetricKey(metricKey)) {
      for (const mode of modes) {
        const modeFacts = facts.filter((f) => f.mode === mode);
        const value =
          metricKey === 'paper_vs_live_count'
            ? modeFacts.length
            : buildMetricValue(metricKey, modeFacts, modes);
        slices.push(
          createAggregationSlice({
            sliceId: sliceId(input.reportRunId, metricKey, mode),
            reportRunId: input.reportRunId,
            metricKey,
            mode,
            label: `${metricKey} (${mode})`,
            value,
            sourceRefs:
              modeFacts.length > 0
                ? sourceRefsFor(modeFacts)
                : [{ ownerType: 'knowledge-lake', id: `${input.reportRunId}:empty:${mode}` }],
            visualizationHint: metricKey === 'paper_vs_live_count' ? 'comparison' : 'kpi',
          }),
        );
      }
      continue;
    }

    slices.push(
      createAggregationSlice({
        sliceId: sliceId(input.reportRunId, metricKey),
        reportRunId: input.reportRunId,
        metricKey,
        label: metricKey,
        value: buildMetricValue(metricKey, facts, modes),
        sourceRefs:
          facts.length > 0
            ? sourceRefsFor(facts)
            : [{ ownerType: 'knowledge-lake', id: `${input.reportRunId}:empty` }],
        visualizationHint: metricKey.startsWith('facts_by_') ? 'table' : 'kpi',
      }),
    );
  }

  return Object.freeze(slices);
}

function buildMetricValue(
  metricKey: ReportingMetricKey,
  facts: readonly ReportingAnalyticalFact[],
  allModes: readonly ReportingFactMode[],
): unknown {
  switch (metricKey) {
    case 'fact_count':
      return facts.length;
    case 'facts_by_category':
      return countBy(facts, (f) => f.category);
    case 'facts_by_producer':
      return countBy(facts, (f) => f.producer);
    case 'facts_by_mode':
      return countBy(facts, (f) => f.mode);
    case 'session_activity':
      return countBy(facts, (f) => f.tradingSessionId);
    case 'scope_activity':
      return countBy(facts, (f) => f.exchangeScopeId);
    case 'correlation_coverage': {
      const ids = new Set(facts.map((f) => f.correlationId).filter((id): id is string => !!id));
      return ids.size;
    }
    case 'paper_vs_live_count': {
      const counts: Record<string, number> = {};
      for (const mode of allModes) {
        counts[mode] = facts.filter((f) => f.mode === mode).length;
      }
      for (const mode of ['paper', 'live', 'research', 'system'] as const) {
        if (counts[mode] === undefined) {
          counts[mode] = facts.filter((f) => f.mode === mode).length;
        }
      }
      return Object.freeze(
        Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))),
      );
    }
    case 'display_pnl_projection':
      return sumPayloadNumber(facts, 'displayPnl');
    case 'display_fees_projection':
      return sumPayloadNumber(facts, 'displayFees');
    case 'display_exposure_projection':
      return sumPayloadNumber(facts, 'displayExposure');
    default:
      return null;
  }
}

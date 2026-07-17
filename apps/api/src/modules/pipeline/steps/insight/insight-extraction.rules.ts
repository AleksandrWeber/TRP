import type { CreateInsightInput } from '../../../insight/insight-domain.service';
import { InsightSource } from '../../../insight/insight-source';
import { InsightType } from '../../../insight/insight-type';
import type { KnowledgeEntry } from '../../../knowledge/knowledge-entry';
import type { InsightExtractionContext } from './insight-pipeline-context';

const VERDICT_TAGS = new Set(['pass', 'fail', 'needs_review']);

/**
 * Deterministic Insight drafts from Knowledge entries (US096).
 * No LLM / AI providers — rule-based only.
 */
export function extractInsightDrafts(extraction: InsightExtractionContext): CreateInsightInput[] {
  const entries = extraction.knowledgeEntries;
  const drafts: CreateInsightInput[] = [];
  const baseRefs = {
    campaignSessionId: extraction.campaignSessionId,
    knowledgeEntryIds: extraction.knowledgeEntryIds,
    sources: [InsightSource.Knowledge] as InsightSource[],
    metadata: {
      model: 'deterministic-rules',
      promptVersion: 'insight-extract-1.0.0',
    },
  };

  if (entries.length === 0) {
    drafts.push({
      ...baseRefs,
      type: InsightType.OBSERVATION,
      title: 'No Knowledge entries available',
      summary: 'Insight extraction found zero KnowledgeEntry references',
      confidence: 1,
      experimentId: extraction.experimentIds[0],
    });
    return drafts;
  }

  drafts.push(buildSummaryDraft(entries, baseRefs, extraction));

  const consistent = buildConsistentTrendDraft(entries, baseRefs, extraction);
  if (consistent) drafts.push(consistent);

  const repeated = buildRepeatedObservationDraft(entries, baseRefs, extraction);
  if (repeated) drafts.push(repeated);

  const anomaly = buildAnomalyDraft(entries, baseRefs, extraction);
  if (anomaly) drafts.push(anomaly);

  return drafts;
}

function buildSummaryDraft(
  entries: KnowledgeEntry[],
  baseRefs: Pick<
    CreateInsightInput,
    'campaignSessionId' | 'knowledgeEntryIds' | 'sources' | 'metadata'
  >,
  extraction: InsightExtractionContext,
): CreateInsightInput {
  const strategies = unique(
    entries.map((e) => e.metadata.strategyId).filter((v): v is string => Boolean(v)),
  );
  const datasets = unique(
    entries.map((e) => e.metadata.datasetId).filter((v): v is string => Boolean(v)),
  );

  return {
    ...baseRefs,
    type: InsightType.SUMMARY,
    title: `Knowledge summary (${entries.length} entries)`,
    summary: [
      `${entries.length} KnowledgeEntry reference(s)`,
      strategies.length ? `strategies: ${strategies.join(', ')}` : 'strategies: none',
      datasets.length ? `datasets: ${datasets.join(', ')}` : 'datasets: none',
    ].join('; '),
    confidence: 1,
    experimentId: singleOrUndefined(extraction.experimentIds) ?? singleExperiment(entries),
  };
}

function buildConsistentTrendDraft(
  entries: KnowledgeEntry[],
  baseRefs: Pick<
    CreateInsightInput,
    'campaignSessionId' | 'knowledgeEntryIds' | 'sources' | 'metadata'
  >,
  extraction: InsightExtractionContext,
): CreateInsightInput | null {
  if (entries.length < 2) return null;

  const verdicts = entries.map(primaryVerdictTag).filter((v): v is string => Boolean(v));
  if (verdicts.length !== entries.length) return null;

  const uniqueVerdicts = unique(verdicts);
  if (uniqueVerdicts.length !== 1) return null;

  const verdict = uniqueVerdicts[0]!;
  return {
    ...baseRefs,
    type: InsightType.TREND,
    title: `Consistent ${verdict} trend`,
    summary: `All ${entries.length} Knowledge entries share verdict tag "${verdict}"`,
    confidence: 0.9,
    experimentId: singleOrUndefined(extraction.experimentIds) ?? singleExperiment(entries),
  };
}

function buildRepeatedObservationDraft(
  entries: KnowledgeEntry[],
  baseRefs: Pick<
    CreateInsightInput,
    'campaignSessionId' | 'knowledgeEntryIds' | 'sources' | 'metadata'
  >,
  extraction: InsightExtractionContext,
): CreateInsightInput | null {
  if (entries.length < 2) return null;

  const titleCounts = countBy(entries.map((e) => e.title.trim().toLowerCase()));
  const duplicatedTitles = [...titleCounts.entries()].filter(([, count]) => count >= 2);
  if (duplicatedTitles.length === 0) return null;

  const [titleKey, count] = duplicatedTitles[0]!;
  const sample = entries.find((e) => e.title.trim().toLowerCase() === titleKey);

  return {
    ...baseRefs,
    type: InsightType.PATTERN,
    title: 'Repeated observation',
    summary: `Duplicated finding "${sample?.title ?? titleKey}" appears ${count} times`,
    confidence: 0.85,
    experimentId: singleOrUndefined(extraction.experimentIds) ?? singleExperiment(entries),
  };
}

function buildAnomalyDraft(
  entries: KnowledgeEntry[],
  baseRefs: Pick<
    CreateInsightInput,
    'campaignSessionId' | 'knowledgeEntryIds' | 'sources' | 'metadata'
  >,
  extraction: InsightExtractionContext,
): CreateInsightInput | null {
  if (entries.length < 2) return null;

  const verdicts = unique(entries.map(primaryVerdictTag).filter((v): v is string => Boolean(v)));
  if (verdicts.length < 2) return null;

  return {
    ...baseRefs,
    type: InsightType.ANOMALY,
    title: 'Conflicting Knowledge verdicts',
    summary: `Mixed verdict tags across Knowledge entries: ${verdicts.join(', ')}`,
    confidence: 0.75,
    experimentId: singleOrUndefined(extraction.experimentIds) ?? singleExperiment(entries),
  };
}

function primaryVerdictTag(entry: KnowledgeEntry): string | undefined {
  return entry.tags.map((t) => t.toLowerCase()).find((t) => VERDICT_TAGS.has(t));
}

function singleExperiment(entries: KnowledgeEntry[]): string | undefined {
  const ids = unique(entries.map((e) => e.experimentId));
  return ids.length === 1 ? ids[0] : undefined;
}

function singleOrUndefined(values: string[]): string | undefined {
  return values.length === 1 ? values[0] : undefined;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function countBy(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

import type { AiAnalyticsKind } from '../shared/api';

export const AI_ANALYTICS_KIND_FILTERS: { id: 'all' | AiAnalyticsKind; label: string }[] = [
  { id: 'all', label: 'All kinds' },
  { id: 'narrative', label: 'Narrative' },
  { id: 'explain', label: 'Explain' },
  { id: 'summarize', label: 'Summarize' },
  { id: 'trends', label: 'Trends' },
];

export const AI_ANALYTICS_GENERATE_KINDS: { id: AiAnalyticsKind; label: string }[] = [
  { id: 'narrative', label: 'Narrative' },
  { id: 'explain', label: 'Explain' },
  { id: 'summarize', label: 'Summarize' },
  { id: 'trends', label: 'Trends' },
];

export function kindLabel(kind: string): string {
  if (kind === 'explain') return 'Explain';
  if (kind === 'summarize') return 'Summarize';
  if (kind === 'trends') return 'Trends';
  return 'Narrative';
}

export function buildAiAnalyticsListQuery(input: {
  search: string;
  kind: 'all' | AiAnalyticsKind;
  reportRunId: string;
  libraryEntryId: string;
}) {
  return {
    ...(input.search.trim() ? { q: input.search.trim() } : {}),
    ...(input.kind !== 'all' ? { kind: input.kind } : {}),
    ...(input.reportRunId.trim() ? { reportRunId: input.reportRunId.trim() } : {}),
    ...(input.libraryEntryId.trim() ? { libraryEntryId: input.libraryEntryId.trim() } : {}),
  };
}

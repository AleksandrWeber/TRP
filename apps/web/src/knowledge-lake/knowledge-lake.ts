export type KnowledgeLakeCategoryFilter =
  'all' | 'Market' | 'Trading' | 'Risk' | 'Paper' | 'Research' | 'Reporting' | 'System';

export type KnowledgeLakeModeFilter = 'all' | 'paper' | 'live' | 'research' | 'system';

export const KNOWLEDGE_LAKE_CATEGORY_FILTERS: { id: KnowledgeLakeCategoryFilter; label: string }[] =
  [
    { id: 'all', label: 'All types' },
    { id: 'Market', label: 'Market' },
    { id: 'Trading', label: 'Trading' },
    { id: 'Risk', label: 'Risk' },
    { id: 'Paper', label: 'Paper' },
    { id: 'Research', label: 'Research' },
    { id: 'Reporting', label: 'Reporting' },
    { id: 'System', label: 'System' },
  ];

export const KNOWLEDGE_LAKE_MODE_FILTERS: { id: KnowledgeLakeModeFilter; label: string }[] = [
  { id: 'all', label: 'All modes' },
  { id: 'paper', label: 'Paper' },
  { id: 'live', label: 'Live (labeled projection)' },
  { id: 'research', label: 'Research' },
  { id: 'system', label: 'System' },
];

export function modeBadgeLabel(mode: string): string {
  if (mode === 'live') return 'live (projection)';
  return mode;
}

export function buildKnowledgeLakeListQuery(input: {
  search: string;
  producer: string;
  category: KnowledgeLakeCategoryFilter;
  mode: KnowledgeLakeModeFilter;
  libraryEntryId: string;
  reportRunId: string;
  occurredFrom: string;
  occurredTo: string;
}) {
  return {
    ...(input.search.trim() ? { q: input.search.trim() } : {}),
    ...(input.producer.trim() ? { producer: input.producer.trim() } : {}),
    ...(input.category !== 'all' ? { category: input.category } : {}),
    ...(input.mode !== 'all' ? { mode: input.mode } : {}),
    ...(input.libraryEntryId.trim() ? { libraryEntryId: input.libraryEntryId.trim() } : {}),
    ...(input.reportRunId.trim() ? { reportRunId: input.reportRunId.trim() } : {}),
    ...(input.occurredFrom.trim() ? { occurredFrom: input.occurredFrom.trim() } : {}),
    ...(input.occurredTo.trim() ? { occurredTo: input.occurredTo.trim() } : {}),
  };
}

export function buildProjectionExport(detail: {
  entryId: string;
  eventId: string;
  workspaceId: string;
  producer: string;
  category: string;
  mode: string;
  occurredAt: string;
  admittedAt: string;
  payload: unknown;
  sourceRef: { ownerType: string; id: string } | null;
  schemaVersion: string;
}): string {
  return JSON.stringify(
    {
      authorityClass: 'projection',
      ledgerSoT: false,
      exportKind: 'projection-json',
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

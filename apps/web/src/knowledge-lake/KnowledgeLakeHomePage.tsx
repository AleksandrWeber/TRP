import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type KnowledgeLakeListItemView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { KnowledgeLakeHomeView } from './KnowledgeLakeHomeView';
import {
  buildKnowledgeLakeListQuery,
  type KnowledgeLakeCategoryFilter,
  type KnowledgeLakeModeFilter,
} from './knowledge-lake';

export function KnowledgeLakeHomePage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<KnowledgeLakeListItemView[]>([]);
  const [search, setSearch] = useState('');
  const [producer, setProducer] = useState('');
  const [category, setCategory] = useState<KnowledgeLakeCategoryFilter>('all');
  const [mode, setMode] = useState<KnowledgeLakeModeFilter>('all');
  const [libraryEntryId, setLibraryEntryId] = useState('');
  const [reportRunId, setReportRunId] = useState('');
  const [occurredFrom, setOccurredFrom] = useState('');
  const [occurredTo, setOccurredTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const query = buildKnowledgeLakeListQuery({
      search,
      producer,
      category,
      mode,
      libraryEntryId,
      reportRunId,
      occurredFrom: occurredFrom ? `${occurredFrom}T00:00:00.000Z` : '',
      occurredTo: occurredTo ? `${occurredTo}T00:00:00.000Z` : '',
    });
    const request = query.q ? api.searchKnowledgeLake(query) : api.listKnowledgeLake(query);
    request
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Knowledge Lake.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    activeWorkspace.id,
    search,
    producer,
    category,
    mode,
    libraryEntryId,
    reportRunId,
    occurredFrom,
    occurredTo,
  ]);

  return (
    <KnowledgeLakeHomeView
      items={items}
      search={search}
      producer={producer}
      category={category}
      mode={mode}
      libraryEntryId={libraryEntryId}
      reportRunId={reportRunId}
      occurredFrom={occurredFrom}
      occurredTo={occurredTo}
      loading={loading}
      error={error}
      onSearch={setSearch}
      onProducer={setProducer}
      onCategory={setCategory}
      onMode={setMode}
      onLibraryEntryId={setLibraryEntryId}
      onReportRunId={setReportRunId}
      onOccurredFrom={setOccurredFrom}
      onOccurredTo={setOccurredTo}
    />
  );
}

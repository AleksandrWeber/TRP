import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type StrategyLibraryRecordView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { RuntimeValidationView } from './RuntimeValidationView';
import { buildRuntimeValidationRequest } from './runtime-validation';

export function RuntimeValidationPage() {
  const { activeWorkspace } = useWorkspace();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<StrategyLibraryRecordView[]>([]);
  const [selected, setSelected] = useState<StrategyLibraryRecordView | null>(null);
  const [exchangeScopeId, setExchangeScopeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listStrategyLibrary({ includeArchived: true, limit: 200 })
      .then((page) => {
        if (cancelled) return;
        setEntries(page.items);
        const libraryEntryId = searchParams.get('libraryEntryId');
        if (libraryEntryId) {
          const match = page.items.find((item) => item.version.libraryEntryId === libraryEntryId);
          if (match) setSelected(match);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Strategy Library.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, searchParams]);

  async function onSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.runRuntimeValidation(
        buildRuntimeValidationRequest(selected, exchangeScopeId),
      );
      navigate(`/runtime-validation/${result.validationId}`);
    } catch (err: unknown) {
      setError(toUserFacingError(err, 'Runtime Validation failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RuntimeValidationView
      entries={entries}
      selected={selected}
      exchangeScopeId={exchangeScopeId}
      loading={loading}
      submitting={submitting}
      error={error}
      onSelect={setSelected}
      onExchangeScope={setExchangeScopeId}
      onSubmit={() => void onSubmit()}
    />
  );
}

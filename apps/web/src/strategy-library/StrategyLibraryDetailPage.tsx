import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type StrategyLibraryEligibilityView,
  type StrategyLibraryRecordView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { StrategyLibraryDetailView } from './StrategyLibraryDetailView';

export function StrategyLibraryDetailPage() {
  const { libraryEntryId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<StrategyLibraryRecordView | null>(null);
  const [eligibility, setEligibility] = useState<StrategyLibraryEligibilityView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getStrategyLibraryEntry(libraryEntryId)
      .then(async (entry) => {
        if (cancelled) return;
        setRecord(entry);
        try {
          const decision = await api.checkStrategyLibraryEligibility(libraryEntryId);
          if (!cancelled) setEligibility(decision);
        } catch {
          if (!cancelled) setEligibility(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setEligibility(null);
          setError(toUserFacingError(err, 'Could not load library version.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, libraryEntryId]);

  return (
    <StrategyLibraryDetailView
      record={record}
      eligibility={eligibility}
      error={error}
      loading={loading}
    />
  );
}

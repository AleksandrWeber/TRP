import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type AiAnalyticsHistoryItemView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { AiAnalyticsHistoryView } from './AiAnalyticsHistoryView';

export function AiAnalyticsHistoryPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<AiAnalyticsHistoryItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listAiAnalyticsHistory()
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load AI Analytics history.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <AiAnalyticsHistoryView items={items} loading={loading} error={error} />;
}

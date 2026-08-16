import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type KnowledgeLakeHistoryItemView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { KnowledgeLakeHistoryView } from './KnowledgeLakeHistoryView';

export function KnowledgeLakeHistoryPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<KnowledgeLakeHistoryItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listKnowledgeLakeHistory()
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Knowledge Lake history.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <KnowledgeLakeHistoryView items={items} loading={loading} error={error} />;
}

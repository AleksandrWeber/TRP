import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type MarketProfileVersionListItemView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { MarketProfileHistoryView } from './MarketProfileHistoryView';

export function MarketProfileHistoryPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<MarketProfileVersionListItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listMarketProfileHistory()
      .then((page) => {
        if (!cancelled) setItems([...page.items]);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Profile history.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <MarketProfileHistoryView items={items} loading={loading} error={error} />;
}

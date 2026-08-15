import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type MarketStateVersionListItemView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { MarketStateHistoryView } from './MarketStateHistoryView';

export function MarketStateHistoryPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<MarketStateVersionListItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listMarketStateHistory()
      .then((page) => {
        if (!cancelled) setItems([...page.items]);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Market State history.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <MarketStateHistoryView items={items} loading={loading} error={error} />;
}

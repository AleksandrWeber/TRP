import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type MarketProfileWorkspaceView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { MarketProfileHomeView } from './MarketProfileHomeView';

export function MarketProfileHomePage() {
  const { activeWorkspace } = useWorkspace();
  const [workspace, setWorkspace] = useState<MarketProfileWorkspaceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getMarketProfileWorkspace()
      .then((payload) => {
        if (!cancelled) setWorkspace(payload);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Market Profile.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <MarketProfileHomeView workspace={workspace} loading={loading} error={error} />;
}

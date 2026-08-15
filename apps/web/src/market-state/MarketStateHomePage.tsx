import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type MarketStateWorkspaceView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { MarketStateHomeView } from './MarketStateHomeView';

export function MarketStateHomePage() {
  const { activeWorkspace } = useWorkspace();
  const [workspace, setWorkspace] = useState<MarketStateWorkspaceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getMarketStateWorkspace()
      .then((payload) => {
        if (!cancelled) setWorkspace(payload);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Market State.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <MarketStateHomeView workspace={workspace} loading={loading} error={error} />;
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type MarketStateTargetDetailView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { MarketStateTargetView, type MarketStateTargetTab } from './MarketStateTargetView';

export function MarketStateTargetPage() {
  const { targetId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<MarketStateTargetDetailView | null>(null);
  const [tab, setTab] = useState<MarketStateTargetTab>('current');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = decodeURIComponent(targetId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getMarketStateTarget(id)
      .then((item) => {
        if (!cancelled) setRecord(item);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load Market State.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, id]);

  function refresh() {
    setRefreshing(true);
    setError(null);
    api
      .refreshMarketState(id)
      .then(() => api.getMarketStateTarget(id))
      .then(setRecord)
      .catch((err: unknown) => {
        setError(toUserFacingError(err, 'Could not refresh Market State.'));
      })
      .finally(() => setRefreshing(false));
  }

  return (
    <MarketStateTargetView
      record={record}
      tab={tab}
      loading={loading}
      refreshing={refreshing}
      error={error}
      onTab={setTab}
      onRefresh={refresh}
    />
  );
}

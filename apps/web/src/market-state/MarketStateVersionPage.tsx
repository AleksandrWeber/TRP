import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type MarketStateDetailView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { MarketStateVersionView } from './MarketStateVersionView';

export function MarketStateVersionPage() {
  const { targetId = '', version = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<MarketStateDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = decodeURIComponent(targetId);
  const versionNumber = Number(version);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    if (!Number.isInteger(versionNumber) || versionNumber < 1) {
      setRecord(null);
      setError('Market State version not found.');
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }
    api
      .getMarketStateVersion(id, versionNumber)
      .then((item) => {
        if (!cancelled) setRecord(item);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load Market State version.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, id, versionNumber]);

  return <MarketStateVersionView record={record} loading={loading} error={error} />;
}

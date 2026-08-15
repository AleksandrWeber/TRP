import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type StrategyDeploymentView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { DeploymentListView } from './DeploymentListView';

export function DeploymentListPage() {
  return <DeploymentCollectionPage variant="list" />;
}

export function DeploymentHistoryPage() {
  return <DeploymentCollectionPage variant="history" />;
}

function DeploymentCollectionPage({ variant }: { variant: 'list' | 'history' }) {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<StrategyDeploymentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listStrategyDeployments()
      .then((list) => {
        if (cancelled) return;
        const sorted = [...list].sort((left, right) =>
          right.recordedAt.localeCompare(left.recordedAt),
        );
        setItems(sorted);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Deployments.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <DeploymentListView items={items} loading={loading} error={error} variant={variant} />;
}

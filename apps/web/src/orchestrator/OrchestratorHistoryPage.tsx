import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type OrchestrationRunView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { OrchestratorHistoryView } from './OrchestratorHistoryView';

export function OrchestratorHistoryPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<OrchestrationRunView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listOrchestrationRuns()
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load orchestration history.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <OrchestratorHistoryView items={items} loading={loading} error={error} />;
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type OrchestrationRunDetailView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { OrchestratorRunView } from './OrchestratorRunView';

export function OrchestratorRunPage() {
  const { runId } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<OrchestrationRunDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getOrchestrationRun(runId)
      .then((run) => {
        if (!cancelled) setRecord(run);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load orchestration.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, runId]);

  return <OrchestratorRunView record={record} loading={loading} error={error} />;
}

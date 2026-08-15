import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type StrategyDeploymentView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { DeploymentDetailView } from './DeploymentDetailView';

export function DeploymentDetailPage() {
  const { deploymentId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<StrategyDeploymentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getStrategyDeployment(deploymentId)
      .then((deployment) => {
        if (!cancelled) setRecord(deployment);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load Deployment.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, deploymentId]);

  async function onApprove() {
    setApproving(true);
    setError(null);
    try {
      const approved = await api.approveStrategyDeployment(deploymentId);
      setRecord(approved);
    } catch (err: unknown) {
      setError(toUserFacingError(err, 'Could not approve Deployment.'));
    } finally {
      setApproving(false);
    }
  }

  return (
    <DeploymentDetailView
      record={record}
      loading={loading}
      error={error}
      approving={approving}
      onApprove={() => void onApprove()}
    />
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type CertificationAttemptView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { CertificationResultView } from './CertificationResultView';

export function CertificationResultPage() {
  const { attemptId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<CertificationAttemptView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getCertification(attemptId)
      .then((attempt) => {
        if (!cancelled) setRecord(attempt);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load certification result.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, attemptId]);

  return <CertificationResultView record={record} loading={loading} error={error} />;
}

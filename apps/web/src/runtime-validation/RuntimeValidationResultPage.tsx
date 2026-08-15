import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type RuntimeValidationView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { RuntimeValidationResultView } from './RuntimeValidationResultView';

export function RuntimeValidationResultPage() {
  const { validationId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<RuntimeValidationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getRuntimeValidation(validationId)
      .then((item) => {
        if (!cancelled) setRecord(item);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load validation result.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, validationId]);

  return <RuntimeValidationResultView record={record} loading={loading} error={error} />;
}

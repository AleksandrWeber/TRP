import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type QualificationRunDetailView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { QualificationRunView } from './QualificationRunView';

export function QualificationRunPage() {
  const { qualificationRunId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<QualificationRunDetailView | null>(null);
  const [failReason, setFailReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = decodeURIComponent(qualificationRunId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getQualificationRun(id)
      .then((item) => {
        if (!cancelled) setRecord(item);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load qualification run.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, id]);

  function apply(next: Promise<unknown>) {
    setBusy(true);
    setError(null);
    next
      .then(() => api.getQualificationRun(id))
      .then(setRecord)
      .catch((err: unknown) => {
        setError(toUserFacingError(err, 'Could not update qualification run.'));
      })
      .finally(() => setBusy(false));
  }

  return (
    <QualificationRunView
      record={record}
      failReason={failReason}
      loading={loading}
      busy={busy}
      error={error}
      onFailReason={setFailReason}
      onConfirm={() => apply(api.confirmQualificationRun(id))}
      onCancel={() => apply(api.cancelQualificationRun(id))}
      onComplete={() => apply(api.completeQualificationRun(id))}
      onFail={() => apply(api.failQualificationRun(id, [failReason.trim()]))}
    />
  );
}

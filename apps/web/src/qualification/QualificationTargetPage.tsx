import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type QualificationTargetDetailView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { QualificationTargetView, type QualificationTargetTab } from './QualificationTargetView';
import type { QualificationMode } from './qualification';

export function QualificationTargetPage() {
  const { targetId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<QualificationTargetDetailView | null>(null);
  const [tab, setTab] = useState<QualificationTargetTab>('summary');
  const [mode, setMode] = useState<QualificationMode>('paper');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = decodeURIComponent(targetId);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getQualificationTarget(id)
      .then((item) => {
        if (!cancelled) setRecord(item);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load qualification target.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, id]);

  function requalify() {
    setBusy(true);
    setError(null);
    api
      .requalifyQualificationTarget(id, mode)
      .then(() => api.getQualificationTarget(id))
      .then(setRecord)
      .catch((err: unknown) => {
        setError(toUserFacingError(err, 'Could not request requalification.'));
      })
      .finally(() => setBusy(false));
  }

  return (
    <QualificationTargetView
      record={record}
      tab={tab}
      mode={mode}
      loading={loading}
      busy={busy}
      error={error}
      onTab={setTab}
      onMode={setMode}
      onRequalify={requalify}
    />
  );
}

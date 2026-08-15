import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type ReportRunDetailView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { ReportingDetailView } from './ReportingDetailView';

export function ReportingDetailPage() {
  const { reportRunId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<ReportRunDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getReportRun(reportRunId)
      .then((item) => {
        if (!cancelled) setRecord(item);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load report run.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, reportRunId]);

  return (
    <ReportingDetailView
      record={record}
      loading={loading}
      error={error}
      onExport={downloadProjection}
    />
  );
}

function downloadProjection(payload: string) {
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'report-run.projection.json';
  link.click();
  URL.revokeObjectURL(url);
}

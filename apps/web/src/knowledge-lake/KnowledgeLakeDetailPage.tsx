import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type KnowledgeLakeDetailView as KnowledgeLakeDetail } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { KnowledgeLakeDetailView } from './KnowledgeLakeDetailView';

export function KnowledgeLakeDetailPage() {
  const { entryId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<KnowledgeLakeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getKnowledgeLakeEntry(entryId)
      .then((item) => {
        if (!cancelled) setRecord(item);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load Knowledge Lake entry.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, entryId]);

  return (
    <KnowledgeLakeDetailView
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
  link.download = 'knowledge-lake.projection.json';
  link.click();
  URL.revokeObjectURL(url);
}

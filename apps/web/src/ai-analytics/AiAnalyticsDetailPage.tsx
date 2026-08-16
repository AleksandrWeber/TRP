import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type AiAnalyticsDetailView as AiAnalyticsDetail } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { AiAnalyticsDetailView } from './AiAnalyticsDetailView';

export function AiAnalyticsDetailPage() {
  const { analysisId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<AiAnalyticsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getAiAnalytics(analysisId)
      .then((item) => {
        if (!cancelled) setRecord(item);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load AI analysis.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, analysisId]);

  return <AiAnalyticsDetailView record={record} loading={loading} error={error} />;
}

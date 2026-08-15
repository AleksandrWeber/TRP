import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type ReportRunListItemView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { ReportingHistoryView } from './ReportingHistoryView';

export function ReportingHistoryPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<ReportRunListItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listReportRuns()
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load report history.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <ReportingHistoryView items={items} loading={loading} error={error} />;
}

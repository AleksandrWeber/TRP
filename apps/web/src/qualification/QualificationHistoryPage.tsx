import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type QualificationRunListItemView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { QualificationHistoryView } from './QualificationHistoryView';

export function QualificationHistoryPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<QualificationRunListItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listQualificationRuns()
      .then((page) => {
        if (!cancelled) setItems([...page.items]);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load qualification history.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <QualificationHistoryView items={items} loading={loading} error={error} />;
}

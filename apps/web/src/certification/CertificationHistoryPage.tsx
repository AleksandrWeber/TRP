import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type CertificationAttemptView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { CertificationHistoryView } from './CertificationHistoryView';

export function CertificationHistoryPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<CertificationAttemptView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listCertifications()
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load certification history.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <CertificationHistoryView items={items} loading={loading} error={error} />;
}

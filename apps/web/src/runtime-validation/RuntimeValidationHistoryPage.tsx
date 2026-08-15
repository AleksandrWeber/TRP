import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type RuntimeValidationView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { RuntimeValidationHistoryView } from './RuntimeValidationHistoryView';

export function RuntimeValidationHistoryPage() {
  const { activeWorkspace } = useWorkspace();
  const [items, setItems] = useState<RuntimeValidationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listRuntimeValidations()
      .then((page) => {
        if (!cancelled) setItems(page.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load validation history.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return <RuntimeValidationHistoryView items={items} loading={loading} error={error} />;
}

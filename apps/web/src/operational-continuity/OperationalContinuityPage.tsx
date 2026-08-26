import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type OperationalContinuityOwnerView,
  type OperationalContinuityReadinessView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { ErrorBanner, LoadingState, PageHeader } from '../shared/product-ui';
import { OperationalContinuityView } from './OperationalContinuityView';

export function OperationalContinuityPage() {
  const { activeWorkspace } = useWorkspace();
  const [readiness, setReadiness] = useState<OperationalContinuityReadinessView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getOperationalContinuityReadiness()
      .then((view) => {
        if (!cancelled) setReadiness(view);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(toUserFacingError(reason, 'Could not load platform readiness.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        productId="operational-continuity"
        title="Platform readiness"
        description="Operational continuity after normal process restart. Not monitoring, incidents, or infrastructure health."
      />
      {error ? <ErrorBanner message={error} /> : null}
      {loading ? <LoadingState label="Loading platform readiness…" /> : null}
      {!loading && readiness ? <OperationalContinuityView readiness={readiness} /> : null}
    </div>
  );
}

export type { OperationalContinuityOwnerView };

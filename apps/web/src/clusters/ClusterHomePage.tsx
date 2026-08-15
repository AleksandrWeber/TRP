import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type ExchangeScopeWorkspaceView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { ClusterHomeView, emptyClusterDraft, type ClusterCreateDraft } from './ClusterHomeView';

export function ClusterHomePage() {
  const { activeWorkspace } = useWorkspace();
  const [workspace, setWorkspace] = useState<ExchangeScopeWorkspaceView | null>(null);
  const [draft, setDraft] = useState<ClusterCreateDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getExchangeScopeWorkspace()
      .then((payload) => {
        if (cancelled) return;
        setWorkspace(payload);
        setDraft((current) => current ?? emptyClusterDraft(payload.venues));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Clusters.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  function create() {
    if (!draft) return;
    setCreating(true);
    setError(null);
    api
      .createExchangeScope({
        venueCode: draft.venueCode,
        displayName: draft.displayName.trim(),
        maxActiveSessions: Number(draft.maxActiveSessions) || 0,
        modeContext: draft.modeContext,
      })
      .then(() => api.getExchangeScopeWorkspace())
      .then((payload) => {
        setWorkspace(payload);
        setDraft(emptyClusterDraft(payload.venues));
      })
      .catch((err: unknown) => {
        setError(toUserFacingError(err, 'Could not create Cluster.'));
      })
      .finally(() => setCreating(false));
  }

  return (
    <ClusterHomeView
      workspace={workspace}
      draft={draft}
      loading={loading}
      creating={creating}
      error={error}
      onDraft={setDraft}
      onCreate={create}
    />
  );
}

import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type ExchangeScopeListItemView,
  type QualificationWorkspaceView,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import {
  emptyQualificationDraft,
  QualificationHomeView,
  type QualificationRequestDraft,
} from './QualificationHomeView';

export function QualificationHomePage() {
  const { activeWorkspace } = useWorkspace();
  const [workspace, setWorkspace] = useState<QualificationWorkspaceView | null>(null);
  const [scopes, setScopes] = useState<readonly ExchangeScopeListItemView[]>([]);
  const [draft, setDraft] = useState<QualificationRequestDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([api.getQualificationWorkspace(), api.listExchangeScopes()])
      .then(([payload, page]) => {
        if (cancelled) return;
        setWorkspace(payload);
        setScopes(page.items);
        setDraft((current) => current ?? emptyQualificationDraft(page.items));
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(toUserFacingError(err, 'Could not load Qualification.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  function request() {
    if (!draft) return;
    setRequesting(true);
    setError(null);
    api
      .requestQualificationRun({
        exchangeScopeId: draft.exchangeScopeId,
        marketSymbol: draft.marketSymbol.trim(),
        modeContext: draft.modeContext,
      })
      .then(() => Promise.all([api.getQualificationWorkspace(), api.listExchangeScopes()]))
      .then(([payload, page]) => {
        setWorkspace(payload);
        setScopes(page.items);
        setDraft(emptyQualificationDraft(page.items));
      })
      .catch((err: unknown) => {
        setError(toUserFacingError(err, 'Could not request qualification.'));
      })
      .finally(() => setRequesting(false));
  }

  return (
    <QualificationHomeView
      workspace={workspace}
      scopes={scopes}
      draft={draft}
      loading={loading}
      requesting={requesting}
      error={error}
      onDraft={setDraft}
      onRequest={request}
    />
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspace } from '../app/WorkspaceContext';
import { api, type ExchangeScopeDetailView } from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import {
  ClusterDetailView,
  draftFromDetail,
  type ClusterDetailDraft,
  type ClusterDetailTab,
} from './ClusterDetailView';

export function ClusterDetailPage() {
  const { exchangeScopeId = '' } = useParams();
  const { activeWorkspace } = useWorkspace();
  const [record, setRecord] = useState<ExchangeScopeDetailView | null>(null);
  const [draft, setDraft] = useState<ClusterDetailDraft | null>(null);
  const [tab, setTab] = useState<ClusterDetailTab>('current');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getExchangeScope(decodeURIComponent(exchangeScopeId))
      .then((item) => {
        if (cancelled) return;
        setRecord(item);
        setDraft(draftFromDetail(item));
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRecord(null);
          setError(toUserFacingError(err, 'Could not load Cluster.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, exchangeScopeId]);

  function apply(next: Promise<unknown>) {
    setBusy(true);
    setError(null);
    next
      .then(() => api.getExchangeScope(decodeURIComponent(exchangeScopeId)))
      .then((item) => {
        setRecord(item);
        setDraft(draftFromDetail(item));
      })
      .catch((err: unknown) => {
        setError(toUserFacingError(err, 'Could not update Cluster.'));
      })
      .finally(() => setBusy(false));
  }

  const id = decodeURIComponent(exchangeScopeId);

  return (
    <ClusterDetailView
      record={record}
      tab={tab}
      draft={draft}
      loading={loading}
      busy={busy}
      error={error}
      onTab={setTab}
      onDraft={setDraft}
      onRename={() => {
        if (!draft) return;
        apply(api.renameExchangeScope(id, draft.displayName.trim()));
      }}
      onActivate={() => apply(api.activateExchangeScope(id))}
      onSuspend={() => apply(api.suspendExchangeScope(id))}
      onArchive={() => apply(api.archiveExchangeScope(id))}
      onSaveConfig={() => {
        if (!draft) return;
        apply(
          api.updateExchangeScopeConfig(id, {
            maxActiveSessions: Number(draft.maxActiveSessions) || 0,
            symbolAllowlist: splitList(draft.symbolAllowlist),
            strategyAllowlist: splitList(draft.strategyAllowlist),
          }),
        );
      }}
      onPublishPolicy={() => {
        if (!draft) return;
        apply(
          api.publishExchangeScopePolicy(id, {
            maxExposureLabel: draft.maxExposureLabel.trim(),
            maxOrderNotionalLabel: draft.maxOrderNotionalLabel.trim(),
            notes: draft.policyNotes.trim() || undefined,
          }),
        );
      }}
      onBind={() => {
        if (!draft) return;
        apply(api.bindExchangeScopeAccount(id, draft.tradingAccountId.trim()));
      }}
      onUnbind={(bindingId) => apply(api.unbindExchangeScopeAccount(id, bindingId))}
    />
  );
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

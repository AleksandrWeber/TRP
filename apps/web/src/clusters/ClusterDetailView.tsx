import { Link } from 'react-router-dom';
import type { ExchangeScopeDetailView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';

export type ClusterDetailTab =
  'current' | 'versions' | 'bindings' | 'policies' | 'lifecycle' | 'history' | 'metadata';

export type ClusterDetailDraft = {
  displayName: string;
  maxActiveSessions: string;
  symbolAllowlist: string;
  strategyAllowlist: string;
  tradingAccountId: string;
  maxExposureLabel: string;
  maxOrderNotionalLabel: string;
  policyNotes: string;
};

export function draftFromDetail(detail: ExchangeScopeDetailView): ClusterDetailDraft {
  return {
    displayName: detail.displayName,
    maxActiveSessions: String(detail.config?.maxActiveSessions ?? 0),
    symbolAllowlist: (detail.config?.symbolAllowlist ?? []).join(', '),
    strategyAllowlist: (detail.config?.strategyAllowlist ?? []).join(', '),
    tradingAccountId: '',
    maxExposureLabel: detail.currentPolicy?.maxExposureLabel ?? '',
    maxOrderNotionalLabel: detail.currentPolicy?.maxOrderNotionalLabel ?? '',
    policyNotes: detail.currentPolicy?.notes ?? '',
  };
}

const TABS: readonly { id: ClusterDetailTab; label: string }[] = [
  { id: 'current', label: 'Current' },
  { id: 'versions', label: 'Versions' },
  { id: 'bindings', label: 'Bindings' },
  { id: 'policies', label: 'Policies' },
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'history', label: 'History' },
  { id: 'metadata', label: 'Metadata' },
];

export function ClusterDetailView({
  record,
  tab,
  draft,
  loading,
  busy,
  error,
  onTab,
  onDraft,
  onRename,
  onActivate,
  onSuspend,
  onArchive,
  onSaveConfig,
  onPublishPolicy,
  onBind,
  onUnbind,
}: {
  record: ExchangeScopeDetailView | null;
  tab: ClusterDetailTab;
  draft: ClusterDetailDraft | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  onTab: (tab: ClusterDetailTab) => void;
  onDraft: (next: ClusterDetailDraft) => void;
  onRename: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onArchive: () => void;
  onSaveConfig: () => void;
  onPublishPolicy: () => void;
  onBind: () => void;
  onUnbind: (bindingId: string) => void;
}) {
  return (
    <section className="space-y-6" data-testid="cluster-detail">
      <div>
        <Link to="/clusters" className="text-sm text-sky-400 hover:text-sky-300">
          All Clusters
        </Link>
        <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Cluster</p>
        <h2 className="mt-1 text-2xl font-semibold">{record?.displayName ?? 'Exchange Scope'}</h2>
        <p className="mt-2 text-slate-400">
          Isolation inputs only. Policy values are inputs to Risk — they are not risk decisions.
          Venue adapters stay stubbed.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !record ? (
        <p className="text-slate-400">Loading Cluster…</p>
      ) : !record ? (
        <p className="text-slate-400">Cluster not found.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTab(item.id)}
                data-testid={`cluster-tab-${item.id}`}
                className={`rounded px-3 py-1 text-sm ${
                  tab === item.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'current' ? (
            <CurrentPanel
              record={record}
              draft={draft}
              busy={busy}
              onDraft={onDraft}
              onRename={onRename}
            />
          ) : null}
          {tab === 'versions' ? <VersionsPanel record={record} /> : null}
          {tab === 'bindings' ? (
            <BindingsPanel
              record={record}
              draft={draft}
              busy={busy}
              onDraft={onDraft}
              onBind={onBind}
              onUnbind={onUnbind}
            />
          ) : null}
          {tab === 'policies' ? (
            <PoliciesPanel
              record={record}
              draft={draft}
              busy={busy}
              onDraft={onDraft}
              onPublishPolicy={onPublishPolicy}
            />
          ) : null}
          {tab === 'lifecycle' ? (
            <LifecyclePanel
              record={record}
              busy={busy}
              onActivate={onActivate}
              onSuspend={onSuspend}
              onArchive={onArchive}
            />
          ) : null}
          {tab === 'history' ? <HistoryPanel record={record} /> : null}
          {tab === 'metadata' ? (
            <MetadataPanel
              record={record}
              draft={draft}
              busy={busy}
              onDraft={onDraft}
              onSaveConfig={onSaveConfig}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

function CurrentPanel({
  record,
  draft,
  busy,
  onDraft,
  onRename,
}: {
  record: ExchangeScopeDetailView;
  draft: ClusterDetailDraft | null;
  busy: boolean;
  onDraft: (next: ClusterDetailDraft) => void;
  onRename: () => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Fact label="Identity" value={record.exchangeScopeId} />
        <Fact label="Venue" value={record.venueCode} />
        <Fact label="Lifecycle" value={record.lifecycle.status} />
        <Fact label="Version" value={String(record.current.version)} />
        <Fact label="Mode" value={record.current.modeContext} />
        <Fact label="Capacity" value={`${record.current.maxActiveSessions} max sessions`} />
      </dl>
      {record.current.modeContextIsLabelOnly ? (
        <p className="text-sm text-amber-200">
          Mode “live” is a label only. Live capital is not offered.
        </p>
      ) : null}
      {draft && record.lifecycle.actions.canRename ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Rename</span>
            <input
              value={draft.displayName}
              onChange={(event) => onDraft({ ...draft, displayName: event.target.value })}
              data-testid="cluster-rename-input"
              className="w-full min-w-[16rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <button
            type="button"
            disabled={busy || !draft.displayName.trim()}
            onClick={onRename}
            data-testid="cluster-rename"
            className="rounded border border-sky-500/40 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/10 disabled:opacity-50"
          >
            Save name
          </button>
        </div>
      ) : null}
    </div>
  );
}

function VersionsPanel({ record }: { record: ExchangeScopeDetailView }) {
  if (record.versions.length === 0) {
    return <p className="text-sm text-slate-500">No configuration versions yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {record.versions.map((version) => (
        <li
          key={version.version}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <p className="font-medium text-slate-100">
            v{version.version} · {version.displayName}
          </p>
          <p className="text-slate-500">
            {version.lifecycleStatus} · {formatUtc(version.publishedAt)} · {version.publishedBy}
          </p>
        </li>
      ))}
    </ul>
  );
}

function BindingsPanel({
  record,
  draft,
  busy,
  onDraft,
  onBind,
  onUnbind,
}: {
  record: ExchangeScopeDetailView;
  draft: ClusterDetailDraft | null;
  busy: boolean;
  onDraft: (next: ClusterDetailDraft) => void;
  onBind: () => void;
  onUnbind: (bindingId: string) => void;
}) {
  return (
    <div className="space-y-4">
      {record.adapterContext ? (
        <p className="text-sm text-slate-400">
          Adapter context {record.adapterContext.adapterIdentity} is a logical binding, not a live
          venue session.
        </p>
      ) : (
        <p className="text-sm text-slate-500">No adapter context. Venue APIs are not used.</p>
      )}
      {record.bindings.length === 0 ? (
        <p className="text-sm text-slate-500">No account bindings.</p>
      ) : (
        <ul className="space-y-2">
          {record.bindings.map((binding) => (
            <li
              key={binding.tradingAccountBindingId}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <span>
                {binding.tradingAccountId}
                <span className="ml-2 text-slate-500">{binding.status}</span>
              </span>
              {binding.status === 'bound' && record.lifecycle.actions.canBind ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onUnbind(binding.tradingAccountBindingId)}
                  className="text-slate-300 underline-offset-2 hover:underline disabled:opacity-50"
                >
                  Unbind
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {draft && record.lifecycle.actions.canBind ? (
        <div className="flex flex-wrap items-end gap-3">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Trading account id</span>
            <input
              value={draft.tradingAccountId}
              onChange={(event) => onDraft({ ...draft, tradingAccountId: event.target.value })}
              data-testid="cluster-bind-account"
              className="w-full min-w-[16rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <button
            type="button"
            disabled={busy || !draft.tradingAccountId.trim()}
            onClick={onBind}
            data-testid="cluster-bind"
            className="rounded border border-sky-500/40 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/10 disabled:opacity-50"
          >
            Bind account
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PoliciesPanel({
  record,
  draft,
  busy,
  onDraft,
  onPublishPolicy,
}: {
  record: ExchangeScopeDetailView;
  draft: ClusterDetailDraft | null;
  busy: boolean;
  onDraft: (next: ClusterDetailDraft) => void;
  onPublishPolicy: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Exchange Risk Policy inputs. These do not approve risk or trip a Kill Switch.
      </p>
      {record.policies.length === 0 ? (
        <p className="text-sm text-slate-500">No policy inputs published.</p>
      ) : (
        <ul className="space-y-2">
          {record.policies.map((policy) => (
            <li
              key={policy.exchangeRiskPolicyId}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <p className="font-medium text-slate-100">v{policy.policyVersion}</p>
              <p className="text-slate-400">
                Exposure {policy.maxExposureLabel} · Order {policy.maxOrderNotionalLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
      {draft && record.lifecycle.actions.canPublishPolicy ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Max exposure label</span>
            <input
              value={draft.maxExposureLabel}
              onChange={(event) => onDraft({ ...draft, maxExposureLabel: event.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Max order notional label</span>
            <input
              value={draft.maxOrderNotionalLabel}
              onChange={(event) => onDraft({ ...draft, maxOrderNotionalLabel: event.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <button
            type="button"
            disabled={busy || !draft.maxExposureLabel.trim() || !draft.maxOrderNotionalLabel.trim()}
            onClick={onPublishPolicy}
            data-testid="cluster-publish-policy"
            className="rounded border border-sky-500/40 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/10 disabled:opacity-50"
          >
            Publish policy input
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LifecyclePanel({
  record,
  busy,
  onActivate,
  onSuspend,
  onArchive,
}: {
  record: ExchangeScopeDetailView;
  busy: boolean;
  onActivate: () => void;
  onSuspend: () => void;
  onArchive: () => void;
}) {
  const actions = record.lifecycle.actions;
  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Fact label="Status" value={record.lifecycle.status} />
        <Fact label="Updated" value={formatUtc(record.lifecycle.updatedAt)} />
        <Fact label="By" value={record.lifecycle.updatedBy} />
        <Fact label="Reason" value={record.lifecycle.reason} />
      </dl>
      <div className="flex flex-wrap gap-2">
        {actions.canActivate ? (
          <button
            type="button"
            disabled={busy}
            onClick={onActivate}
            data-testid="cluster-activate"
            className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 disabled:opacity-50"
          >
            Activate
          </button>
        ) : null}
        {actions.canSuspend ? (
          <button
            type="button"
            disabled={busy}
            onClick={onSuspend}
            data-testid="cluster-suspend"
            className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 disabled:opacity-50"
          >
            Suspend
          </button>
        ) : null}
        {actions.canArchive ? (
          <button
            type="button"
            disabled={busy}
            onClick={onArchive}
            data-testid="cluster-archive"
            className="rounded border border-slate-500/40 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
          >
            Archive
          </button>
        ) : null}
      </div>
    </div>
  );
}

function HistoryPanel({ record }: { record: ExchangeScopeDetailView }) {
  if (record.history.length === 0) {
    return <p className="text-sm text-slate-500">No history yet.</p>;
  }
  return (
    <ul className="space-y-2" data-testid="cluster-history">
      {record.history.map((item, index) => (
        <li
          key={`${item.kind}-${item.at}-${index}`}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <p className="font-medium text-slate-100">{item.summary}</p>
          <p className="text-slate-500">
            {item.kind} · {formatUtc(item.at)} · {item.by}
          </p>
        </li>
      ))}
    </ul>
  );
}

function MetadataPanel({
  record,
  draft,
  busy,
  onDraft,
  onSaveConfig,
}: {
  record: ExchangeScopeDetailView;
  draft: ClusterDetailDraft | null;
  busy: boolean;
  onDraft: (next: ClusterDetailDraft) => void;
  onSaveConfig: () => void;
}) {
  return (
    <div className="space-y-4">
      <dl className="grid gap-4 sm:grid-cols-2">
        <Fact label="Summary" value={record.metadata?.inputSummary ?? '—'} />
        <Fact label="As of" value={formatUtc(record.metadata?.asOf)} />
        <Fact label="Adapter ref" value={record.metadata?.adapterContextRef ?? '—'} />
        <Fact label="Policy ref" value={record.metadata?.policyRef ?? '—'} />
      </dl>
      {draft && record.lifecycle.actions.canUpdateConfig ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Max active sessions</span>
            <input
              value={draft.maxActiveSessions}
              onChange={(event) => onDraft({ ...draft, maxActiveSessions: event.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Symbol allowlist</span>
            <input
              value={draft.symbolAllowlist}
              onChange={(event) => onDraft({ ...draft, symbolAllowlist: event.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Strategy allowlist</span>
            <input
              value={draft.strategyAllowlist}
              onChange={(event) => onDraft({ ...draft, strategyAllowlist: event.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={onSaveConfig}
            data-testid="cluster-save-config"
            className="rounded border border-sky-500/40 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/10 disabled:opacity-50"
          >
            Publish configuration
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-200">{value}</dd>
    </div>
  );
}

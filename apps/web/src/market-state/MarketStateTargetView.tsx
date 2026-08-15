import { Link } from 'react-router-dom';
import type { MarketStateTargetDetailView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { lifecycleLabel, regimeLabel } from './market-state';

export type MarketStateTargetTab =
  'current' | 'lifecycle' | 'transitions' | 'versions' | 'metadata' | 'qualification' | 'profile';

const TABS: readonly { id: MarketStateTargetTab; label: string }[] = [
  { id: 'current', label: 'Current State' },
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'transitions', label: 'Transitions' },
  { id: 'versions', label: 'History' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'qualification', label: 'Qualification' },
  { id: 'profile', label: 'Profile' },
];

export function MarketStateTargetView({
  record,
  tab,
  loading,
  refreshing,
  error,
  onTab,
  onRefresh,
}: {
  record: MarketStateTargetDetailView | null;
  tab: MarketStateTargetTab;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onTab: (tab: MarketStateTargetTab) => void;
  onRefresh: () => void;
}) {
  return (
    <section className="space-y-6" data-testid="market-state-target">
      <div>
        <Link to="/market-state" className="text-sm text-sky-400 hover:text-sky-300">
          All market states
        </Link>
        <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Market State</p>
        <h2 className="mt-1 text-2xl font-semibold">{record?.displayName ?? 'Market State'}</h2>
        <p className="mt-2 text-slate-400">
          Existing current-condition artifact for this market. This page does not classify markets,
          select strategies, or start sessions. Qualification and Profile are references only.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !record ? (
        <p className="text-slate-400">Loading Market State…</p>
      ) : !record ? (
        <p className="text-slate-400">Market State not found.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={refreshing}
              onClick={onRefresh}
              data-testid="market-state-refresh"
              className="rounded border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/20 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <p className="text-xs text-slate-500">
              Refresh republishes the existing snapshot and updates Qualification / Profile
              references. It does not classify.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTab(item.id)}
                data-testid={`market-state-tab-${item.id}`}
                className={`rounded px-3 py-1 text-sm ${
                  tab === item.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'current' ? <Current record={record} /> : null}
          {tab === 'lifecycle' ? <Lifecycle record={record} /> : null}
          {tab === 'transitions' ? <Transitions record={record} /> : null}
          {tab === 'versions' ? <Versions record={record} /> : null}
          {tab === 'metadata' ? <Metadata record={record} /> : null}
          {tab === 'qualification' ? <QualificationRef record={record} /> : null}
          {tab === 'profile' ? <ProfileRef record={record} /> : null}
        </>
      )}
    </section>
  );
}

function Current({ record }: { record: MarketStateTargetDetailView }) {
  const current = record.current;
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Row label="Market" value={record.marketSymbol} />
      <Row label="Cluster" value={record.exchangeScopeId} />
      <Row label="Current version" value={`v${record.currentVersion}`} />
      <Row label="Regime" value={regimeLabel(current.snapshot.regimeLabel)} />
      <Row label="Volatility" value={current.snapshot.volatilityLabel ?? '—'} />
      <Row label="Liquidity" value={current.snapshot.liquidityLabel ?? '—'} />
      <Row label="Lifecycle" value={lifecycleLabel(current.lifecycle.status)} />
      <Row label="Published" value={formatUtc(current.metadata.publishedAt)} />
      <Row label="Narrative" value={current.snapshot.narrativeSummary} />
    </dl>
  );
}

function Lifecycle({ record }: { record: MarketStateTargetDetailView }) {
  const lifecycle = record.current.lifecycle;
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Row label="Status" value={lifecycleLabel(lifecycle.status)} />
      <Row label="Stale / expired" value={lifecycle.isStale ? 'Yes' : 'No'} />
      <Row label="Updated at" value={formatUtc(lifecycle.updatedAt)} />
      <Row label="Updated by" value={lifecycle.updatedBy} />
      <Row label="Reason" value={lifecycle.reason} />
    </dl>
  );
}

function Transitions({ record }: { record: MarketStateTargetDetailView }) {
  if (record.transitions.length === 0) {
    return <p className="text-sm text-slate-500">No transitions recorded.</p>;
  }
  return (
    <ul className="space-y-2" data-testid="market-state-transitions">
      {[...record.transitions]
        .slice()
        .reverse()
        .map((row) => (
          <li
            key={`${row.marketStateId}:${row.toVersion}:${row.transitionedAt}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm"
          >
            <span>
              v{row.fromVersion ?? '—'}{' '}
              {row.fromLifecycle ? `(${lifecycleLabel(row.fromLifecycle)})` : ''}
              {' → '}v{row.toVersion} ({lifecycleLabel(row.toLifecycle)})
            </span>
            <span className="text-xs text-slate-500">{formatUtc(row.transitionedAt)}</span>
          </li>
        ))}
    </ul>
  );
}

function Versions({ record }: { record: MarketStateTargetDetailView }) {
  return (
    <ul className="space-y-2">
      {[...record.versions]
        .slice()
        .reverse()
        .map((item) => (
          <li key={item.marketStateId}>
            <Link
              to={`/market-state/targets/${encodeURIComponent(record.targetId)}/versions/${item.version}`}
              className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                v{item.version}
                {item.isCurrent ? (
                  <span className="ml-2 text-xs text-emerald-300">current</span>
                ) : null}
              </span>
              <span className="text-xs text-slate-500">{formatUtc(item.publishedAt)}</span>
            </Link>
          </li>
        ))}
    </ul>
  );
}

function Metadata({ record }: { record: MarketStateTargetDetailView }) {
  const meta = record.current.metadata;
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Row label="State id" value={meta.marketStateId} />
      <Row label="Version" value={`v${meta.version}`} />
      <Row label="Observation as of" value={formatUtc(meta.observationAsOf)} />
      <Row label="Published at" value={formatUtc(meta.publishedAt)} />
      <Row label="Published by" value={meta.publishedBy} />
      <Row label="Qualification ref" value={meta.confidenceRef ?? '—'} />
      <Row label="Profile ref" value={meta.profileRef ?? '—'} />
      <Row label="Input summary" value={meta.inputSummary} />
      <Row label="Notes" value={meta.notes ?? '—'} />
    </dl>
  );
}

function QualificationRef({ record }: { record: MarketStateTargetDetailView }) {
  const qual = record.current.qualification;
  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-500">
        Current Qualification reference. Market State does not own Qualification and does not score
        markets.
      </p>
      {qual.present ? (
        <>
          <Row label="Lifecycle" value={qual.lifecycleState ?? '—'} />
          <Row label="Confidence" value={qual.confidenceLevel ?? '—'} />
          <Row label="Health" value={qual.healthStatus ?? '—'} />
          <Row label="Latest run" value={qual.latestRunStatus ?? '—'} />
          <Row label="Source run" value={qual.sourceRunId ?? '—'} />
          {qual.qualificationTargetId ? (
            <Link
              to={`/qualification/targets/${encodeURIComponent(qual.qualificationTargetId)}`}
              className="inline-block text-sm text-sky-400 hover:text-sky-300"
            >
              Open Qualification
            </Link>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-slate-500">No current Qualification reference.</p>
      )}
    </section>
  );
}

function ProfileRef({ record }: { record: MarketStateTargetDetailView }) {
  const profile = record.current.profile;
  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-500">
        Current Profile reference. Market State does not own Profile and does not calculate
        dimensions.
      </p>
      {profile.present ? (
        <>
          <Row label="Profile id" value={profile.marketProfileId ?? '—'} />
          <Row label="Version" value={profile.version !== null ? `v${profile.version}` : '—'} />
          <Row label="Confidence" value={profile.confidenceLevel ?? '—'} />
          <Row
            label="Published at"
            value={profile.publishedAt ? formatUtc(profile.publishedAt) : '—'}
          />
          {profile.profileTargetId ? (
            <Link
              to={`/market-profile/targets/${encodeURIComponent(profile.profileTargetId)}`}
              className="inline-block text-sm text-sky-400 hover:text-sky-300"
            >
              Open Profile
            </Link>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-slate-500">No current Profile reference.</p>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

import { Link } from 'react-router-dom';
import type { MarketStateDetailView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { lifecycleLabel, regimeLabel } from './market-state';

export function MarketStateVersionView({
  record,
  loading,
  error,
}: {
  record: MarketStateDetailView | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="space-y-6" data-testid="market-state-version">
      <div>
        {record ? (
          <Link
            to={`/market-state/targets/${encodeURIComponent(record.targetId)}`}
            className="text-sm text-sky-400 hover:text-sky-300"
          >
            {record.displayName}
          </Link>
        ) : (
          <Link to="/market-state" className="text-sm text-sky-400 hover:text-sky-300">
            Market State home
          </Link>
        )}
        <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Market State</p>
        <h2 className="mt-1 text-2xl font-semibold">
          {record ? `${record.displayName} v${record.version}` : 'Version details'}
        </h2>
        <p className="mt-2 text-slate-400">
          Immutable Market State version. This page does not classify markets and does not force
          trades.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !record ? (
        <p className="text-slate-400">Loading version…</p>
      ) : !record ? (
        <p className="text-slate-400">Market State version not found.</p>
      ) : (
        <>
          {record.isCurrent ? (
            <p className="text-sm text-emerald-300">Current version</p>
          ) : (
            <p className="text-sm text-slate-500">
              Historical version. Current is v{record.currentVersion}.
            </p>
          )}
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="State id" value={record.marketStateId} />
            <Row label="Regime" value={regimeLabel(record.snapshot.regimeLabel)} />
            <Row label="Lifecycle" value={lifecycleLabel(record.lifecycle.status)} />
            <Row label="Published at" value={formatUtc(record.metadata.publishedAt)} />
            <Row label="Published by" value={record.metadata.publishedBy} />
            <Row label="Observation as of" value={formatUtc(record.metadata.observationAsOf)} />
            <Row label="Qualification ref" value={record.metadata.confidenceRef ?? '—'} />
            <Row label="Profile ref" value={record.metadata.profileRef ?? '—'} />
            <Row label="Narrative" value={record.snapshot.narrativeSummary} />
          </dl>
        </>
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

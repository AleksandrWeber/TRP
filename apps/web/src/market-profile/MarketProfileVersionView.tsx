import { Link } from 'react-router-dom';
import type { MarketProfileDetailView, MarketProfileDimensionView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import { confidenceLabel, dimensionKindLabel, regimeLabel } from './market-profile';

export function MarketProfileVersionView({
  record,
  loading,
  error,
}: {
  record: MarketProfileDetailView | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="space-y-6" data-testid="market-profile-version">
      <div>
        {record ? (
          <Link
            to={`/market-profile/targets/${encodeURIComponent(record.targetId)}`}
            className="text-sm text-sky-400 hover:text-sky-300"
          >
            {record.displayName}
          </Link>
        ) : (
          <Link to="/market-profile" className="text-sm text-sky-400 hover:text-sky-300">
            Profile home
          </Link>
        )}
        <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Profile</p>
        <h2 className="mt-1 text-2xl font-semibold">
          {record ? `${record.displayName} v${record.version}` : 'Version details'}
        </h2>
        <p className="mt-2 text-slate-400">
          Immutable published version. This page does not calculate dimensions and does not force
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
        <p className="text-slate-400">Market Profile version not found.</p>
      ) : (
        <>
          {record.isCurrentPublished ? (
            <p className="text-sm text-emerald-300">Current published version</p>
          ) : (
            <p className="text-sm text-slate-500">
              Historical version. Current published is v{record.currentPublishedVersion}.
            </p>
          )}
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="Profile id" value={record.marketProfileId} />
            <Row label="Published at" value={formatUtc(record.metadata.publishedAt)} />
            <Row label="Published by" value={record.metadata.publishedBy} />
            <Row label="Qualification run" value={record.publishedSource.qualificationRunId} />
            <Row label="Confidence" value={confidenceLabel(record.metadata.confidenceLevel)} />
            <Row label="Rationale" value={record.metadata.rationaleSummary} />
          </dl>
          <div className="space-y-4">
            <DimensionCard dimension={record.dimensions.volatility} />
            <DimensionCard dimension={record.dimensions.liquidity} />
            <DimensionCard dimension={record.dimensions.trend} />
            <DimensionCard dimension={record.dimensions.structure} />
          </div>
        </>
      )}
    </section>
  );
}

function DimensionCard({ dimension }: { dimension: MarketProfileDimensionView }) {
  return (
    <section className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
        {dimensionKindLabel(dimension.kind)}
      </h3>
      {dimension.regimeLabel ? (
        <p className="text-sm text-slate-300">{regimeLabel(dimension.regimeLabel)}</p>
      ) : null}
      <ul className="space-y-1 text-sm">
        {dimension.metrics.map((metric) => (
          <li key={metric.key} className="flex justify-between gap-4">
            <span className="text-slate-500">{metric.key}</span>
            <span>{metric.value}</span>
          </li>
        ))}
      </ul>
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

import { Link } from 'react-router-dom';
import type {
  MarketProfileCompareView,
  MarketProfileDimensionView,
  MarketProfileTargetDetailView,
} from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  confidenceLabel,
  dimensionKindLabel,
  metadataFieldLabel,
  regimeLabel,
} from './market-profile';

export type MarketProfileTargetTab =
  'latest' | 'versions' | 'metadata' | 'dimensions' | 'source' | 'compare';

const TABS: readonly { id: MarketProfileTargetTab; label: string }[] = [
  { id: 'latest', label: 'Latest' },
  { id: 'versions', label: 'Versions' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'dimensions', label: 'Dimensions' },
  { id: 'source', label: 'Published source' },
  { id: 'compare', label: 'Compare' },
];

export function MarketProfileTargetView({
  record,
  tab,
  fromVersion,
  toVersion,
  compared,
  comparing,
  loading,
  error,
  onTab,
  onFromVersion,
  onToVersion,
  onCompare,
}: {
  record: MarketProfileTargetDetailView | null;
  tab: MarketProfileTargetTab;
  fromVersion: number;
  toVersion: number;
  compared: MarketProfileCompareView | null;
  comparing: boolean;
  loading: boolean;
  error: string | null;
  onTab: (tab: MarketProfileTargetTab) => void;
  onFromVersion: (version: number) => void;
  onToVersion: (version: number) => void;
  onCompare: () => void;
}) {
  return (
    <section className="space-y-6" data-testid="market-profile-target">
      <div>
        <Link to="/market-profile" className="text-sm text-sky-400 hover:text-sky-300">
          All profiles
        </Link>
        <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Profile</p>
        <h2 className="mt-1 text-2xl font-semibold">{record?.displayName ?? 'Profile'}</h2>
        <p className="mt-2 text-slate-400">
          Existing published versions for this market. Profile does not calculate dimensions and
          does not force trades. Qualification remains the publish source.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !record ? (
        <p className="text-slate-400">Loading Profile…</p>
      ) : !record ? (
        <p className="text-slate-400">Market Profile not found.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTab(item.id)}
                data-testid={`market-profile-tab-${item.id}`}
                className={`rounded px-3 py-1 text-sm ${
                  tab === item.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'latest' ? <Latest record={record} /> : null}
          {tab === 'versions' ? <Versions record={record} /> : null}
          {tab === 'metadata' ? <Metadata record={record} /> : null}
          {tab === 'dimensions' ? <Dimensions record={record} /> : null}
          {tab === 'source' ? <PublishedSource record={record} /> : null}
          {tab === 'compare' ? (
            <Compare
              record={record}
              fromVersion={fromVersion}
              toVersion={toVersion}
              compared={compared}
              comparing={comparing}
              onFromVersion={onFromVersion}
              onToVersion={onToVersion}
              onCompare={onCompare}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

function Latest({ record }: { record: MarketProfileTargetDetailView }) {
  const latest = record.latest;
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Row label="Market" value={record.marketSymbol} />
      <Row label="Cluster" value={record.exchangeScopeId} />
      <Row label="Current published version" value={`v${record.currentPublishedVersion}`} />
      <Row label="Profile id" value={latest.marketProfileId} />
      <Row label="Confidence" value={confidenceLabel(latest.metadata.confidenceLevel)} />
      <Row label="Published" value={formatUtc(latest.metadata.publishedAt)} />
      <Row label="Published by" value={latest.metadata.publishedBy} />
      <Row label="Qualification run" value={latest.publishedSource.qualificationRunId} />
    </dl>
  );
}

function Versions({ record }: { record: MarketProfileTargetDetailView }) {
  return (
    <ul className="space-y-2">
      {[...record.versions]
        .slice()
        .reverse()
        .map((item) => (
          <li key={item.marketProfileId}>
            <Link
              to={`/market-profile/targets/${encodeURIComponent(record.targetId)}/versions/${item.version}`}
              className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                v{item.version}
                {item.isLatest ? (
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

function Metadata({ record }: { record: MarketProfileTargetDetailView }) {
  const meta = record.latest.metadata;
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Row label="Profile id" value={meta.marketProfileId} />
      <Row label="Version" value={`v${meta.version}`} />
      <Row label="Published at" value={formatUtc(meta.publishedAt)} />
      <Row label="Published by" value={meta.publishedBy} />
      <Row label="Qualification run" value={meta.qualificationRunId} />
      <Row label="Confidence level" value={confidenceLabel(meta.confidenceLevel)} />
      <Row
        label="Recorded score"
        value={meta.confidenceScore === null ? '—' : String(meta.confidenceScore)}
      />
      <Row label="Source run" value={meta.confidenceSourceRunId} />
      <Row label="Rationale" value={meta.rationaleSummary} />
    </dl>
  );
}

function Dimensions({ record }: { record: MarketProfileTargetDetailView }) {
  const dims = record.latest.dimensions;
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Caller-supplied dimension snapshots. This page does not recalculate them.
      </p>
      <DimensionCard dimension={dims.volatility} />
      <DimensionCard dimension={dims.liquidity} />
      <DimensionCard dimension={dims.trend} />
      <DimensionCard dimension={dims.structure} />
    </div>
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
      {dimension.windowSummary ? (
        <p className="text-sm text-slate-500">{dimension.windowSummary}</p>
      ) : null}
      {dimension.notes ? <p className="text-sm text-slate-500">{dimension.notes}</p> : null}
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

function PublishedSource({ record }: { record: MarketProfileTargetDetailView }) {
  const source = record.latest.publishedSource;
  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-500">
        Published from Qualification. Profile does not own the run and does not re-publish from this
        screen.
      </p>
      <Row label="Qualification run" value={source.qualificationRunId} />
      <Row label="Source run" value={source.sourceRunId} />
      <Row label="Published by" value={source.publishedBy} />
      <Row label="Published at" value={formatUtc(source.publishedAt)} />
      <Link
        to={`/qualification/runs/${encodeURIComponent(source.qualificationRunId)}`}
        className="inline-block text-sm text-sky-400 hover:text-sky-300"
      >
        Open Qualification run
      </Link>
    </section>
  );
}

function Compare({
  record,
  fromVersion,
  toVersion,
  compared,
  comparing,
  onFromVersion,
  onToVersion,
  onCompare,
}: {
  record: MarketProfileTargetDetailView;
  fromVersion: number;
  toVersion: number;
  compared: MarketProfileCompareView | null;
  comparing: boolean;
  onFromVersion: (version: number) => void;
  onToVersion: (version: number) => void;
  onCompare: () => void;
}) {
  const versions = record.versions;
  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-500">
        Metadata-only compare. Dimension metrics are not diffed and are not recalculated.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">From version</span>
          <select
            value={fromVersion}
            onChange={(event) => onFromVersion(Number(event.target.value))}
            data-testid="market-profile-compare-from"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          >
            {versions.map((item) => (
              <option key={item.version} value={item.version}>
                v{item.version}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">To version</span>
          <select
            value={toVersion}
            onChange={(event) => onToVersion(Number(event.target.value))}
            data-testid="market-profile-compare-to"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          >
            {versions.map((item) => (
              <option key={item.version} value={item.version}>
                v{item.version}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        disabled={comparing || fromVersion === toVersion}
        onClick={onCompare}
        data-testid="market-profile-compare"
        className="rounded border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/20 disabled:opacity-50"
      >
        Compare metadata
      </button>
      {compared ? (
        <ul className="space-y-2" data-testid="market-profile-compare-result">
          {compared.differences.map((row) => (
            <li
              key={row.field}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 px-3 py-2 text-sm"
            >
              <span>{metadataFieldLabel(row.field)}</span>
              <span className={row.changed ? 'text-amber-200' : 'text-slate-500'}>
                {row.from} → {row.to}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
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

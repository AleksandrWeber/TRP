import { Link } from 'react-router-dom';
import type { QualificationTargetDetailView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  confidenceLabel,
  healthLabel,
  lifecycleLabel,
  modeLabel,
  runStatusLabel,
  type QualificationMode,
} from './qualification';

export type QualificationTargetTab =
  'summary' | 'lifecycle' | 'confidence' | 'health' | 'runs' | 'history';

const TABS: readonly { id: QualificationTargetTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'confidence', label: 'Confidence' },
  { id: 'health', label: 'Health' },
  { id: 'runs', label: 'Runs' },
  { id: 'history', label: 'History' },
];

export function QualificationTargetView({
  record,
  tab,
  mode,
  loading,
  busy,
  error,
  onTab,
  onMode,
  onRequalify,
}: {
  record: QualificationTargetDetailView | null;
  tab: QualificationTargetTab;
  mode: QualificationMode;
  loading: boolean;
  busy: boolean;
  error: string | null;
  onTab: (tab: QualificationTargetTab) => void;
  onMode: (mode: QualificationMode) => void;
  onRequalify: () => void;
}) {
  return (
    <section className="space-y-6" data-testid="qualification-target">
      <div>
        <Link to="/qualification" className="text-sm text-sky-400 hover:text-sky-300">
          All targets
        </Link>
        <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Qualification</p>
        <h2 className="mt-1 text-2xl font-semibold">{record?.displayName ?? 'Target'}</h2>
        <p className="mt-2 text-slate-400">
          Existing lifecycle, confidence, and health for this market. Qualification does not score
          and does not force trades. Profile versions remain owned by Market Profile.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !record ? (
        <p className="text-slate-400">Loading target…</p>
      ) : !record ? (
        <p className="text-slate-400">Qualification target not found.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTab(item.id)}
                data-testid={`qualification-tab-${item.id}`}
                className={`rounded px-3 py-1 text-sm ${
                  tab === item.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'summary' ? <Summary record={record} /> : null}
          {tab === 'lifecycle' ? <Lifecycle record={record} /> : null}
          {tab === 'confidence' ? <Confidence record={record} /> : null}
          {tab === 'health' ? <Health record={record} /> : null}
          {tab === 'runs' ? <Runs record={record} /> : null}
          {tab === 'history' ? <History record={record} /> : null}

          {record.lifecycle.actions.canRequalify ? (
            <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Requalification request
              </h3>
              <p className="text-sm text-slate-500">
                Requests another run for this qualified target. Confirm is still required before
                heavy work.
              </p>
              <label className="block max-w-xs space-y-1 text-sm">
                <span className="text-slate-400">Mode</span>
                <select
                  value={mode}
                  onChange={(event) => onMode(event.target.value as QualificationMode)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                >
                  <option value="paper">Paper</option>
                  <option value="lab">Lab</option>
                </select>
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={onRequalify}
                data-testid="qualification-requalify"
                className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                Request requalification
              </button>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}

function Summary({ record }: { record: QualificationTargetDetailView }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Row label="Market" value={record.marketSymbol} />
      <Row label="Cluster" value={record.exchangeScopeId} />
      <Row label="Lifecycle" value={lifecycleLabel(record.lifecycle.state)} />
      <Row label="Confidence" value={confidenceLabel(record.confidence?.level ?? null)} />
      <Row label="Health" value={healthLabel(record.health?.status ?? null)} />
      <Row label="Runs" value={String(record.runs.length)} />
      <Row
        label="Latest profile ref"
        value={record.lifecycle.latestProfileId ?? 'None (Profile remains owner)'}
      />
    </dl>
  );
}

function Lifecycle({ record }: { record: QualificationTargetDetailView }) {
  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
      <Row label="State" value={lifecycleLabel(record.lifecycle.state)} />
      <Row label="Updated" value={formatUtc(record.lifecycle.updatedAt)} />
      <Row label="Active run" value={record.lifecycle.activeRunId ?? 'None'} />
      <Row label="Latest completed" value={record.lifecycle.latestCompletedRunId ?? 'None'} />
      <p className="text-sm text-slate-500">
        Lifecycle is owned by Qualification. Completing a run records the existing state; it does
        not calculate a score.
      </p>
    </section>
  );
}

function Confidence({ record }: { record: QualificationTargetDetailView }) {
  if (!record.confidence) {
    return (
      <p className="text-sm text-slate-500">
        No confidence snapshot recorded. Qualification does not calculate confidence on this page.
      </p>
    );
  }
  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
      <Row label="Level" value={confidenceLabel(record.confidence.level)} />
      <Row
        label="Recorded score"
        value={record.confidence.score === null ? 'Not supplied' : String(record.confidence.score)}
      />
      <Row label="Rationale" value={record.confidence.rationaleSummary} />
      <Row label="Source run" value={record.confidence.sourceRunId} />
      <Row label="As of" value={record.confidence.staleLabel} />
    </section>
  );
}

function Health({ record }: { record: QualificationTargetDetailView }) {
  if (!record.health) {
    return (
      <p className="text-sm text-slate-500">
        No health snapshot recorded. Qualification does not invent health indicators here.
      </p>
    );
  }
  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
      <Row label="Status" value={healthLabel(record.health.status)} />
      <Row label="As of" value={formatUtc(record.health.asOf)} />
      <ul className="space-y-2">
        {record.health.indicators.map((indicator) => (
          <li key={indicator.key} className="rounded-lg border border-white/5 px-3 py-2 text-sm">
            {indicator.key}: {indicator.value}
            {indicator.note ? <span className="ml-2 text-slate-500">{indicator.note}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Runs({ record }: { record: QualificationTargetDetailView }) {
  if (record.runs.length === 0) {
    return <p className="text-sm text-slate-500">No runs for this target.</p>;
  }
  return (
    <ul className="space-y-2">
      {record.runs.map((run) => (
        <li key={run.qualificationRunId}>
          <Link
            to={`/qualification/runs/${encodeURIComponent(run.qualificationRunId)}`}
            className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
          >
            <span>{modeLabel(run.modeContext)}</span>
            <span className="flex gap-2">
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                {runStatusLabel(run.status)}
              </span>
              <span className="text-xs text-slate-500">{formatUtc(run.createdAt)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function History({ record }: { record: QualificationTargetDetailView }) {
  if (record.history.length === 0) {
    return <p className="text-sm text-slate-500">No history yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {record.history.map((item, index) => (
        <li
          key={`${item.kind}-${item.at}-${index}`}
          className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-sm"
        >
          <span>{item.summary}</span>
          <span className="text-xs text-slate-500">{formatUtc(item.at)}</span>
        </li>
      ))}
    </ul>
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

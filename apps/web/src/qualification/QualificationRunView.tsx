import { Link } from 'react-router-dom';
import type { QualificationRunDetailView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  confidenceLabel,
  healthLabel,
  lifecycleLabel,
  modeLabel,
  runStatusLabel,
} from './qualification';

export function QualificationRunView({
  record,
  failReason,
  loading,
  busy,
  error,
  onFailReason,
  onConfirm,
  onCancel,
  onComplete,
  onFail,
}: {
  record: QualificationRunDetailView | null;
  failReason: string;
  loading: boolean;
  busy: boolean;
  error: string | null;
  onFailReason: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onFail: () => void;
}) {
  return (
    <section className="space-y-6" data-testid="qualification-run">
      <div>
        <Link to="/qualification/history" className="text-sm text-sky-400 hover:text-sky-300">
          Run history
        </Link>
        {record ? (
          <Link
            to={`/qualification/targets/${encodeURIComponent(record.targetId)}`}
            className="ml-4 text-sm text-sky-400 hover:text-sky-300"
          >
            Target
          </Link>
        ) : null}
        <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Qualification run</p>
        <h2 className="mt-1 text-2xl font-semibold">
          {record?.displayName ?? record?.marketSymbol ?? 'Run'}
        </h2>
        <p className="mt-2 text-slate-400">
          Confirm starts heavy work. Complete records existing lifecycle only — it does not score
          the market or start a session.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !record ? (
        <p className="text-slate-400">Loading run…</p>
      ) : !record ? (
        <p className="text-slate-400">Qualification run not found.</p>
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Row label="Status" value={runStatusLabel(record.status)} />
            <Row label="Mode" value={modeLabel(record.modeContext)} />
            <Row label="Requested by" value={record.requestedBy} />
            <Row label="Confirmed by" value={record.confirmedBy ?? 'Not confirmed'} />
            <Row label="Created" value={formatUtc(record.createdAt)} />
            <Row
              label="Completed"
              value={record.completedAt ? formatUtc(record.completedAt) : 'In progress'}
            />
            <Row
              label="Lifecycle"
              value={record.lifecycle ? lifecycleLabel(record.lifecycle.state) : 'Unknown'}
            />
            <Row label="Confidence" value={confidenceLabel(record.confidence?.level ?? null)} />
            <Row label="Health" value={healthLabel(record.health?.status ?? null)} />
            <Row label="Observations" value={String(record.inputSummary.observationCount)} />
          </dl>

          {record.rejectionReasons.length > 0 ? (
            <p className="text-sm text-red-200">{record.rejectionReasons.join(', ')}</p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {record.actions.canConfirm ? (
              <button
                type="button"
                disabled={busy}
                onClick={onConfirm}
                data-testid="qualification-confirm"
                className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
              >
                Confirm run
              </button>
            ) : null}
            {record.actions.canComplete ? (
              <button
                type="button"
                disabled={busy}
                onClick={onComplete}
                data-testid="qualification-complete"
                className="rounded border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/20 disabled:opacity-50"
              >
                Record completion
              </button>
            ) : null}
            {record.actions.canCancel ? (
              <button
                type="button"
                disabled={busy}
                onClick={onCancel}
                data-testid="qualification-cancel"
                className="rounded border border-slate-500/40 bg-slate-500/10 px-3 py-2 text-sm text-slate-100 hover:bg-slate-500/20 disabled:opacity-50"
              >
                Cancel run
              </button>
            ) : null}
          </div>

          {record.actions.canFail ? (
            <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Record failure
              </h3>
              <input
                value={failReason}
                onChange={(event) => onFailReason(event.target.value)}
                data-testid="qualification-fail-reason"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              />
              <button
                type="button"
                disabled={busy || !failReason.trim()}
                onClick={onFail}
                data-testid="qualification-fail"
                className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-100 hover:bg-red-500/20 disabled:opacity-50"
              >
                Record failure
              </button>
            </section>
          ) : null}
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

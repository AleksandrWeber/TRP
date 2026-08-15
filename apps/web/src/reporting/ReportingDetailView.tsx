import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ReportRunDetailView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  buildProjectionExport,
  deliveryOutcomeLabel,
  modeBadgeLabel,
  reportKindLabel,
  reportStatusLabel,
} from './reporting';

export function ReportingDetailView({
  record,
  loading,
  error,
  onExport,
}: {
  record: ReportRunDetailView | null;
  loading: boolean;
  error: string | null;
  onExport?: (payload: string) => void;
}) {
  if (loading) {
    return (
      <section data-testid="reporting-detail">
        <p className="text-sm text-slate-500">Loading report run…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4" data-testid="reporting-detail">
        <BackLinks />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      </section>
    );
  }

  if (!record) {
    return (
      <section className="space-y-4" data-testid="reporting-detail">
        <BackLinks />
        <p className="text-sm text-slate-500">Report run not found.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="reporting-detail">
      <BackLinks />
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Report run</p>
        <h2 className="mt-1 text-2xl font-semibold">{record.name}</h2>
        <p className="mt-2 text-slate-400">
          Projection only. If this conflicts with Ledger, Fills, Orders, or Session, Source of Truth
          wins.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
          {reportStatusLabel(record.status)}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
          {reportKindLabel(record.kind)}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
          {modeBadgeLabel(record.modes)}
        </span>
      </div>

      <Panel title="Report metadata">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Report run" value={record.reportRunId} />
          <Fact label="Definition" value={record.reportDefinitionId} />
          <Fact label="Created" value={formatUtc(record.createdAt)} />
          <Fact label="Exchange Scope" value={record.exchangeScopeId} />
          <Fact label="Trading Session" value={record.tradingSessionId ?? '—'} />
          <Fact label="Library entry" value={record.libraryEntryId ?? '—'} />
          <Fact
            label="Window"
            value={`${formatUtc(record.windowFrom)} → ${formatUtc(record.windowTo)}`}
          />
          <Fact label="Window preset" value={record.windowPreset ?? '—'} />
          <Fact label="Fact count" value={String(record.factCount)} />
          <Fact label="Metrics" value={record.metricKeys.join(', ') || '—'} />
        </dl>
        {record.description && <p className="mt-3 text-sm text-slate-400">{record.description}</p>}
        {record.rejectionReasons.length > 0 && (
          <ul className="mt-3 list-disc pl-5 text-sm text-rose-200">
            {record.rejectionReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Aggregations">
        {record.aggregations.length === 0 ? (
          <p className="text-sm text-slate-500">No aggregation slices on this run.</p>
        ) : (
          <ul className="space-y-2">
            {record.aggregations.map((slice) => (
              <li
                key={slice.sliceId}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm"
                data-testid="reporting-aggregation"
              >
                <p className="font-medium">{slice.label}</p>
                <p className="text-slate-400">
                  {slice.metricKey}
                  {slice.mode ? ` · ${slice.mode}` : ''} · {stringifyValue(slice.value)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {record.exportAvailable && (
          <button
            type="button"
            data-testid="reporting-export"
            onClick={() => onExport?.(buildProjectionExport(record))}
            className="mt-3 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5"
          >
            Export projection (JSON)
          </button>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Export is the existing aggregation projection. It is not a PDF engine and not ledger SoT.
        </p>
      </Panel>

      <Panel title="Narrative">
        {record.narrative ? (
          <div data-testid="reporting-narrative">
            <p className="text-sm text-slate-200">{record.narrative.narrativeText}</p>
            <p className="mt-2 text-xs text-slate-500">
              {record.narrative.narrativeUnavailable
                ? 'Narrative unavailable. AI remains narrative only.'
                : 'AI Analytics narrative. ReportRun was not mutated.'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No narrative attached to this run.</p>
        )}
      </Panel>

      <Panel title="Delivery">
        {record.delivery ? (
          <dl className="grid gap-3 sm:grid-cols-2" data-testid="reporting-delivery">
            <Fact label="Outcome" value={deliveryOutcomeLabel(record.delivery.outcome)} />
            <Fact label="Delivery id" value={record.delivery.deliveryId ?? '—'} />
            <Fact label="Type" value={record.delivery.notificationType ?? '—'} />
            <Fact
              label="Telegram adapter"
              value={record.delivery.telegramAdapterReached ? 'reached' : 'not reached'}
            />
            <Fact label="Skip reasons" value={record.delivery.skipReasons.join(', ') || '—'} />
          </dl>
        ) : (
          <p className="text-sm text-slate-500" data-testid="reporting-delivery-empty">
            No delivery recorded. Notification remains delivery only; this page does not send.
          </p>
        )}
        <p className="mt-3 text-xs">
          <Link to="/notifications" className="text-sky-400 hover:text-sky-300">
            Open notification settings
          </Link>
        </p>
      </Panel>
    </section>
  );
}

function BackLinks() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to="/reporting" className="text-sky-400 hover:text-sky-300">
        Reporting home
      </Link>
      <Link to="/reporting/history" className="text-sky-400 hover:text-sky-300">
        History
      </Link>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-all text-sm text-slate-200">{value}</dd>
    </div>
  );
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

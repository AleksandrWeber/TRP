import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { NotificationDeliveryDetailView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  deliveryOutcomeLabel,
  notificationTypeLabel,
  skipReasonLabel,
  telegramStatusLabel,
} from './notifications';

export function NotificationDetailView({
  record,
  loading,
  error,
}: {
  record: NotificationDeliveryDetailView | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <section data-testid="notification-detail">
        <p className="text-sm text-slate-500">Loading delivery…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-4" data-testid="notification-detail">
        <BackLinks />
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      </section>
    );
  }

  if (!record) {
    return (
      <section className="space-y-4" data-testid="notification-detail">
        <BackLinks />
        <p className="text-sm text-slate-500">Delivery not found.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="notification-detail">
      <BackLinks />
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Delivery</p>
        <h2 className="mt-1 text-2xl font-semibold">{notificationTypeLabel(record.type)}</h2>
        <p className="mt-2 text-slate-400">
          Recorded delivery result. This page does not send, retry, or generate reports. Telegram is
          transport only.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
          {deliveryOutcomeLabel(record.outcome)}
        </span>
      </div>

      <Panel title="Delivery result">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label="Delivery id" value={record.deliveryId} />
          <Fact label="Type" value={notificationTypeLabel(record.type)} />
          <Fact label="Created" value={formatUtc(record.createdAt)} />
          <Fact label="Report run" value={record.reportRunId ?? '—'} />
          <Fact
            label="Skip reasons"
            value={record.skipReasons.map(skipReasonLabel).join(', ') || '—'}
          />
          <Fact
            label="Telegram status (current)"
            value={telegramStatusLabel(record.telegram.status)}
          />
        </dl>
      </Panel>

      <Panel title="Channel attempts">
        {record.attempts.length === 0 ? (
          <p className="text-sm text-slate-500">No channel attempts recorded.</p>
        ) : (
          <ul className="space-y-2">
            {record.attempts.map((attempt, index) => (
              <li
                key={`${attempt.channelId}-${index}`}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm"
                data-testid="notification-attempt"
              >
                <p className="font-medium">
                  {attempt.channelId} · {deliveryOutcomeLabel(attempt.outcome)}
                </p>
                <p className="text-slate-400">
                  {attempt.skipReason
                    ? skipReasonLabel(attempt.skipReason)
                    : (attempt.detail ?? '—')}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Telegram adapter{' '}
          {record.channelDelivery.telegramAdapterReached ? 'reached' : 'not reached'}. Bot API was
          not used. Deferred channels stay reserved.
        </p>
      </Panel>
    </section>
  );
}

function BackLinks() {
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Link to="/notifications" className="text-sky-400 hover:text-sky-300">
        Notification settings
      </Link>
      <Link to="/notifications/history" className="text-sky-400 hover:text-sky-300">
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

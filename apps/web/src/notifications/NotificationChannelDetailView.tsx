import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type {
  NotificationChannelDetailView as ChannelDetail,
  NotificationChannelDiagnosticsView,
  NotificationDeliveryListItemView,
} from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  configurationHealthLabel,
  connectionStateLabel,
  deliveryOutcomeLabel,
  notificationTypeLabel,
  skipReasonLabel,
} from './notifications';

export function NotificationChannelDetailView({
  channel,
  diagnostics,
  history,
  loading,
  error,
}: {
  channel: ChannelDetail | null;
  diagnostics: NotificationChannelDiagnosticsView | null;
  history: readonly NotificationDeliveryListItemView[];
  loading: boolean;
  error: string | null;
}) {
  if (loading && !channel) {
    return (
      <section data-testid="channel-detail">
        <p className="text-sm text-slate-500">Loading channel…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="channel-detail">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Notification channels</p>
        <h2 className="mt-1 text-2xl font-semibold">{channel?.label ?? 'Channel'}</h2>
        <p className="mt-2 text-slate-400">
          Reserved channel. Required future fields are listed so the operator can see what this
          channel will need. SMTP, webhooks, and live transports are not collected and not
          activated. Send test is not offered.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/notifications/channels" className="text-sky-400 hover:text-sky-300">
            All channels
          </Link>
          {channel && (
            <Link
              to={`/notifications/channels/${channel.channelId}/history`}
              className="text-sky-400 hover:text-sky-300"
            >
              Channel history
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!channel ? (
        <p className="text-sm text-slate-500" data-testid="channel-empty">
          Channel not found.
        </p>
      ) : (
        <>
          <Panel title="Configuration">
            <p className="text-sm text-slate-400">
              Status: Reserved — not offered. These fields are required when the channel is offered.
              They are not forms.
            </p>
            <ul className="mt-3 space-y-2" data-testid="channel-required-fields">
              {channel.configuration.requiredFields.map((field) => (
                <li
                  key={field}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300"
                >
                  {field}
                  <span className="ml-2 text-xs text-slate-500">Not offered</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Diagnostics">
            {diagnostics ? (
              <dl className="grid gap-3 sm:grid-cols-2 text-sm" data-testid="channel-diagnostics">
                <Fact
                  label="Connection state"
                  value={connectionStateLabel(diagnostics.connectionState)}
                />
                <Fact
                  label="Configuration health"
                  value={configurationHealthLabel(diagnostics.configurationHealth)}
                />
                <Fact
                  label="Last successful delivery"
                  value={diagnostics.lastSuccessfulDeliveryId ?? 'None'}
                />
                <Fact label="Last failure" value={diagnostics.lastFailureDeliveryId ?? 'None'} />
                <Fact
                  label="Last skip"
                  value={
                    diagnostics.lastSkipReason
                      ? skipReasonLabel(diagnostics.lastSkipReason)
                      : 'None'
                  }
                />
                <Fact
                  label="Last delivery"
                  value={
                    diagnostics.lastDeliveryAt ? formatUtc(diagnostics.lastDeliveryAt) : 'None'
                  }
                />
                <Fact label="Latency" value="Not available" />
                <Fact label="Send test" value="Not offered" />
                <Fact label="Live transport" value="Not activated" />
              </dl>
            ) : (
              <p className="text-sm text-slate-500">No diagnostics yet.</p>
            )}
          </Panel>

          <Panel title="Recent deliveries">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500" data-testid="channel-history-empty">
                No recorded deliveries for this channel.
              </p>
            ) : (
              <ul className="space-y-2">
                {history.slice(0, 5).map((item) => (
                  <li key={item.deliveryId}>
                    <Link
                      to={`/notifications/${item.deliveryId}`}
                      data-testid="channel-history-link"
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
                    >
                      <span>
                        {notificationTypeLabel(item.type)}{' '}
                        <span className="text-slate-500">{item.deliveryId}</span>
                      </span>
                      <span className="text-xs text-slate-500">
                        {deliveryOutcomeLabel(item.outcome)}
                        {item.skipReasons.length
                          ? ` · ${item.skipReasons.map(skipReasonLabel).join(', ')}`
                          : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </section>
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
      <dd className="mt-1 text-slate-200">{value}</dd>
    </div>
  );
}

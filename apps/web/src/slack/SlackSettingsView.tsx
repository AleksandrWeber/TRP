import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type {
  NotificationDeliveryListItemView,
  SlackConnectionProductView,
  SlackDiagnosticsView,
  SlackTestProductView,
} from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  deliveryOutcomeLabel,
  notificationTypeLabel,
  skipReasonLabel,
} from '../notifications/notifications';
import { slackStatusLabel, slackVerificationLabel } from './slack';

export function SlackSettingsView({
  connection,
  diagnostics,
  history,
  lastTest,
  loading,
  acting,
  error,
  onBind,
  onTest,
  onDisconnect,
}: {
  connection: SlackConnectionProductView | null;
  diagnostics: SlackDiagnosticsView | null;
  history: readonly NotificationDeliveryListItemView[];
  lastTest: SlackTestProductView | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
  onBind: () => void;
  onTest: () => void;
  onDisconnect: () => void;
}) {
  if (loading && !connection) {
    return (
      <section data-testid="slack-settings">
        <p className="text-sm text-slate-500">Loading Slack connection…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="slack-settings">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Notification channels</p>
        <h2 className="mt-1 text-2xl font-semibold">Slack settings</h2>
        <p className="mt-2 text-slate-400">
          Notification channel only. Incoming Webhook URL stays in Connections / Vault. Slack cannot
          trade, pause, or kill. Connected requires a successful webhook test send.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/notifications/channels" className="text-sky-400 hover:text-sky-300">
            All channels
          </Link>
          <Link
            to="/notifications/channels/slack/history"
            className="text-sky-400 hover:text-sky-300"
          >
            Slack delivery history
          </Link>
          <Link to="/connections" className="text-sky-400 hover:text-sky-300">
            Slack webhook credentials
          </Link>
          <Link to="/notifications" className="text-sky-400 hover:text-sky-300">
            Notification settings
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {!connection ? (
        <p className="text-sm text-slate-500" data-testid="slack-empty">
          No Slack connection in this workspace.
        </p>
      ) : (
        <>
          <Panel title="Connection status">
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <Fact label="Status" value={slackStatusLabel(connection.status)} />
              <Fact label="Verification" value={slackVerificationLabel(connection)} />
              <Fact label="Bound" value={connection.bound ? 'Yes' : 'No'} />
              <Fact label="Transport" value={slackTransportLabel(connection.transport)} />
              <Fact label="Webhook used" value={connection.webhookUsed ? 'Yes' : 'No'} />
              <Fact
                label="Connected at"
                value={connection.connectedAt ? formatUtc(connection.connectedAt) : '—'}
              />
              <Fact label="Last error" value={connection.lastErrorCode ?? '—'} />
              <Fact label="Control plane" value="No" />
            </dl>
          </Panel>

          <Panel title="Channel bind">
            <div className="space-y-3" data-testid="slack-wizard">
              <p className="text-sm text-slate-400">
                Store a Slack Incoming Webhook under Connections first. Binding does not mean
                Connected. Send a test after bind. The webhook URL is never shown here.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="slack-bind"
                  disabled={acting}
                  onClick={onBind}
                  className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Bind Slack
                </button>
                <button
                  type="button"
                  data-testid="slack-test"
                  disabled={acting || !connection.testAvailable}
                  onClick={onTest}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Send test
                </button>
                <button
                  type="button"
                  data-testid="slack-disconnect"
                  disabled={acting || !connection.disconnectAvailable}
                  onClick={onDisconnect}
                  className="rounded-lg border border-white/20 px-3 py-2 text-sm disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </Panel>

          {diagnostics && (
            <Panel title="Diagnostics">
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <Fact label="Transport" value={slackTransportLabel(diagnostics.slackTransport)} />
                <Fact label="Webhook used" value={diagnostics.webhookUsed ? 'Yes' : 'No'} />
                <Fact label="Scheduler" value={diagnostics.scheduler ? 'Yes' : 'No'} />
                <Fact label="Retries" value={diagnostics.retries ? 'Yes' : 'No'} />
                <Fact
                  label="Last delivery"
                  value={
                    diagnostics.lastSlackDelivery
                      ? `${diagnostics.lastSlackDelivery.outcome} (${diagnostics.lastSlackDelivery.deliveryId})`
                      : '—'
                  }
                />
                <Fact
                  label="Adapter reached"
                  value={
                    diagnostics.lastSlackDelivery?.adapterReached
                      ? 'Yes'
                      : diagnostics.lastSlackDelivery
                        ? 'No'
                        : '—'
                  }
                />
              </dl>
            </Panel>
          )}

          {lastTest && (
            <Panel title="Last test">
              <p className="text-sm text-slate-300" data-testid="slack-last-test">
                {deliveryOutcomeLabel(lastTest.delivery.outcome)} — {lastTest.delivery.deliveryId}
              </p>
            </Panel>
          )}

          <Panel title="Recent deliveries">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No Slack deliveries yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {history.map((item) => (
                  <li
                    key={item.deliveryId}
                    className="rounded-lg border border-white/10 px-3 py-2"
                    data-testid="slack-history-item"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <span>{notificationTypeLabel(item.type)}</span>
                      <span>{deliveryOutcomeLabel(item.outcome)}</span>
                    </div>
                    <div className="mt-1 text-slate-500">
                      {formatUtc(item.createdAt)}
                      {item.skipReasons?.[0] ? ` · ${skipReasonLabel(item.skipReasons[0])}` : ''}
                    </div>
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

function slackTransportLabel(transport: string): string {
  if (transport === 'webhook') return 'Webhook';
  if (transport === 'in-memory') return 'In-memory';
  return transport;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-100">{value}</dd>
    </div>
  );
}

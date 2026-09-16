import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type {
  PushConnectionProductView,
  PushDiagnosticsView,
  PushTestProductView,
  NotificationDeliveryListItemView,
} from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  deliveryOutcomeLabel,
  notificationTypeLabel,
  skipReasonLabel,
} from '../notifications/notifications';
import { pushStatusLabel, pushVerificationLabel } from './push';

export function PushSettingsView({
  connection,
  diagnostics,
  history,
  lastTest,
  loading,
  acting,
  error,
  onBind,
  onRegister,
  onTest,
  onDisconnect,
}: {
  connection: PushConnectionProductView | null;
  diagnostics: PushDiagnosticsView | null;
  history: readonly NotificationDeliveryListItemView[];
  lastTest: PushTestProductView | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
  onBind: () => void;
  onRegister: () => void;
  onTest: () => void;
  onDisconnect: () => void;
}) {
  if (loading && !connection) {
    return (
      <section data-testid="push-settings">
        <p className="text-sm text-slate-500">Loading Push connection…</p>
      </section>
    );
  }

  const subscriptionPresent =
    diagnostics && 'subscriptionPresent' in diagnostics
      ? Boolean(diagnostics.subscriptionPresent)
      : null;
  const subscriptionCount =
    diagnostics && typeof diagnostics.subscriptionCount === 'number'
      ? diagnostics.subscriptionCount
      : null;

  return (
    <section className="space-y-6" data-testid="push-settings">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Notification channels</p>
        <h2 className="mt-1 text-2xl font-semibold">Push settings</h2>
        <p className="mt-2 text-slate-400">
          Browser Web Push only. VAPID credentials stay in Connections / Vault. Push cannot trade,
          pause, or kill. Connected requires a successful test send. Customer-visible browser
          notification proof remains FIV and is not claimed here.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/notifications/channels" className="text-sky-400 hover:text-sky-300">
            All channels
          </Link>
          <Link
            to="/notifications/channels/push/history"
            className="text-sky-400 hover:text-sky-300"
          >
            Push delivery history
          </Link>
          <Link to="/connections" className="text-sky-400 hover:text-sky-300">
            Push VAPID credentials
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
        <p className="text-sm text-slate-500" data-testid="push-empty">
          No Push connection in this workspace.
        </p>
      ) : (
        <>
          <Panel title="Connection status">
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <Fact label="Status" value={pushStatusLabel(connection.status)} />
              <Fact label="Verification" value={pushVerificationLabel(connection)} />
              <Fact label="Bound" value={connection.bound ? 'Yes' : 'No'} />
              <Fact label="Transport" value={pushTransportLabel(connection.transport)} />
              <Fact label="Push used" value={connection.pushUsed ? 'Yes' : 'No'} />
              <Fact label="Adapter reached" value={connection.adapterReached ? 'Yes' : 'No'} />
              <Fact
                label="Connected at"
                value={connection.connectedAt ? formatUtc(connection.connectedAt) : '—'}
              />
              <Fact label="Last error" value={connection.lastErrorCode ?? '—'} />
              <Fact label="Control plane" value="No" />
            </dl>
          </Panel>

          <Panel title="Channel bind">
            <div className="space-y-3" data-testid="push-wizard">
              <p className="text-sm text-slate-400">
                Store Web Push VAPID under Connections first, then bind. Register this browser only
                when you click Register — permission is never requested on other screens. Binding or
                storing a subscription does not mean Connected. Send a test after register. VAPID
                private material is never shown here.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="push-bind"
                  disabled={acting}
                  onClick={onBind}
                  className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Bind Push
                </button>
                <button
                  type="button"
                  data-testid="push-register"
                  disabled={acting || !connection.bound}
                  onClick={onRegister}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Register browser subscription
                </button>
                <button
                  type="button"
                  data-testid="push-test"
                  disabled={acting || !connection.testAvailable}
                  onClick={onTest}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Send test
                </button>
                <button
                  type="button"
                  data-testid="push-disconnect"
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
                <Fact label="Transport" value={pushTransportLabel(diagnostics.pushTransport)} />
                <Fact label="Push used" value={diagnostics.pushUsed ? 'Yes' : 'No'} />
                {subscriptionPresent !== null && (
                  <Fact label="Subscription present" value={subscriptionPresent ? 'Yes' : 'No'} />
                )}
                {subscriptionCount !== null && (
                  <Fact label="Subscription count" value={String(subscriptionCount)} />
                )}
                <Fact label="Scheduler" value={diagnostics.scheduler ? 'Yes' : 'No'} />
                <Fact label="Retries" value={diagnostics.retries ? 'Yes' : 'No'} />
                <Fact
                  label="Last delivery"
                  value={
                    diagnostics.lastPushDelivery
                      ? `${diagnostics.lastPushDelivery.outcome} (${diagnostics.lastPushDelivery.deliveryId})`
                      : '—'
                  }
                />
                <Fact
                  label="Adapter reached"
                  value={
                    diagnostics.lastPushDelivery?.adapterReached
                      ? 'Yes'
                      : diagnostics.lastPushDelivery
                        ? 'No'
                        : '—'
                  }
                />
              </dl>
            </Panel>
          )}

          {lastTest && (
            <Panel title="Last test">
              <p className="text-sm text-slate-300" data-testid="push-last-test">
                {deliveryOutcomeLabel(lastTest.delivery.outcome)} — {lastTest.delivery.deliveryId}
              </p>
            </Panel>
          )}

          <Panel title="Recent deliveries">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No Push deliveries yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {history.map((item) => (
                  <li
                    key={item.deliveryId}
                    className="rounded-lg border border-white/10 px-3 py-2"
                    data-testid="push-history-item"
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

function pushTransportLabel(transport: string): string {
  if (transport === 'web-push') return 'Web Push';
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

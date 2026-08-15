import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type {
  NotificationDeliveryListItemView,
  TelegramConnectionProductView,
  TelegramDiagnosticsView,
  TelegramTestProductView,
} from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  deliveryOutcomeLabel,
  notificationTypeLabel,
  skipReasonLabel,
} from '../notifications/notifications';
import { telegramStatusLabel, telegramVerificationLabel } from './telegram';

export function TelegramSettingsView({
  connection,
  diagnostics,
  history,
  lastTest,
  loading,
  acting,
  error,
  onConnect,
  onComplete,
  onVerify,
  onTest,
  onDisconnect,
}: {
  connection: TelegramConnectionProductView | null;
  diagnostics: TelegramDiagnosticsView | null;
  history: readonly NotificationDeliveryListItemView[];
  lastTest: TelegramTestProductView | null;
  loading: boolean;
  acting: boolean;
  error: string | null;
  onConnect: () => void;
  onComplete: () => void;
  onVerify: () => void;
  onTest: () => void;
  onDisconnect: () => void;
}) {
  if (loading && !connection) {
    return (
      <section data-testid="telegram-settings">
        <p className="text-sm text-slate-500">Loading Telegram connection…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="telegram-settings">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Notification channels</p>
        <h2 className="mt-1 text-2xl font-semibold">Telegram settings</h2>
        <p className="mt-2 text-slate-400">
          Notification channel only. Telegram cannot trade, pause, or kill. Chat id is never
          entered. Transport is in-memory — Bot API is not used.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/notifications/channels" className="text-sky-400 hover:text-sky-300">
            All channels
          </Link>
          <Link
            to="/notifications/channels/telegram/history"
            className="text-sky-400 hover:text-sky-300"
          >
            Telegram delivery history
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
        <p className="text-sm text-slate-500" data-testid="telegram-empty">
          No Telegram connection in this workspace.
        </p>
      ) : (
        <>
          <Panel title="Connection status">
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <Fact label="Status" value={telegramStatusLabel(connection.status)} />
              <Fact label="Verification" value={telegramVerificationLabel(connection)} />
              <Fact label="Chat bound" value={connection.chatBound ? 'Yes' : 'No'} />
              <Fact label="Transport" value="In-memory" />
              <Fact
                label="Connected at"
                value={connection.connectedAt ? formatUtc(connection.connectedAt) : '—'}
              />
              <Fact label="Control plane" value="No" />
            </dl>
          </Panel>

          <Panel title="Connection wizard">
            {connection.status === 'not-connected' && (
              <div className="space-y-3" data-testid="telegram-wizard-not-connected">
                <p className="text-sm text-slate-400">
                  Connect starts a pending bind. The in-memory adapter supplies the chat id. You
                  never type a chat id.
                </p>
                <button
                  type="button"
                  data-testid="telegram-connect"
                  disabled={acting || !connection.connectAvailable}
                  onClick={onConnect}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                >
                  {acting ? 'Connecting…' : 'Connect Telegram'}
                </button>
              </div>
            )}

            {connection.status === 'pending' && (
              <div className="space-y-3" data-testid="telegram-wizard-pending">
                <p className="text-sm text-slate-400">
                  Pending. Open the deep link, then complete bind. Chat id stays adapter-supplied.
                </p>
                {connection.deepLink && (
                  <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-slate-300">
                    {connection.deepLink}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="telegram-complete"
                    disabled={acting || !connection.completeAvailable}
                    onClick={onComplete}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                  >
                    Complete bind
                  </button>
                  <button
                    type="button"
                    data-testid="telegram-verify"
                    disabled={acting || !connection.verifyAvailable}
                    onClick={onVerify}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    data-testid="telegram-disconnect"
                    disabled={acting || !connection.disconnectAvailable}
                    onClick={onDisconnect}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}

            {connection.status === 'connected' && (
              <div className="space-y-3" data-testid="telegram-wizard-connected">
                <p className="text-sm text-slate-400">
                  Connected. Send a test through existing Notification Delivery. Telegram still
                  cannot trade.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-testid="telegram-verify"
                    disabled={acting || !connection.verifyAvailable}
                    onClick={onVerify}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    data-testid="telegram-test"
                    disabled={acting || !connection.testAvailable}
                    onClick={onTest}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                  >
                    Send test notification
                  </button>
                  <button
                    type="button"
                    data-testid="telegram-disconnect"
                    disabled={acting || !connection.disconnectAvailable}
                    onClick={onDisconnect}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </Panel>

          {lastTest && (
            <Panel title="Last test">
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <Fact label="Delivery" value={lastTest.delivery.deliveryId} />
                <Fact label="Outcome" value={deliveryOutcomeLabel(lastTest.delivery.outcome)} />
                <Fact
                  label="Adapter reached"
                  value={lastTest.delivery.channelDelivery.telegramAdapterReached ? 'Yes' : 'No'}
                />
                <Fact label="Bot API" value="Not used" />
              </dl>
            </Panel>
          )}

          <Panel title="Diagnostics">
            {diagnostics ? (
              <dl className="grid gap-3 sm:grid-cols-2 text-sm" data-testid="telegram-diagnostics">
                <Fact label="Status" value={telegramStatusLabel(diagnostics.connection.status)} />
                <Fact label="Verified" value={diagnostics.verification.verified ? 'Yes' : 'No'} />
                <Fact label="Transport" value="In-memory" />
                <Fact label="Bot API" value="Not used" />
                <Fact
                  label="Last Telegram delivery"
                  value={
                    diagnostics.lastTelegramDelivery
                      ? `${diagnostics.lastTelegramDelivery.deliveryId} · ${deliveryOutcomeLabel(diagnostics.lastTelegramDelivery.outcome)}`
                      : 'None'
                  }
                />
                <Fact
                  label="Adapter reached"
                  value={diagnostics.lastTelegramDelivery?.adapterReached ? 'Yes' : 'No'}
                />
                <Fact label="Scheduler" value="No" />
                <Fact label="Retries" value="No" />
              </dl>
            ) : (
              <p className="text-sm text-slate-500">No diagnostics yet.</p>
            )}
          </Panel>

          <Panel title="Recent Telegram deliveries">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500" data-testid="telegram-history-empty">
                No Telegram deliveries in this workspace.
              </p>
            ) : (
              <ul className="space-y-2">
                {history.slice(0, 5).map((item) => (
                  <li key={item.deliveryId}>
                    <Link
                      to={`/notifications/${item.deliveryId}`}
                      data-testid="telegram-history-link"
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

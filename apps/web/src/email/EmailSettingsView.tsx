import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type {
  EmailConnectionProductView,
  EmailDiagnosticsView,
  EmailTestProductView,
  NotificationDeliveryListItemView,
} from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  deliveryOutcomeLabel,
  notificationTypeLabel,
  skipReasonLabel,
} from '../notifications/notifications';
import { emailStatusLabel, emailVerificationLabel } from './email';

export function EmailSettingsView({
  connection,
  diagnostics,
  history,
  lastTest,
  recipientDraft,
  loading,
  acting,
  error,
  onRecipientDraft,
  onBind,
  onTest,
  onDisconnect,
}: {
  connection: EmailConnectionProductView | null;
  diagnostics: EmailDiagnosticsView | null;
  history: readonly NotificationDeliveryListItemView[];
  lastTest: EmailTestProductView | null;
  recipientDraft: string;
  loading: boolean;
  acting: boolean;
  error: string | null;
  onRecipientDraft: (value: string) => void;
  onBind: () => void;
  onTest: () => void;
  onDisconnect: () => void;
}) {
  if (loading && !connection) {
    return (
      <section data-testid="email-settings">
        <p className="text-sm text-slate-500">Loading Email connection…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="email-settings">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Notification channels</p>
        <h2 className="mt-1 text-2xl font-semibold">Email settings</h2>
        <p className="mt-2 text-slate-400">
          Notification channel only. SMTP credentials stay in Connections / Vault. Email cannot
          trade, pause, or kill. Connected requires a successful SMTP test send.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/notifications/channels" className="text-sky-400 hover:text-sky-300">
            All channels
          </Link>
          <Link
            to="/notifications/channels/email/history"
            className="text-sky-400 hover:text-sky-300"
          >
            Email delivery history
          </Link>
          <Link to="/connections" className="text-sky-400 hover:text-sky-300">
            SMTP credentials
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
        <p className="text-sm text-slate-500" data-testid="email-empty">
          No Email connection in this workspace.
        </p>
      ) : (
        <>
          <Panel title="Connection status">
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <Fact label="Status" value={emailStatusLabel(connection.status)} />
              <Fact label="Verification" value={emailVerificationLabel(connection)} />
              <Fact label="Recipient bound" value={connection.recipientBound ? 'Yes' : 'No'} />
              <Fact label="Recipient" value={connection.recipient ?? '—'} />
              <Fact label="Transport" value={emailTransportLabel(connection.transport)} />
              <Fact
                label="Connected at"
                value={connection.connectedAt ? formatUtc(connection.connectedAt) : '—'}
              />
              <Fact label="Control plane" value="No" />
            </dl>
          </Panel>

          <Panel title="Recipient bind">
            <div className="space-y-3" data-testid="email-wizard">
              <p className="text-sm text-slate-400">
                Store SMTP under Connections first. Binding a recipient does not mean Connected.
                Send a test after bind.
              </p>
              <label className="block space-y-1 text-sm">
                <span className="text-slate-400">Recipient</span>
                <input
                  value={recipientDraft}
                  data-testid="email-recipient"
                  onChange={(event) => onRecipientDraft(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  autoComplete="off"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-testid="email-bind"
                  disabled={acting || !connection.bindAvailable}
                  onClick={onBind}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                >
                  {acting ? 'Binding…' : 'Bind recipient'}
                </button>
                <button
                  type="button"
                  data-testid="email-test"
                  disabled={acting || !connection.testAvailable}
                  onClick={onTest}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                >
                  Send test notification
                </button>
                <button
                  type="button"
                  data-testid="email-disconnect"
                  disabled={acting || !connection.disconnectAvailable}
                  onClick={onDisconnect}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </Panel>

          {lastTest && (
            <Panel title="Last test">
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <Fact label="Delivery" value={lastTest.delivery.deliveryId} />
                <Fact label="Outcome" value={deliveryOutcomeLabel(lastTest.delivery.outcome)} />
                <Fact label="SMTP used" value={lastTest.smtpUsed ? 'Yes' : 'No'} />
                <Fact
                  label="Connected after test"
                  value={lastTest.connection.connected ? 'Yes' : 'No'}
                />
              </dl>
            </Panel>
          )}

          <Panel title="Diagnostics">
            {diagnostics ? (
              <dl className="grid gap-3 sm:grid-cols-2 text-sm" data-testid="email-diagnostics">
                <Fact label="Status" value={emailStatusLabel(diagnostics.connection.status)} />
                <Fact label="Verified" value={diagnostics.verification.verified ? 'Yes' : 'No'} />
                <Fact label="Transport" value={emailTransportLabel(diagnostics.emailTransport)} />
                <Fact label="SMTP used" value={diagnostics.smtpUsed ? 'Yes' : 'No'} />
                <Fact
                  label="Last Email delivery"
                  value={
                    diagnostics.lastEmailDelivery
                      ? `${diagnostics.lastEmailDelivery.deliveryId} · ${deliveryOutcomeLabel(diagnostics.lastEmailDelivery.outcome)}`
                      : 'None'
                  }
                />
                <Fact
                  label="Adapter reached"
                  value={diagnostics.lastEmailDelivery?.adapterReached ? 'Yes' : 'No'}
                />
                <Fact label="Scheduler" value="No" />
                <Fact label="Retries" value="No" />
              </dl>
            ) : (
              <p className="text-sm text-slate-500">No diagnostics yet.</p>
            )}
          </Panel>

          <Panel title="Recent Email deliveries">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500" data-testid="email-history-empty">
                No Email deliveries in this workspace.
              </p>
            ) : (
              <ul className="space-y-2">
                {history.slice(0, 5).map((item) => (
                  <li key={item.deliveryId}>
                    <Link
                      to={`/notifications/${item.deliveryId}`}
                      data-testid="email-history-link"
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

function emailTransportLabel(transport: 'in-memory' | 'smtp'): string {
  return transport === 'smtp' ? 'SMTP' : 'In-memory';
}

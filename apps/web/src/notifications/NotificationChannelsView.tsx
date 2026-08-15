import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { NotificationChannelsWorkspaceView } from '../shared/api';
import {
  TIMEZONE_OPTIONS,
  configurationHealthLabel,
  connectionStateLabel,
  notificationTypeLabel,
  skipReasonLabel,
} from './notifications';

export type ChannelsDraft = {
  enabled: boolean;
  telegramEnabled: boolean;
  typeEnabled: Record<string, boolean>;
  typeCritical: Record<string, boolean>;
  typeTelegram: Record<string, boolean>;
  timezone: string;
  dailyDeliveryTime: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  criticalBypassQuietHours: boolean;
};

export function draftFromWorkspace(workspace: NotificationChannelsWorkspaceView): ChannelsDraft {
  const typeEnabled: Record<string, boolean> = {};
  const typeCritical: Record<string, boolean> = {};
  const typeTelegram: Record<string, boolean> = {};
  for (const row of workspace.routingMatrix.rows) {
    typeEnabled[row.type] = row.enabled;
    typeCritical[row.type] = row.critical;
    typeTelegram[row.type] = row.channels.telegram === true;
  }
  return {
    enabled: workspace.masterEnabled,
    telegramEnabled:
      workspace.channels.find((channel) => channel.channelId === 'telegram')?.enabled === true,
    typeEnabled,
    typeCritical,
    typeTelegram,
    timezone: workspace.timing.timezone,
    dailyDeliveryTime: workspace.timing.dailyDeliveryTime,
    quietHoursEnabled: Boolean(workspace.quietHours),
    quietHoursStart: workspace.quietHours?.start ?? '22:00',
    quietHoursEnd: workspace.quietHours?.end ?? '07:00',
    criticalBypassQuietHours: workspace.criticalBypassQuietHours,
  };
}

export function NotificationChannelsView({
  workspace,
  draft,
  loading,
  saving,
  error,
  saved,
  onDraft,
  onSave,
}: {
  workspace: NotificationChannelsWorkspaceView | null;
  draft: ChannelsDraft | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saved: boolean;
  onDraft: (next: ChannelsDraft) => void;
  onSave: () => void;
}) {
  if (loading && !workspace) {
    return (
      <section data-testid="notification-channels">
        <p className="text-sm text-slate-500">Loading notification channels…</p>
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="notification-channels">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Notifications</p>
        <h2 className="mt-1 text-2xl font-semibold">Notification channels</h2>
        <p className="mt-2 text-slate-400">
          Channel-agnostic product over Notification Delivery. Telegram is the active transport.
          Email, Slack, Discord, Microsoft Teams, and Push stay reserved. This page does not
          redesign routing, activate live transports, or schedule digests.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/notifications" className="text-sky-400 hover:text-sky-300">
            Notification settings
          </Link>
          <Link to="/notifications/history" className="text-sky-400 hover:text-sky-300">
            Delivery history
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {saved && (
        <p className="text-sm text-emerald-300" data-testid="channels-saved">
          Channel preferences saved.
        </p>
      )}

      {!workspace || !draft ? (
        <p className="text-sm text-slate-500" data-testid="channels-empty">
          No notification channels in this workspace.
        </p>
      ) : (
        <>
          <Panel title="Choose channels">
            <Toggle
              testId="channels-master"
              checked={draft.enabled}
              label="Enable notifications"
              onChange={(enabled) => onDraft({ ...draft, enabled })}
            />
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {workspace.channels.map((channel) => (
                <li
                  key={channel.channelId}
                  className="rounded-lg border border-white/10 bg-black/20 p-4"
                  data-testid={`channel-card-${channel.channelId}`}
                >
                  <p className="text-sm font-medium text-slate-200">{channel.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {channel.offered
                      ? connectionStateLabel(channel.connectionStatus)
                      : 'Reserved — not offered'}
                  </p>
                  {channel.channelId === 'telegram' ? (
                    <div className="mt-3">
                      <Toggle
                        testId="channel-enable-telegram"
                        checked={draft.telegramEnabled}
                        label="Telegram enabled"
                        onChange={(telegramEnabled) => onDraft({ ...draft, telegramEnabled })}
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500">Live transport is not activated.</p>
                  )}
                  <Link
                    to={`/notifications/channels/${channel.channelId}`}
                    className="mt-3 inline-block text-sm text-sky-400 hover:text-sky-300"
                    data-testid={`channel-configure-${channel.channelId}`}
                  >
                    {channel.offered ? 'Configure Telegram' : 'View reserved channel'}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Routing matrix">
            <p className="mb-3 text-xs text-slate-500">
              Existing notification types only. Critical is the existing priority flag. Reserved
              columns are not offered — enabling them would still skip with channel reserved.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm" data-testid="routing-matrix">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">Enabled</th>
                    <th className="px-2 py-2">Critical</th>
                    {workspace.routingMatrix.channelIds.map((channelId) => (
                      <th key={channelId} className="px-2 py-2">
                        {workspace.channels.find((channel) => channel.channelId === channelId)
                          ?.label ?? channelId}
                      </th>
                    ))}
                    <th className="px-2 py-2">Skip</th>
                  </tr>
                </thead>
                <tbody>
                  {workspace.routingMatrix.rows.map((row) => (
                    <tr key={row.type} data-testid={`routing-row-${row.type}`}>
                      <td className="px-2 py-2">{notificationTypeLabel(row.type)}</td>
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          data-testid={`routing-enabled-${row.type}`}
                          checked={draft.typeEnabled[row.type] === true}
                          onChange={(event) =>
                            onDraft({
                              ...draft,
                              typeEnabled: {
                                ...draft.typeEnabled,
                                [row.type]: event.target.checked,
                              },
                            })
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          data-testid={`routing-critical-${row.type}`}
                          checked={draft.typeCritical[row.type] === true}
                          onChange={(event) =>
                            onDraft({
                              ...draft,
                              typeCritical: {
                                ...draft.typeCritical,
                                [row.type]: event.target.checked,
                              },
                            })
                          }
                        />
                      </td>
                      {workspace.routingMatrix.channelIds.map((channelId) => (
                        <td key={channelId} className="px-2 py-2">
                          {channelId === 'telegram' ? (
                            <input
                              type="checkbox"
                              data-testid={`routing-telegram-${row.type}`}
                              checked={draft.typeTelegram[row.type] === true}
                              onChange={(event) =>
                                onDraft({
                                  ...draft,
                                  typeTelegram: {
                                    ...draft.typeTelegram,
                                    [row.type]: event.target.checked,
                                  },
                                })
                              }
                            />
                          ) : (
                            <span className="text-xs text-slate-500">Not offered</span>
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-xs text-slate-500">
                        {row.currentSkipReasons.map(skipReasonLabel).join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Delivery frequency">
            <p className="text-sm text-slate-400">
              Producer timing is immediate when Notification Delivery is invoked. Hourly digest,
              weekly digest, and a scheduler are not offered.
            </p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
              <Fact label="Producer timing" value="Immediate on deliver" />
              <Fact label="Hourly digest" value="Not offered" />
              <Fact label="Weekly digest" value="Not offered" />
              <Fact label="Weekend suppression" value="Not offered" />
              <Fact label="Per-type frequency" value="Not offered" />
              <Fact
                label="Preference clock"
                value={`${workspace.scheduleClock.localTimeHHmm} ${workspace.scheduleClock.timezone}`}
              />
            </dl>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="text-slate-400">Timezone</span>
                <select
                  value={draft.timezone}
                  data-testid="channels-timezone"
                  onChange={(event) => onDraft({ ...draft, timezone: event.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                >
                  {timezoneOptions(draft.timezone).map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-slate-400">Daily delivery time</span>
                <input
                  value={draft.dailyDeliveryTime}
                  data-testid="channels-daily-time"
                  onChange={(event) => onDraft({ ...draft, dailyDeliveryTime: event.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                />
              </label>
            </div>
          </Panel>

          <Panel title="Quiet hours">
            <p className="mb-3 text-xs text-slate-500">
              Global quiet hours only. Per-channel quiet hours are not offered.
            </p>
            <Toggle
              testId="channels-quiet-enabled"
              checked={draft.quietHoursEnabled}
              label="Enable quiet hours"
              onChange={(quietHoursEnabled) => onDraft({ ...draft, quietHoursEnabled })}
            />
            {draft.quietHoursEnabled && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span className="text-slate-400">Quiet hours start</span>
                  <input
                    value={draft.quietHoursStart}
                    data-testid="channels-quiet-start"
                    onChange={(event) => onDraft({ ...draft, quietHoursStart: event.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-slate-400">Quiet hours end</span>
                  <input
                    value={draft.quietHoursEnd}
                    data-testid="channels-quiet-end"
                    onChange={(event) => onDraft({ ...draft, quietHoursEnd: event.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                  />
                </label>
              </div>
            )}
            <div className="mt-3">
              <Toggle
                testId="channels-critical-bypass"
                checked={draft.criticalBypassQuietHours}
                label="Critical types bypass quiet hours"
                onChange={(criticalBypassQuietHours) =>
                  onDraft({ ...draft, criticalBypassQuietHours })
                }
              />
            </div>
          </Panel>

          <p className="text-xs text-slate-500">
            Configuration health is per channel. Telegram uses existing connect / verify / test.
            Reserved channels stay reserved-inactive.
            {workspace.channels
              .map(
                (channel) =>
                  ` ${channel.label}: ${channel.offered ? connectionStateLabel(channel.connectionStatus) : configurationHealthLabel('reserved-inactive')}.`,
              )
              .join('')}
          </p>

          <button
            type="button"
            data-testid="channels-save"
            disabled={saving}
            onClick={onSave}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </>
      )}
    </section>
  );
}

function timezoneOptions(current: string): string[] {
  if ((TIMEZONE_OPTIONS as readonly string[]).includes(current)) return [...TIMEZONE_OPTIONS];
  return [current, ...TIMEZONE_OPTIONS];
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Toggle({
  testId,
  checked,
  label,
  onChange,
}: {
  testId: string;
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        data-testid={testId}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
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

import type { ReactNode } from 'react';
import type { NotificationSettingsView } from '../shared/api';
import { ErrorBanner, LoadingState, PageHeader, SuccessBanner } from '../shared/product-ui';
import {
  TIMEZONE_OPTIONS,
  channelStatusLabel,
  notificationTypeLabel,
  skipReasonLabel,
  telegramStatusLabel,
} from './notifications';

export type NotificationDraft = {
  enabled: boolean;
  telegramEnabled: boolean;
  typeEnabled: Record<string, boolean>;
  timezone: string;
  dailyDeliveryTime: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  criticalBypassQuietHours: boolean;
};

export function draftFromSettings(settings: NotificationSettingsView): NotificationDraft {
  const typeEnabled: Record<string, boolean> = {};
  for (const item of settings.preferences.typeRouting) {
    typeEnabled[item.type] = item.enabled;
  }
  return {
    enabled: settings.preferences.enabled,
    telegramEnabled: settings.preferences.channels.telegram === true,
    typeEnabled,
    timezone: settings.preferences.schedule.timezone,
    dailyDeliveryTime: settings.preferences.schedule.dailyDeliveryTime,
    quietHoursEnabled: Boolean(settings.preferences.schedule.quietHours),
    quietHoursStart: settings.preferences.schedule.quietHours?.start ?? '22:00',
    quietHoursEnd: settings.preferences.schedule.quietHours?.end ?? '07:00',
    criticalBypassQuietHours: settings.preferences.schedule.criticalBypassQuietHours,
  };
}

export function NotificationSettingsView({
  settings,
  draft,
  loading,
  saving,
  error,
  saved,
  onDraft,
  onSave,
}: {
  settings: NotificationSettingsView | null;
  draft: NotificationDraft | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saved: boolean;
  onDraft: (next: NotificationDraft) => void;
  onSave: () => void;
}) {
  if (loading && !settings) {
    return (
      <section data-testid="notification-settings">
        <LoadingState label="Loading notification settings…" />
      </section>
    );
  }

  return (
    <section className="space-y-6" data-testid="notification-settings">
      <PageHeader
        productId="notifications"
        title="Notification settings"
        description="Delivery Layer only. Notification Delivery owns routing and recorded outcomes. Telegram remains transport — this page does not connect, test, or trade."
        extraActions={[
          { to: '/notifications/history', label: 'Delivery history' },
          { to: '/reporting', label: 'Reporting' },
        ]}
      />

      <ErrorBanner message={error} />
      <SuccessBanner message={saved ? 'Preferences saved.' : null} testId="notification-saved" />

      {!settings || !draft ? (
        <p className="text-sm text-slate-500" data-testid="notification-empty">
          No notification settings in this workspace.
        </p>
      ) : (
        <>
          <Panel title="Master enable">
            <Toggle
              testId="notification-master"
              checked={draft.enabled}
              label="Enable notifications"
              onChange={(enabled) => onDraft({ ...draft, enabled })}
            />
          </Panel>

          <Panel title="Channel status">
            <ul className="space-y-2">
              {settings.channels.map((channel) => (
                <li
                  key={channel.channelId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm"
                  data-testid="notification-channel"
                >
                  <span>
                    {channel.label}{' '}
                    <span className="text-slate-500">{channelStatusLabel(channel.status)}</span>
                  </span>
                  {channel.channelId === 'telegram' ? (
                    <Toggle
                      testId="notification-channel-telegram"
                      checked={draft.telegramEnabled}
                      label="Telegram enabled"
                      onChange={(telegramEnabled) => onDraft({ ...draft, telegramEnabled })}
                    />
                  ) : (
                    <span className="text-xs text-slate-500">Not offered</span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Telegram connection: {telegramStatusLabel(settings.telegram.status)}. Connect, test,
              and disconnect are in Notification channels. Chat id is never entered here.
            </p>
          </Panel>

          <Panel title="Quiet hours, timezone, daily delivery">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="text-slate-400">Timezone</span>
                <select
                  value={draft.timezone}
                  data-testid="notification-timezone"
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
                  data-testid="notification-daily-time"
                  onChange={(event) => onDraft({ ...draft, dailyDeliveryTime: event.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-4 space-y-3">
              <Toggle
                testId="notification-quiet-enabled"
                checked={draft.quietHoursEnabled}
                label="Enable quiet hours"
                onChange={(quietHoursEnabled) => onDraft({ ...draft, quietHoursEnabled })}
              />
              {draft.quietHoursEnabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1 text-sm">
                    <span className="text-slate-400">Quiet hours start</span>
                    <input
                      value={draft.quietHoursStart}
                      data-testid="notification-quiet-start"
                      onChange={(event) =>
                        onDraft({ ...draft, quietHoursStart: event.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="text-slate-400">Quiet hours end</span>
                    <input
                      value={draft.quietHoursEnd}
                      data-testid="notification-quiet-end"
                      onChange={(event) => onDraft({ ...draft, quietHoursEnd: event.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                    />
                  </label>
                </div>
              )}
              <Toggle
                testId="notification-critical-bypass"
                checked={draft.criticalBypassQuietHours}
                label="Critical types bypass quiet hours"
                onChange={(criticalBypassQuietHours) =>
                  onDraft({ ...draft, criticalBypassQuietHours })
                }
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Preference clock {settings.scheduleClock.localTimeHHmm}{' '}
              {settings.scheduleClock.timezone}
              {settings.scheduleClock.quietHoursActive ? ' · quiet hours active' : ''}. This is not
              a scheduler and does not retry.
            </p>
          </Panel>

          <Panel title="Per-type enable and routing">
            <ul className="space-y-2">
              {settings.preferences.typeRouting.map((item) => (
                <li
                  key={item.type}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm"
                  data-testid="notification-type"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>{notificationTypeLabel(item.type)}</span>
                    <Toggle
                      testId={`notification-type-${item.type}`}
                      checked={draft.typeEnabled[item.type] === true}
                      label="Enabled"
                      onChange={(enabled) =>
                        onDraft({
                          ...draft,
                          typeEnabled: { ...draft.typeEnabled, [item.type]: enabled },
                        })
                      }
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Routes:{' '}
                    {item.currentRoutes
                      .map((route) =>
                        route.skipReason
                          ? `${route.channelId} (${skipReasonLabel(route.skipReason)})`
                          : route.channelId,
                      )
                      .join(', ') || '—'}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>

          <button
            type="button"
            data-testid="notification-save"
            disabled={saving}
            onClick={onSave}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save preferences'}
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

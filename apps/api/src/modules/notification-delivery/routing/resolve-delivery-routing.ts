/**
 * RC-24 Epic 6 — Delivery routing + quiet-hours evaluation.
 */

import { channelStatus, type NotificationChannelId } from '../domain/notification-channel';
import { isCriticalNotificationType, type NotificationType } from '../domain/notification-type';
import type { DeliverySkipReason, DeliverNotificationCommand } from '../domain/delivery';
import type { UserNotificationPreferences } from '../domain/user-notification-preferences';

export type RoutedChannel = Readonly<{
  channelId: NotificationChannelId;
  skipReason?: DeliverySkipReason;
}>;

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((p) => Number(p));
  return h! * 60 + m!;
}

/**
 * Evaluate whether local clock HH:mm falls inside quiet hours.
 * Supports windows that wrap midnight (e.g. 22:00–07:00).
 */
export function isWithinQuietHours(
  localTimeHHmm: string,
  quietHours: Readonly<{ start: string; end: string }>,
): boolean {
  const now = parseMinutes(localTimeHHmm);
  const start = parseMinutes(quietHours.start);
  const end = parseMinutes(quietHours.end);
  if (start === end) return false;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
}

/**
 * Convert an ISO timestamp to HH:mm in the stored preference timezone.
 * UTC (default) keeps the existing ISO `T` clock / UTC fallback — not a scheduler.
 */
export function extractLocalTimeHHmm(isoTimestamp: string, timezone = 'UTC'): string {
  const date = new Date(isoTimestamp);
  const zone = timezone.trim() || 'UTC';
  if (!Number.isNaN(date.getTime()) && zone !== 'UTC') {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(date);
      const hour = parts.find((part) => part.type === 'hour')?.value;
      const minute = parts.find((part) => part.type === 'minute')?.value;
      if (hour && minute) return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    } catch {
      // Invalid IANA zone — fall through to UTC extraction.
    }
  }
  const match = isoTimestamp.match(/T(\d{2}:\d{2})/);
  if (match) return match[1]!;
  if (Number.isNaN(date.getTime())) return '00:00';
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function resolveCritical(
  type: NotificationType,
  cmdCritical: boolean | undefined,
  typePrefCritical: boolean | undefined,
): boolean {
  if (cmdCritical === true) return true;
  if (typePrefCritical === true) return true;
  return isCriticalNotificationType(type);
}

/**
 * Decide which channels should attempt delivery for a command + preferences.
 * Does not send — routing only.
 */
export function resolveDeliveryRoutes(
  cmd: DeliverNotificationCommand,
  prefs: UserNotificationPreferences,
  options: Readonly<{
    telegramConnected: boolean;
  }>,
): readonly RoutedChannel[] {
  if (!prefs.enabled) {
    return Object.freeze([{ channelId: 'telegram', skipReason: 'notifications-disabled' }]);
  }

  const typePref = prefs.typeRouting[cmd.type];
  if (!typePref?.enabled) {
    return Object.freeze([{ channelId: 'telegram', skipReason: 'type-disabled' }]);
  }

  const critical = resolveCritical(cmd.type, cmd.critical, typePref.critical);
  const quiet = prefs.schedule.quietHours;
  if (
    quiet &&
    !(critical && prefs.schedule.criticalBypassQuietHours) &&
    isWithinQuietHours(extractLocalTimeHHmm(cmd.requestedAt, prefs.schedule.timezone), quiet)
  ) {
    return Object.freeze([{ channelId: 'telegram', skipReason: 'quiet-hours' }]);
  }

  const routes: RoutedChannel[] = [];
  for (const channelId of typePref.channels) {
    if (channelStatus(channelId) === 'reserved-inactive') {
      routes.push({ channelId, skipReason: 'channel-reserved' });
      continue;
    }
    if (!prefs.channels[channelId]) {
      routes.push({ channelId, skipReason: 'channel-disabled' });
      continue;
    }
    if (channelId === 'telegram' && !options.telegramConnected) {
      routes.push({ channelId, skipReason: 'channel-not-connected' });
      continue;
    }
    routes.push({ channelId });
  }

  if (routes.length === 0) {
    return Object.freeze([{ channelId: 'telegram', skipReason: 'no-routes' }]);
  }

  return Object.freeze(routes);
}

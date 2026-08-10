/**
 * RC-24 Epic 6 — User notification preferences + scheduling.
 */

import { NOTIFICATION_CHANNELS, type NotificationChannelId } from './notification-channel';
import {
  defaultEnabledForType,
  NOTIFICATION_TYPES,
  type NotificationType,
} from './notification-type';

export type TypeDeliveryPreference = Readonly<{
  enabled: boolean;
  channels: readonly NotificationChannelId[];
  /** When true, delivery ignores quiet hours for this type. */
  critical?: boolean;
}>;

export type QuietHours = Readonly<{
  start: string; // HH:mm
  end: string; // HH:mm
}>;

export type NotificationSchedulePreferences = Readonly<{
  dailyDeliveryTime: string; // HH:mm
  timezone: string;
  quietHours?: QuietHours;
  /** Global default: critical types bypass quiet hours when true. */
  criticalBypassQuietHours: boolean;
}>;

export type ChannelEnablement = Readonly<Record<NotificationChannelId, boolean>>;

export type UserNotificationPreferences = Readonly<{
  workspaceId: string;
  userId: string;
  /** Master switch. */
  enabled: boolean;
  channels: ChannelEnablement;
  typeRouting: Readonly<Record<NotificationType, TypeDeliveryPreference>>;
  schedule: NotificationSchedulePreferences;
  updatedAt: string;
}>;

export type CreateUserNotificationPreferencesInput = Readonly<{
  workspaceId: string;
  userId: string;
  enabled?: boolean;
  channels?: Partial<ChannelEnablement>;
  typeRouting?: Partial<Record<NotificationType, Partial<TypeDeliveryPreference>>>;
  schedule?: Partial<NotificationSchedulePreferences>;
  updatedAt: string;
}>;

function assertNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${field} is required`);
  return trimmed;
}

function assertTime(value: string, field: string): string {
  const trimmed = assertNonEmpty(value, field);
  if (!/^\d{2}:\d{2}$/.test(trimmed)) {
    throw new Error(`${field} must be HH:mm`);
  }
  return trimmed;
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Object.isFrozen(value)) return value;
  for (const key of Object.keys(value as object)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

function defaultChannels(): ChannelEnablement {
  const channels = {} as Record<NotificationChannelId, boolean>;
  for (const id of NOTIFICATION_CHANNELS) {
    channels[id] = id === 'telegram';
  }
  return Object.freeze(channels) as ChannelEnablement;
}

function defaultTypeRouting(): Record<NotificationType, TypeDeliveryPreference> {
  const routing = {} as Record<NotificationType, TypeDeliveryPreference>;
  for (const type of NOTIFICATION_TYPES) {
    routing[type] = Object.freeze({
      enabled: defaultEnabledForType(type),
      channels: Object.freeze(['telegram'] as const),
    });
  }
  return routing;
}

export function createUserNotificationPreferences(
  input: CreateUserNotificationPreferencesInput,
): UserNotificationPreferences {
  const channels = {
    ...defaultChannels(),
    ...(input.channels ?? {}),
  } as ChannelEnablement;

  const typeRouting = defaultTypeRouting();
  if (input.typeRouting) {
    for (const type of NOTIFICATION_TYPES) {
      const patch = input.typeRouting[type];
      if (!patch) continue;
      typeRouting[type] = Object.freeze({
        enabled: patch.enabled ?? typeRouting[type]!.enabled,
        channels: Object.freeze([
          ...(patch.channels ?? typeRouting[type]!.channels),
        ]) as readonly NotificationChannelId[],
        ...(patch.critical !== undefined ? { critical: patch.critical } : {}),
      });
    }
  }

  const schedule: NotificationSchedulePreferences = Object.freeze({
    dailyDeliveryTime: assertTime(
      input.schedule?.dailyDeliveryTime ?? '09:00',
      'dailyDeliveryTime',
    ),
    timezone: assertNonEmpty(input.schedule?.timezone ?? 'UTC', 'timezone'),
    quietHours: input.schedule?.quietHours
      ? Object.freeze({
          start: assertTime(input.schedule.quietHours.start, 'quietHours.start'),
          end: assertTime(input.schedule.quietHours.end, 'quietHours.end'),
        })
      : undefined,
    criticalBypassQuietHours: input.schedule?.criticalBypassQuietHours ?? true,
  });

  return deepFreeze({
    workspaceId: assertNonEmpty(input.workspaceId, 'workspaceId'),
    userId: assertNonEmpty(input.userId, 'userId'),
    enabled: input.enabled ?? true,
    channels: Object.freeze({ ...channels }) as ChannelEnablement,
    typeRouting: Object.freeze({ ...typeRouting }) as Readonly<
      Record<NotificationType, TypeDeliveryPreference>
    >,
    schedule,
    updatedAt: assertNonEmpty(input.updatedAt, 'updatedAt'),
  });
}

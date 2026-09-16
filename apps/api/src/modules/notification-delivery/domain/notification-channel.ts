/**
 * RC-24 Epic 6 — Notification channel catalog.
 *
 * Telegram, Email, Slack, Discord, and Teams are implemented. Push stays reserved.
 */

export const NOTIFICATION_CHANNELS = Object.freeze([
  'telegram',
  'email',
  'slack',
  'discord',
  'teams',
  'push',
] as const);

export type NotificationChannelId = (typeof NOTIFICATION_CHANNELS)[number];

export const ACTIVE_NOTIFICATION_CHANNELS = Object.freeze([
  'telegram',
  'email',
  'slack',
  'discord',
  'teams',
] as const);

export type ActiveNotificationChannelId = (typeof ACTIVE_NOTIFICATION_CHANNELS)[number];

export const RESERVED_NOTIFICATION_CHANNELS = Object.freeze(['push'] as const);

export type ReservedNotificationChannelId = (typeof RESERVED_NOTIFICATION_CHANNELS)[number];

export type NotificationChannelStatus = 'active' | 'reserved-inactive';

export type NotificationChannelDescriptor = Readonly<{
  channelId: NotificationChannelId;
  status: NotificationChannelStatus;
  label: string;
}>;

export const NOTIFICATION_CHANNEL_CATALOG: readonly NotificationChannelDescriptor[] = Object.freeze(
  [
    Object.freeze({
      channelId: 'telegram',
      status: 'active',
      label: 'Telegram',
    }),
    Object.freeze({
      channelId: 'email',
      status: 'active',
      label: 'Email',
    }),
    Object.freeze({
      channelId: 'slack',
      status: 'active',
      label: 'Slack',
    }),
    Object.freeze({
      channelId: 'discord',
      status: 'active',
      label: 'Discord',
    }),
    Object.freeze({
      channelId: 'teams',
      status: 'active',
      label: 'Microsoft Teams',
    }),
    Object.freeze({
      channelId: 'push',
      status: 'reserved-inactive',
      label: 'Push',
    }),
  ],
);

export function isNotificationChannelId(value: string): value is NotificationChannelId {
  return (NOTIFICATION_CHANNELS as readonly string[]).includes(value);
}

export function isActiveNotificationChannel(value: string): value is ActiveNotificationChannelId {
  return (ACTIVE_NOTIFICATION_CHANNELS as readonly string[]).includes(value);
}

export function channelStatus(channelId: NotificationChannelId): NotificationChannelStatus {
  return isActiveNotificationChannel(channelId) ? 'active' : 'reserved-inactive';
}

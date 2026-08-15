/**
 * PC-15 15-e — consumer projection of Notification → Channel dispatch.
 *
 * Not a Notification owner. Not a channel owner. Not Telegram Bot API.
 * Telegram remains in-memory transport. Deferred channels stay reserved.
 */
import type {
  DeliveryOutcome,
  DeliveryResult,
  DeliverySkipReason,
} from '../notification-delivery/domain/delivery';
import type {
  NotificationChannelDescriptor,
  NotificationChannelId,
} from '../notification-delivery/domain/notification-channel';
import type { NotificationType } from '../notification-delivery/domain/notification-type';
import type { TelegramConnection } from '../notification-delivery/domain/telegram-connection';

export type ReservedChannelProjection = Readonly<{
  channelId: NotificationChannelId;
  status: 'reserved-inactive';
  attempted: boolean;
  skipReason?: DeliverySkipReason;
}>;

export type ChannelDeliveryView = Readonly<{
  deliveryId: string | null;
  workspaceId: string;
  userId: string;
  notificationType: NotificationType | null;
  reportRunId?: string;
  outcome: DeliveryOutcome | 'not-invoked';
  telegramConnectionStatus: TelegramConnection['status'] | null;
  telegramAdapterReached: boolean;
  telegramOutcome: DeliveryOutcome | 'not-attempted';
  telegramSkipReason?: DeliverySkipReason;
  telegramTransport: 'in-memory';
  botApiUsed: false;
  controlPlane: false;
  reservedChannels: readonly ReservedChannelProjection[];
  deferredChannelsActivated: false;
  channelActivated: false;
  forcesTrade: false;
  authorityClass: 'notification-projection';
}>;

export function toChannelDeliveryView(input: {
  workspaceId: string;
  userId: string;
  delivery?: DeliveryResult | null;
  connection?: TelegramConnection | null;
  channels: readonly NotificationChannelDescriptor[];
}): ChannelDeliveryView {
  const attempts = input.delivery?.attempts ?? [];
  const telegramAttempt = attempts.find((attempt) => attempt.channelId === 'telegram');
  const telegramAdapterReached =
    telegramAttempt?.outcome === 'delivered' || telegramAttempt?.outcome === 'failed';
  const reservedChannels = Object.freeze(
    input.channels
      .filter((channel) => channel.status === 'reserved-inactive')
      .map((channel) => {
        const attempt = attempts.find((item) => item.channelId === channel.channelId);
        return Object.freeze({
          channelId: channel.channelId,
          status: 'reserved-inactive' as const,
          attempted: Boolean(attempt),
          ...(attempt?.skipReason ? { skipReason: attempt.skipReason } : {}),
        });
      }),
  );

  return Object.freeze({
    deliveryId: input.delivery?.deliveryId ?? null,
    workspaceId: input.workspaceId,
    userId: input.userId,
    notificationType: input.delivery?.type ?? null,
    ...(input.delivery?.reportRunId ? { reportRunId: input.delivery.reportRunId } : {}),
    outcome: input.delivery?.outcome ?? 'not-invoked',
    telegramConnectionStatus: input.connection?.status ?? null,
    telegramAdapterReached,
    telegramOutcome: telegramAttempt?.outcome ?? 'not-attempted',
    ...(telegramAttempt?.skipReason ? { telegramSkipReason: telegramAttempt.skipReason } : {}),
    telegramTransport: 'in-memory' as const,
    botApiUsed: false as const,
    controlPlane: false as const,
    reservedChannels,
    deferredChannelsActivated: false as const,
    channelActivated: false as const,
    forcesTrade: false as const,
    authorityClass: 'notification-projection' as const,
  });
}

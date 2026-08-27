import { Module } from '@nestjs/common';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { DurableNotificationStore } from './adapters/durable-notification-store';
import { InMemoryNotificationStore } from './adapters/in-memory-notification-store';
import { InMemoryTelegramAdapter } from './adapters/in-memory-telegram.adapter';
import { NotificationDeliveryBoundaryService } from './notification-boundary.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NOTIFICATION_SERVICE_PORT, TELEGRAM_CHANNEL_ADAPTER } from './ports/notification.port';

/**
 * RC-24 Epic 6 — Notification Delivery module.
 *
 * Delivery only through configured channels (Telegram active).
 * W3-O01-b / W3-O02-b: optional durable store snapshot via PERSISTENCE_DRIVER=prisma
 * (history + Notification Durable Queue work items on this owner only).
 * Does not import Reporting / AI Analytics / Strategy Library / Runtime /
 * Trading Session / Orders / Ledger. Does not expose REST or trading commands.
 */
@Module({
  providers: [
    NotificationDeliveryBoundaryService,
    {
      provide: InMemoryNotificationStore,
      useFactory: async () =>
        createRepositoryByDriver({
          createMemory: () => new InMemoryNotificationStore(),
          createPrisma: (client) => new DurableNotificationStore(client),
          owner: 'notification-delivery',
        }),
    },
    InMemoryTelegramAdapter,
    {
      provide: TELEGRAM_CHANNEL_ADAPTER,
      useExisting: InMemoryTelegramAdapter,
    },
    NotificationDeliveryService,
    {
      provide: NOTIFICATION_SERVICE_PORT,
      useExisting: NotificationDeliveryService,
    },
  ],
  exports: [
    NotificationDeliveryBoundaryService,
    NotificationDeliveryService,
    InMemoryTelegramAdapter,
    NOTIFICATION_SERVICE_PORT,
    TELEGRAM_CHANNEL_ADAPTER,
  ],
})
export class NotificationDeliveryModule {}

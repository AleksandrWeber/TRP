import { Module } from '@nestjs/common';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { DurableNotificationStore } from './adapters/durable-notification-store';
import { InMemoryNotificationStore } from './adapters/in-memory-notification-store';
import { InMemoryTelegramAdapter } from './adapters/in-memory-telegram.adapter';
import { TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY } from './domain/telegram-notification-anchor.repository';
import { NotificationDeliveryBoundaryService } from './notification-boundary.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { PrismaTelegramNotificationAnchorRepository } from './persistence/prisma-telegram-notification-anchor.repository';
import { NOTIFICATION_SERVICE_PORT, TELEGRAM_CHANNEL_ADAPTER } from './ports/notification.port';
import { TelegramNotificationPersistenceService } from './telegram-notification-persistence.service';
import { TelegramNotificationRecoveryStore } from './telegram-notification-recovery-store';
import { TelegramNotificationRestartRecoveryService } from './telegram-notification-restart-recovery.service';

/**
 * RC-24 Epic 6 — Notification Delivery module.
 *
 * Delivery only through configured channels (Telegram active).
 * W3-O01-b / W3-O02-b: optional durable store snapshot via PERSISTENCE_DRIVER=prisma
 * (history + Notification Durable Queue work items on this owner only).
 * W5-N01-b: durable Telegram notification anchor persistence on this owner only.
 * W5-N01-c: deterministic restart recovery hydrate for canonical anchors on this owner only.
 * Does not import Reporting / AI Analytics / Strategy Library / Runtime /
 * Trading Session / Orders / Ledger. Does not expose REST or trading commands.
 */
@Module({
  imports: [PrismaModule],
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
    {
      provide: TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaTelegramNotificationAnchorRepository(prisma),
      inject: [PrismaService],
    },
    TelegramNotificationRecoveryStore,
    TelegramNotificationRestartRecoveryService,
    TelegramNotificationPersistenceService,
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
    TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY,
    TelegramNotificationRecoveryStore,
    TelegramNotificationRestartRecoveryService,
    TelegramNotificationPersistenceService,
  ],
})
export class NotificationDeliveryModule {}

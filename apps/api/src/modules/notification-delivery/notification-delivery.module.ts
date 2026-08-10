import { Module } from '@nestjs/common';
import { InMemoryNotificationStore } from './adapters/in-memory-notification-store';
import { InMemoryTelegramAdapter } from './adapters/in-memory-telegram.adapter';
import { NotificationDeliveryBoundaryService } from './notification-boundary.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NOTIFICATION_SERVICE_PORT, TELEGRAM_CHANNEL_ADAPTER } from './ports/notification.port';

/**
 * RC-24 Epic 6 — Notification Delivery module.
 *
 * Delivery only through configured channels (Telegram active).
 * Does not import Reporting / AI Analytics / Strategy Library / Runtime /
 * Trading Session / Orders / Ledger. Does not expose REST or trading commands.
 */
@Module({
  providers: [
    NotificationDeliveryBoundaryService,
    InMemoryNotificationStore,
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

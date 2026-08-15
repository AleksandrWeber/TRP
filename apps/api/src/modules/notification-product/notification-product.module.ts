import { Module } from '@nestjs/common';
import { NotificationDeliveryModule } from '../notification-delivery';
import { WorkspaceModule } from '../workspace';
import {
  NotificationChannelsController,
  NotificationDeliveriesController,
  NotificationPreferencesController,
  NotificationRoutingController,
  NotificationSettingsController,
} from './notification.controller';
import { NotificationProductService } from './notification-product.service';

/**
 * PC-06 — HTTP product adapter for existing Notification Delivery queries
 * and preference operations.
 *
 * Does not own deliveries. Does not redesign Telegram. Does not activate
 * reserved channels. Domain `rest: false` is unchanged.
 */
@Module({
  imports: [NotificationDeliveryModule, WorkspaceModule],
  controllers: [
    NotificationSettingsController,
    NotificationPreferencesController,
    NotificationChannelsController,
    NotificationRoutingController,
    NotificationDeliveriesController,
  ],
  providers: [NotificationProductService],
})
export class NotificationProductModule {}

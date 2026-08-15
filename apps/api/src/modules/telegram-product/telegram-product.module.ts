import { Module } from '@nestjs/common';
import { NotificationDeliveryModule } from '../notification-delivery';
import { WorkspaceModule } from '../workspace';
import { TelegramController } from './telegram.controller';
import { TelegramProductService } from './telegram-product.service';

/**
 * PC-07 — HTTP product adapter for existing Telegram connection operations.
 *
 * Does not own deliveries. Does not redesign Notification Delivery.
 * Does not redesign the Telegram adapter. Does not introduce Bot API.
 * Domain `rest: false` is unchanged.
 */
@Module({
  imports: [NotificationDeliveryModule, WorkspaceModule],
  controllers: [TelegramController],
  providers: [TelegramProductService],
})
export class TelegramProductModule {}

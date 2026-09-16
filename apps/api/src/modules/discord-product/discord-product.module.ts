import { Module } from '@nestjs/common';
import { NotificationDeliveryModule } from '../notification-delivery';
import { WorkspaceModule } from '../workspace';
import { DiscordController } from './discord.controller';
import { DiscordProductService } from './discord-product.service';

/**
 * PC-07 — HTTP product adapter for existing Discord connection operations.
 *
 * Does not own deliveries. Does not redesign Notification Delivery.
 * Does not collect webhook URLs. Domain `rest: false` is unchanged.
 */
@Module({
  imports: [NotificationDeliveryModule, WorkspaceModule],
  controllers: [DiscordController],
  providers: [DiscordProductService],
})
export class DiscordProductModule {}

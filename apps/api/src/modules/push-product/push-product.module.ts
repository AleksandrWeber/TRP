import { Module } from '@nestjs/common';
import { NotificationDeliveryModule } from '../notification-delivery';
import { WorkspaceModule } from '../workspace';
import { PushController } from './push.controller';
import { PushProductService } from './push-product.service';

/**
 * PC-07 — HTTP product adapter for existing Push connection operations.
 *
 * Does not own deliveries. Does not redesign Notification Delivery.
 * Does not collect VAPID private keys. Domain `rest: false` is unchanged.
 */
@Module({
  imports: [NotificationDeliveryModule, WorkspaceModule],
  controllers: [PushController],
  providers: [PushProductService],
})
export class PushProductModule {}

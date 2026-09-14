import { Module } from '@nestjs/common';
import { NotificationDeliveryModule } from '../notification-delivery';
import { WorkspaceModule } from '../workspace';
import { EmailController } from './email.controller';
import { EmailProductService } from './email-product.service';

/**
 * PC-07 — HTTP product adapter for existing Email connection operations.
 *
 * Does not own deliveries. Does not redesign Notification Delivery.
 * Does not collect SMTP passwords. Domain `rest: false` is unchanged.
 */
@Module({
  imports: [NotificationDeliveryModule, WorkspaceModule],
  controllers: [EmailController],
  providers: [EmailProductService],
})
export class EmailProductModule {}

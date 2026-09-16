import { Module } from '@nestjs/common';
import { NotificationDeliveryModule } from '../notification-delivery';
import { WorkspaceModule } from '../workspace';
import { TeamsController } from './teams.controller';
import { TeamsProductService } from './teams-product.service';

/**
 * PC-07 — HTTP product adapter for existing Teams connection operations.
 *
 * Does not own deliveries. Does not redesign Notification Delivery.
 * Does not collect webhook URLs. Domain `rest: false` is unchanged.
 */
@Module({
  imports: [NotificationDeliveryModule, WorkspaceModule],
  controllers: [TeamsController],
  providers: [TeamsProductService],
})
export class TeamsProductModule {}

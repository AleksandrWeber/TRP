import { Module } from '@nestjs/common';
import { NotificationDeliveryModule } from '../notification-delivery';
import { WorkspaceModule } from '../workspace';
import { SlackController } from './slack.controller';
import { SlackProductService } from './slack-product.service';

/**
 * PC-07 — HTTP product adapter for existing Slack connection operations.
 *
 * Does not own deliveries. Does not redesign Notification Delivery.
 * Does not collect webhook URLs. Domain `rest: false` is unchanged.
 */
@Module({
  imports: [NotificationDeliveryModule, WorkspaceModule],
  controllers: [SlackController],
  providers: [SlackProductService],
})
export class SlackProductModule {}

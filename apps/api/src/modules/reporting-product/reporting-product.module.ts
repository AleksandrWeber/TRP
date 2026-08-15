import { Module } from '@nestjs/common';
import { NotificationDeliveryModule } from '../notification-delivery';
import { ProductFlowModule } from '../product-flow';
import { ReportingModule } from '../reporting';
import { WorkspaceModule } from '../workspace';
import { ReportingDefinitionController, ReportingRunController } from './reporting.controller';
import { ReportingProductService } from './reporting-product.service';

/**
 * PC-05 — HTTP product adapter for existing Reporting queries.
 *
 * Does not own ReportRuns. Does not redesign AI or Notification.
 * Distinct from research `/v1/reports`.
 */
@Module({
  imports: [ReportingModule, ProductFlowModule, NotificationDeliveryModule, WorkspaceModule],
  controllers: [ReportingRunController, ReportingDefinitionController],
  providers: [ReportingProductService],
})
export class ReportingProductModule {}

import { Module } from '@nestjs/common';
import { AiAnalyticsModule } from '../ai-analytics';
import { MarketQualificationModule } from '../market-qualification';
import { MarketProfileModule } from '../market-profile';
import { NotificationDeliveryModule } from '../notification-delivery';
import { ReportingModule } from '../reporting';
import { StrategyRuntimeModule } from '../strategy-runtime';
import { TradingOrchestratorModule } from '../trading-orchestrator';
import { TradingSessionModule } from '../trading-session';
import { QualificationProfilePublisherService } from './qualification-profile-publisher.service';
import { ReportNarrativeConsumerService } from './report-narrative-consumer.service';
import { ReportNotificationConsumerService } from './report-notification-consumer.service';
import { NotificationChannelDispatchService } from './notification-channel-dispatch.service';
import { OperatorProjectionService } from './operator-projection.service';
import { SessionHandoffConsumerService } from './session-handoff-consumer.service';

/**
 * PC-15 — product-flow composition. Not a bounded context. Not a Source of Truth.
 *
 * 15-a: Orchestrator query → Session create.
 * 15-b: Qualification complete → Profile publishProfileVersion.
 * 15-c: Reporting complete → AI generateNarrative.
 * 15-d: Reporting complete → Notification deliver().
 * 15-e: Notification deliver → existing channel adapters (in-memory Telegram).
 * 15-f: Existing owner reads → Dashboard / Command Center projections.
 */
@Module({
  imports: [
    TradingOrchestratorModule,
    TradingSessionModule,
    StrategyRuntimeModule,
    MarketQualificationModule,
    MarketProfileModule,
    ReportingModule,
    AiAnalyticsModule,
    NotificationDeliveryModule,
  ],
  providers: [
    SessionHandoffConsumerService,
    QualificationProfilePublisherService,
    ReportNarrativeConsumerService,
    ReportNotificationConsumerService,
    NotificationChannelDispatchService,
    OperatorProjectionService,
  ],
  exports: [
    SessionHandoffConsumerService,
    QualificationProfilePublisherService,
    ReportNarrativeConsumerService,
    ReportNotificationConsumerService,
    NotificationChannelDispatchService,
    OperatorProjectionService,
  ],
})
export class ProductFlowModule {}

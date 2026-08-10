import { Module } from '@nestjs/common';
import { ReportingModule, REPORTING_QUERY_PORT } from '../reporting';
import { AiAnalyticsBoundaryService } from './ai-analytics-boundary.service';
import { AiAnalyticsService } from './ai-analytics.service';
import { AI_ANALYTICS_PORT, REPORTING_QUERY_CONSUMER } from './ports/ai-analytics.port';

/**
 * RC-24 — AI Analytics module.
 *
 * Epic 1: boundary reservation.
 * Epic 3: AnalyticalNarrative domain artifact.
 * Epic 5: deterministic narratives over Reporting query ports only.
 *
 * Does not import Knowledge Lake, Session, Library, Enforcement, Orders, or Ledger.
 * Does not expose REST / persistence / UI.
 */
@Module({
  imports: [ReportingModule],
  providers: [
    AiAnalyticsBoundaryService,
    AiAnalyticsService,
    {
      provide: REPORTING_QUERY_CONSUMER,
      useFactory: (port: unknown) => port,
      inject: [REPORTING_QUERY_PORT],
    },
    {
      provide: AI_ANALYTICS_PORT,
      useExisting: AiAnalyticsService,
    },
  ],
  exports: [AiAnalyticsBoundaryService, AiAnalyticsService, AI_ANALYTICS_PORT],
})
export class AiAnalyticsModule {}

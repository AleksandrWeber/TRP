import { Module } from '@nestjs/common';
import { AiAnalyticsModule } from '../ai-analytics';
import { KnowledgeLakeModule } from '../knowledge-lake';
import { ReportingModule } from '../reporting';
import { StrategyLibraryModule } from '../strategy-library';
import { WorkspaceModule } from '../workspace';
import { AiAnalyticsProductController } from './ai-analytics.controller';
import { AiAnalyticsProductService } from './ai-analytics-product.service';

/**
 * PC-17 — HTTP product adapter for existing AI Analytics generation.
 *
 * Does not own facts, reports, knowledge, strategies, or market state.
 * Distinct from research `/v1/ai/execute`. Domain rest: false is unchanged.
 */
@Module({
  imports: [
    AiAnalyticsModule,
    ReportingModule,
    KnowledgeLakeModule,
    StrategyLibraryModule,
    WorkspaceModule,
  ],
  controllers: [AiAnalyticsProductController],
  providers: [AiAnalyticsProductService],
})
export class AiAnalyticsProductModule {}

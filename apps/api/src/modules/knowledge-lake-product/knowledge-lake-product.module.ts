import { Module } from '@nestjs/common';
import { KnowledgeLakeModule } from '../knowledge-lake';
import { ReportingModule } from '../reporting';
import { StrategyLibraryModule } from '../strategy-library';
import { WorkspaceModule } from '../workspace';
import { KnowledgeLakeProductController } from './knowledge-lake.controller';
import { KnowledgeLakeProductService } from './knowledge-lake-product.service';

/**
 * PC-16 — HTTP product adapter for existing Knowledge Lake queries.
 *
 * Does not own stored knowledge. Does not redesign Reporting, AI, or Research.
 * Distinct from research `/v1/knowledge`.
 */
@Module({
  imports: [KnowledgeLakeModule, ReportingModule, StrategyLibraryModule, WorkspaceModule],
  controllers: [KnowledgeLakeProductController],
  providers: [KnowledgeLakeProductService],
})
export class KnowledgeLakeProductModule {}

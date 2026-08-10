import { Module } from '@nestjs/common';
import { EventProcessingModule } from '../event-processing';
import { InMemoryKnowledgeLakeIngestionAdapter } from './ingestion/in-memory-knowledge-lake-ingestion.adapter';
import { KnowledgeLakeBoundaryService } from './knowledge-lake-boundary.service';
import { KnowledgeLakeResearchLabProjectionService } from './projections/knowledge-lake-research-lab-projection.service';
import { KnowledgeLakeTradingPathOutboxConsumer } from './projections/knowledge-lake-trading-path-outbox.consumer';
import {
  CampaignCompletedLakeProjectionAdapter,
  EvidenceGeneratedLakeProjectionAdapter,
  ExperimentCompletedLakeProjectionAdapter,
  ValidationCompletedLakeProjectionAdapter,
} from './projections/research-lab-projection.adapters';
import {
  ExecutionFillLakeProjectionAdapter,
  OrdersLakeProjectionAdapter,
  PaperTradingLakeProjectionAdapter,
  RiskLakeProjectionAdapter,
  TradingSessionLakeProjectionAdapter,
} from './projections/trading-path-projection.adapters';
import { KNOWLEDGE_LAKE_INGESTION_PORT } from './ports/knowledge-lake-ingestion.port';
import { KNOWLEDGE_LAKE_QUERY_PORT } from './ports/knowledge-lake-query.port';

/**
 * RC-21 Knowledge Lake Nest module.
 *
 * Epic 1: projection-warehouse boundary.
 * Epic 2: ingestion port (append-only admission) via in-memory adapter.
 * Epic 3: trading-path outbox projections (one-way; SoT modules untouched).
 * Epic 4: Research Lab outcome projections (one-way; Research modules untouched).
 * Epic 5: query port (consumer-safe analytical reads) — no Reporting / AI UI.
 * Epic 6: authority conformance (no new ports / features).
 *
 * Does not expose durable persistence product, Reporting UI, or AI.
 * Distinct from {@link KnowledgeModule} (research knowledge domain).
 */
@Module({
  imports: [EventProcessingModule],
  providers: [
    KnowledgeLakeBoundaryService,
    InMemoryKnowledgeLakeIngestionAdapter,
    {
      provide: KNOWLEDGE_LAKE_INGESTION_PORT,
      useExisting: InMemoryKnowledgeLakeIngestionAdapter,
    },
    {
      provide: KNOWLEDGE_LAKE_QUERY_PORT,
      useExisting: InMemoryKnowledgeLakeIngestionAdapter,
    },
    TradingSessionLakeProjectionAdapter,
    OrdersLakeProjectionAdapter,
    RiskLakeProjectionAdapter,
    PaperTradingLakeProjectionAdapter,
    ExecutionFillLakeProjectionAdapter,
    KnowledgeLakeTradingPathOutboxConsumer,
    CampaignCompletedLakeProjectionAdapter,
    ExperimentCompletedLakeProjectionAdapter,
    ValidationCompletedLakeProjectionAdapter,
    EvidenceGeneratedLakeProjectionAdapter,
    KnowledgeLakeResearchLabProjectionService,
  ],
  exports: [
    KnowledgeLakeBoundaryService,
    KNOWLEDGE_LAKE_INGESTION_PORT,
    KNOWLEDGE_LAKE_QUERY_PORT,
    InMemoryKnowledgeLakeIngestionAdapter,
    KnowledgeLakeResearchLabProjectionService,
  ],
})
export class KnowledgeLakeModule {}

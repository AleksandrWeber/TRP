import { Module } from '@nestjs/common';
import { KnowledgeLakeModule, KNOWLEDGE_LAKE_QUERY_PORT } from '../knowledge-lake';
import { InMemoryReportingStore } from './adapters/in-memory-reporting-store';
import {
  KNOWLEDGE_LAKE_QUERY_CONSUMER,
  REPORTING_QUERY_PORT,
  REPORTING_SERVICE_PORT,
} from './ports/reporting.port';
import { ReportingBoundaryService } from './reporting-boundary.service';
import { ReportingGenerationService } from './reporting-generation.service';
import { ReportingKnowledgeLakeReadService } from './reporting-knowledge-lake-read.service';
import { ReportingQueryService } from './reporting-query.service';

/**
 * RC-24 — Reporting module.
 *
 * Epic 1: boundary + ownership invariants.
 * Epic 2: Knowledge Lake Query Port consumption (read-only).
 * Epic 3: immutable domain model.
 * Epic 4: deterministic report generation + query ports.
 *
 * Does not expose persistence product, REST, UI, AI, or scheduled jobs.
 *
 * Dependency direction: Reporting consumes Lake reads;
 * Knowledge Lake must never depend on Reporting.
 */
@Module({
  imports: [KnowledgeLakeModule],
  providers: [
    ReportingBoundaryService,
    ReportingKnowledgeLakeReadService,
    InMemoryReportingStore,
    ReportingGenerationService,
    ReportingQueryService,
    {
      provide: KNOWLEDGE_LAKE_QUERY_CONSUMER,
      useFactory: (port: unknown) => port,
      inject: [KNOWLEDGE_LAKE_QUERY_PORT],
    },
    {
      provide: REPORTING_SERVICE_PORT,
      useExisting: ReportingGenerationService,
    },
    {
      provide: REPORTING_QUERY_PORT,
      useExisting: ReportingQueryService,
    },
  ],
  exports: [
    ReportingBoundaryService,
    ReportingKnowledgeLakeReadService,
    ReportingGenerationService,
    ReportingQueryService,
    REPORTING_SERVICE_PORT,
    REPORTING_QUERY_PORT,
  ],
})
export class ReportingModule {}

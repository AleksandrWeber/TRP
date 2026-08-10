import { Inject, Injectable } from '@nestjs/common';
import type { DurableEventEnvelope } from '../../event-processing';
import { bestEffortAdmit } from './best-effort-admit';
import { projectTradingPathEnvelope } from './project-trading-path-envelope';
import {
  KNOWLEDGE_LAKE_INGESTION_PORT,
  type KnowledgeLakeIngestionPort,
} from '../ports/knowledge-lake-ingestion.port';

/**
 * Thin projection adapter: Trading Session outbox → Lake.
 * Does not call Session command ports. Does not invent events.
 */
@Injectable()
export class TradingSessionLakeProjectionAdapter {
  constructor(
    @Inject(KNOWLEDGE_LAKE_INGESTION_PORT)
    private readonly ingestion: KnowledgeLakeIngestionPort,
  ) {}

  project(event: DurableEventEnvelope): boolean {
    if (event.aggregateType !== 'TradingSession') return false;
    const fact = projectTradingPathEnvelope(event);
    if (!fact || fact.producer !== 'trading-session') return false;
    bestEffortAdmit(this.ingestion, fact);
    return true;
  }
}

/** Thin projection adapter: Orders outbox → Lake. */
@Injectable()
export class OrdersLakeProjectionAdapter {
  constructor(
    @Inject(KNOWLEDGE_LAKE_INGESTION_PORT)
    private readonly ingestion: KnowledgeLakeIngestionPort,
  ) {}

  project(event: DurableEventEnvelope): boolean {
    if (event.aggregateType !== 'Order') return false;
    const fact = projectTradingPathEnvelope(event);
    if (!fact || fact.producer !== 'orders') return false;
    bestEffortAdmit(this.ingestion, fact);
    return true;
  }
}

/** Thin projection adapter: RiskDecision outbox → Lake. */
@Injectable()
export class RiskLakeProjectionAdapter {
  constructor(
    @Inject(KNOWLEDGE_LAKE_INGESTION_PORT)
    private readonly ingestion: KnowledgeLakeIngestionPort,
  ) {}

  project(event: DurableEventEnvelope): boolean {
    if (event.aggregateType !== 'RiskDecision') return false;
    const fact = projectTradingPathEnvelope(event);
    if (!fact || fact.producer !== 'risk-engine') return false;
    bestEffortAdmit(this.ingestion, fact);
    return true;
  }
}

/** Thin projection adapter: PaperAccount outbox → Lake. */
@Injectable()
export class PaperTradingLakeProjectionAdapter {
  constructor(
    @Inject(KNOWLEDGE_LAKE_INGESTION_PORT)
    private readonly ingestion: KnowledgeLakeIngestionPort,
  ) {}

  project(event: DurableEventEnvelope): boolean {
    if (event.aggregateType !== 'PaperAccount') return false;
    const fact = projectTradingPathEnvelope(event);
    if (!fact || fact.producer !== 'paper-trading') return false;
    bestEffortAdmit(this.ingestion, fact);
    return true;
  }
}

/** Thin projection adapter: Fill / OrderFillRecorded outbox → Lake. */
@Injectable()
export class ExecutionFillLakeProjectionAdapter {
  constructor(
    @Inject(KNOWLEDGE_LAKE_INGESTION_PORT)
    private readonly ingestion: KnowledgeLakeIngestionPort,
  ) {}

  project(event: DurableEventEnvelope): boolean {
    if (event.aggregateType !== 'Fill') return false;
    const fact = projectTradingPathEnvelope(event);
    if (!fact || fact.producer !== 'execution-engine') return false;
    bestEffortAdmit(this.ingestion, fact);
    return true;
  }
}

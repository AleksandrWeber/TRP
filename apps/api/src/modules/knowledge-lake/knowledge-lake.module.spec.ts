import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { OutboxDispatcher } from '../event-processing';
import { KnowledgeLakeBoundaryService } from './knowledge-lake-boundary.service';
import { KnowledgeLakeModule } from './knowledge-lake.module';
import { KNOWLEDGE_LAKE_BOUNDARY } from './domain/knowledge-lake-boundary';
import {
  KNOWLEDGE_LAKE_INGESTION_PORT,
  type KnowledgeLakeIngestionPort,
} from './ports/knowledge-lake-ingestion.port';
import {
  KNOWLEDGE_LAKE_QUERY_PORT,
  type KnowledgeLakeQueryPort,
} from './ports/knowledge-lake-query.port';
import { KnowledgeLakeResearchLabProjectionService } from './projections/knowledge-lake-research-lab-projection.service';
import { KnowledgeLakeTradingPathOutboxConsumer } from './projections/knowledge-lake-trading-path-outbox.consumer';

describe('RC-21 KnowledgeLakeModule', () => {
  it('registers ingestion + query + producers without persistence product', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [KnowledgeLakeModule],
    })
      .overrideProvider(OutboxDispatcher)
      .useValue({
        register: () => undefined,
        stop: async () => undefined,
        start: () => undefined,
      })
      .compile();

    const boundary = moduleRef.get(KnowledgeLakeBoundaryService);
    expect(boundary.getBoundary()).toBe(KNOWLEDGE_LAKE_BOUNDARY);
    expect(boundary.ownsBusinessState()).toBe(false);
    expect(boundary.getBoundary().activePorts.ingestion).toBe(true);
    expect(boundary.getBoundary().activePorts.producers).toBe(true);
    expect(boundary.getBoundary().activePorts.query).toBe(true);
    expect(boundary.getBoundary().activePorts.persistence).toBe(true);

    const ingestion = moduleRef.get<KnowledgeLakeIngestionPort>(KNOWLEDGE_LAKE_INGESTION_PORT);
    const query = moduleRef.get<KnowledgeLakeQueryPort>(KNOWLEDGE_LAKE_QUERY_PORT);
    expect(typeof ingestion.admit).toBe('function');
    expect(typeof query.list).toBe('function');
    expect(typeof query.getByEventId).toBe('function');
    expect(query).not.toHaveProperty('update');
    expect(query).not.toHaveProperty('delete');
    expect(moduleRef.get(KnowledgeLakeTradingPathOutboxConsumer)).toBeDefined();
    expect(moduleRef.get(KnowledgeLakeResearchLabProjectionService)).toBeDefined();

    await moduleRef.close();
  });
});

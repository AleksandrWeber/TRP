import { Test } from '@nestjs/testing';
import { describe, expect, it, vi } from 'vitest';
import { OutboxDispatcher } from '../event-processing';
import { InMemoryKnowledgeLakeIngestionAdapter } from './ingestion/in-memory-knowledge-lake-ingestion.adapter';
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

const DRIVER_KEYS = [
  'PERSISTENCE_DRIVER',
  'RESEARCH_PERSISTENCE_DRIVER',
  'W3_PERSISTENCE_DRIVER',
] as const;

describe('RC-21 KnowledgeLakeModule', () => {
  it('registers ingestion + query + producers without persistence product', async () => {
    const { PrismaClient } = await import('@prisma/client');
    const connect = vi.spyOn(PrismaClient.prototype, '$connect').mockImplementation(async () => {
      throw new Error('Knowledge Lake module spec must not open a database connection');
    });
    const previous = Object.fromEntries(DRIVER_KEYS.map((key) => [key, process.env[key]]));
    delete process.env.PERSISTENCE_DRIVER;
    process.env.RESEARCH_PERSISTENCE_DRIVER = 'prisma';
    process.env.W3_PERSISTENCE_DRIVER = 'memory';
    try {
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

      const lake = moduleRef.get(InMemoryKnowledgeLakeIngestionAdapter);
      expect(lake.constructor).toBe(InMemoryKnowledgeLakeIngestionAdapter);
      const ingestion = moduleRef.get<KnowledgeLakeIngestionPort>(KNOWLEDGE_LAKE_INGESTION_PORT);
      const query = moduleRef.get<KnowledgeLakeQueryPort>(KNOWLEDGE_LAKE_QUERY_PORT);
      expect(ingestion).toBe(lake);
      expect(query).toBe(lake);
      expect(typeof ingestion.admit).toBe('function');
      expect(typeof query.list).toBe('function');
      expect(typeof query.getByEventId).toBe('function');
      const missing = query.getByEventId('missing-event');
      expect(missing).toBeNull();
      expect(missing).not.toBeInstanceOf(Promise);
      expect(query).not.toHaveProperty('update');
      expect(query).not.toHaveProperty('delete');
      expect(moduleRef.get(KnowledgeLakeTradingPathOutboxConsumer)).toBeDefined();
      expect(moduleRef.get(KnowledgeLakeResearchLabProjectionService)).toBeDefined();
      expect(connect).not.toHaveBeenCalled();

      await moduleRef.close();
    } finally {
      connect.mockRestore();
      for (const key of DRIVER_KEYS) {
        const prior = previous[key];
        if (prior === undefined) delete process.env[key];
        else process.env[key] = prior;
      }
    }
  });
});

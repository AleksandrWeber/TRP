import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { KnowledgeService } from './knowledge.service';
import { buildConfigIdentityKey, buildDedupeKey } from './knowledge.helpers';
import {
  KNOWLEDGE_SCHEMA_VERSION,
  RESEARCH_ENGINE_VERSION,
  VALIDATION_VERSION,
} from './knowledge.version';

describe('Knowledge version consistency', () => {
  const originalResearchEngineVersion = process.env.RESEARCH_ENGINE_VERSION;
  const originalValidationVersion = process.env.VALIDATION_VERSION;

  beforeEach(() => {
    delete process.env.RESEARCH_ENGINE_VERSION;
    delete process.env.VALIDATION_VERSION;
  });

  afterEach(() => {
    if (originalResearchEngineVersion !== undefined) {
      process.env.RESEARCH_ENGINE_VERSION = originalResearchEngineVersion;
    } else {
      delete process.env.RESEARCH_ENGINE_VERSION;
    }

    if (originalValidationVersion !== undefined) {
      process.env.VALIDATION_VERSION = originalValidationVersion;
    } else {
      delete process.env.VALIDATION_VERSION;
    }
  });

  it('Knowledge payload uses the same versions from the single version source', async () => {
    const prisma = {
      experiment: {
        findUnique: vi.fn(),
      },
      knowledgeEntry: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
    } as any;

    const events = {
      publish: vi.fn(),
    } as any;

    prisma.knowledgeEntry.findFirst.mockResolvedValue(null);
    prisma.knowledgeEntry.findMany.mockResolvedValue([]);

    const fakeExperiment = {
      id: 'exp1',
      datasetId: 'ds1',
      strategyId: 'ema-crossover',
      configHash: 'hash1',
      verdict: 'fail',
      report: { params: { emaFast: 20, emaSlow: 50 } },
      metrics: { expectancy: -1, profitFactor: 0.5, tradeCount: 5 },
      validation: { verdict: 'fail', reasons: ['Non-positive expectancy'], checks: [] },
      createdAt: new Date('2026-07-16T08:00:00.000Z'),
      gitCommit: 'g123',
      dataset: {
        symbol: 'BTCUSDT',
        timeframe: '1h',
        barCount: 1000,
        contentHash: 'content-h',
      },
    };

    prisma.experiment.findUnique.mockResolvedValue(fakeExperiment);

    let createdPayload: any = null;
    prisma.knowledgeEntry.create.mockImplementation(async ({ data }: any) => {
      createdPayload = data.payload;
      return { id: 'k1', payload: data.payload };
    });

    const service = new KnowledgeService(prisma, events);
    await service.recordFromExperiment('exp1', 'wf1');

    expect(createdPayload).not.toBeNull();

    expect(createdPayload.researchEngineVersion).toBe(RESEARCH_ENGINE_VERSION);
    expect(createdPayload.validationVersion).toBe(VALIDATION_VERSION);
    expect(createdPayload.knowledgeSchemaVersion).toBe(KNOWLEDGE_SCHEMA_VERSION);
    expect(createdPayload.provenance.gitCommit).toBe(fakeExperiment.gitCommit);

    const expectedConfigIdentityKey = buildConfigIdentityKey(
      fakeExperiment.strategyId,
      fakeExperiment.datasetId,
      fakeExperiment.configHash,
    );

    expect(createdPayload.configIdentityKey).toBe(expectedConfigIdentityKey);

    const expectedDedupeKey = buildDedupeKey(
      fakeExperiment.strategyId,
      fakeExperiment.datasetId,
      fakeExperiment.configHash,
      RESEARCH_ENGINE_VERSION,
      VALIDATION_VERSION,
    );

    expect(createdPayload.dedupeKey).toBe(expectedDedupeKey);
    expect(createdPayload.resultIdentityKey).toBe(expectedDedupeKey);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KnowledgeService } from './knowledge.service';
import { buildConfigIdentityKey, buildDedupeKey } from './knowledge.helpers';

type KnowledgeRow = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  validationStatus?: string;
};

function makeExperiment() {
  return {
    id: 'exp-1',
    datasetId: 'ds-1',
    strategyId: 'ema-crossover',
    configHash: 'cfg-1',
    verdict: 'fail',
    report: { params: { emaFast: 20, emaSlow: 50 } },
    metrics: { expectancy: -1, profitFactor: 0.5, tradeCount: 5 },
    validation: { verdict: 'fail', reasons: ['Non-positive expectancy'], checks: [] },
    createdAt: new Date('2026-07-16T08:00:00.000Z'),
    gitCommit: 'git-123',
    dataset: {
      symbol: 'BTCUSDT',
      timeframe: '1h',
      barCount: 1000,
      contentHash: 'content-hash',
    },
  };
}

function makeHarness() {
  const knowledgeRows: KnowledgeRow[] = [];
  const experiment = makeExperiment();
  let idCounter = 1;

  const prisma = {
    experiment: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id === experiment.id) return experiment;
        return null;
      }),
      findMany: vi.fn(),
    },
    knowledgeEntry: {
      create: vi.fn(async ({ data }: any) => {
        const row: KnowledgeRow = {
          id: `k-${idCounter++}`,
          type: data.type,
          payload: data.payload,
          createdAt: new Date(Date.now() + idCounter),
          validationStatus: data.validationStatus,
        };
        knowledgeRows.push(row);
        return row;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        return knowledgeRows.find((row) => row.id === where.id) ?? null;
      }),
      findFirst: vi.fn(async ({ where, orderBy }: any) => {
        let rows = knowledgeRows.filter((row) => row.type === where.type);

        if (where?.payload?.path?.[0] === 'dedupeKey') {
          rows = rows.filter((row) => row.payload.dedupeKey === where.payload.equals);
        }

        if (where?.payload?.path?.[0] === 'configIdentityKey') {
          rows = rows.filter((row) => row.payload.configIdentityKey === where.payload.equals);
        }

        rows.sort((a, b) =>
          orderBy?.createdAt === 'desc'
            ? b.createdAt.getTime() - a.createdAt.getTime()
            : a.createdAt.getTime() - b.createdAt.getTime(),
        );

        return rows[0] ?? null;
      }),
      findMany: vi.fn(async ({ where, orderBy, select }: any) => {
        let rows = knowledgeRows.filter((row) => row.type === where?.type);

        if (where?.payload?.path?.[0] === 'dedupeKey') {
          rows = rows.filter((row) => row.payload.dedupeKey === where.payload.equals);
        }

        if (where?.payload?.path?.[0] === 'supersedesKnowledgeId') {
          rows = rows.filter((row) => row.payload.supersedesKnowledgeId === where.payload.equals);
        }

        rows.sort((a, b) =>
          orderBy?.createdAt === 'desc'
            ? b.createdAt.getTime() - a.createdAt.getTime()
            : a.createdAt.getTime() - b.createdAt.getTime(),
        );

        if (select) {
          return rows.map((row) => ({ id: row.id, createdAt: row.createdAt }));
        }

        return rows;
      }),
    },
  } as any;

  const events = {
    publish: vi.fn(async () => undefined),
  } as any;

  return { prisma, events, knowledgeRows, experiment };
}

describe('KnowledgeService integration-style behavior', () => {
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

  it('creates one new research_outcome from an experiment', async () => {
    const { prisma, events, knowledgeRows } = makeHarness();
    const service = new KnowledgeService(prisma, events);

    const result = await service.recordFromExperiment('exp-1', 'wf-1');

    expect(result.status).toBe('created');
    expect(knowledgeRows).toHaveLength(1);
    expect(knowledgeRows[0].type).toBe('research_outcome');
    expect(prisma.knowledgeEntry.create).toHaveBeenCalledTimes(1);
  });

  it('returns duplicate and does not create a second record for the same resultIdentityKey', async () => {
    const { prisma, events, knowledgeRows, experiment } = makeHarness();
    const service = new KnowledgeService(prisma, events);

    process.env.RESEARCH_ENGINE_VERSION = '1.0.3';
    process.env.VALIDATION_VERSION = '1.0.2';

    const dedupeKey = buildDedupeKey(
      experiment.strategyId,
      experiment.datasetId,
      experiment.configHash,
      '1.0.3',
      '1.0.2',
    );

    knowledgeRows.push({
      id: 'k-existing',
      type: 'research_outcome',
      payload: {
        dedupeKey,
        configIdentityKey: buildConfigIdentityKey(
          experiment.strategyId,
          experiment.datasetId,
          experiment.configHash,
        ),
        resultIdentityKey: dedupeKey,
        researchEngineVersion: '1.0.3',
        validationVersion: '1.0.2',
      },
      createdAt: new Date('2026-07-16T09:00:00.000Z'),
      validationStatus: 'fail',
    });

    const result = await service.recordFromExperiment('exp-1', 'wf-1');

    expect(result).toEqual({ status: 'duplicate', existingId: 'k-existing' });
    expect(prisma.knowledgeEntry.create).not.toHaveBeenCalled();
    expect(knowledgeRows).toHaveLength(1);
  });

  it('creates a new record with same configIdentityKey but new resultIdentityKey when engine version changes', async () => {
    const { prisma, events, knowledgeRows, experiment } = makeHarness();
    const service = new KnowledgeService(prisma, events);

    const configIdentityKey = buildConfigIdentityKey(
      experiment.strategyId,
      experiment.datasetId,
      experiment.configHash,
    );
    const oldResultIdentityKey = buildDedupeKey(
      experiment.strategyId,
      experiment.datasetId,
      experiment.configHash,
      '1.0.2',
      '1.0.2',
    );

    knowledgeRows.push({
      id: 'k-old',
      type: 'research_outcome',
      payload: {
        dedupeKey: oldResultIdentityKey,
        configIdentityKey,
        resultIdentityKey: oldResultIdentityKey,
        researchEngineVersion: '1.0.2',
        validationVersion: '1.0.2',
      },
      createdAt: new Date('2026-07-16T09:00:00.000Z'),
      validationStatus: 'fail',
    });

    process.env.RESEARCH_ENGINE_VERSION = '1.0.3';
    process.env.VALIDATION_VERSION = '1.0.2';

    const result = await service.recordFromExperiment('exp-1', 'wf-1');

    expect(result.status).toBe('created');
    expect(knowledgeRows).toHaveLength(2);
    expect(knowledgeRows[1].payload.configIdentityKey).toBe(configIdentityKey);
    expect(knowledgeRows[1].payload.resultIdentityKey).not.toBe(oldResultIdentityKey);
    expect(knowledgeRows[1].payload.supersedesKnowledgeId).toBe('k-old');
    expect(knowledgeRows[0].payload.supersededByKnowledgeId).toBeUndefined();
  });

  it('getLineage resolves predecessor from payload and successor via reverse lookup without modifying existing entries', async () => {
    const { prisma, events, knowledgeRows } = makeHarness();
    const service = new KnowledgeService(prisma, events);

    knowledgeRows.push(
      {
        id: 'k-1',
        type: 'research_outcome',
        payload: { dedupeKey: 'legacy-key' },
        createdAt: new Date('2026-07-16T09:00:00.000Z'),
      },
      {
        id: 'k-2',
        type: 'research_outcome',
        payload: {
          dedupeKey: 'new-key',
          supersedesKnowledgeId: 'k-1',
        },
        createdAt: new Date('2026-07-16T10:00:00.000Z'),
      },
    );

    const snapshot = JSON.stringify(knowledgeRows);
    const lineage = await service.getLineage('k-2');
    const predecessorLineage = await service.getLineage('k-1');

    expect(lineage.supersedesKnowledgeId).toBe('k-1');
    expect(predecessorLineage.supersededByKnowledgeIds).toEqual(['k-2']);
    expect(JSON.stringify(knowledgeRows)).toBe(snapshot);
    expect(prisma.knowledgeEntry.create).not.toHaveBeenCalled();
  });
});

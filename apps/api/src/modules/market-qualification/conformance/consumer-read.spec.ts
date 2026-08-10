import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryQualificationStore } from '../adapters/in-memory-qualification-store';
import { MarketQualificationConsumerReadAdapter } from '../adapters/market-qualification-consumer-read.adapter';
import { createMarketConfidence } from '../domain/market-confidence';
import { createMarketHealth } from '../domain/market-health';
import { createQualificationRun } from '../domain/qualification-run';
import { createQualificationState } from '../domain/qualification-state';
import { createQualificationTarget } from '../domain/qualification-target';
import { deriveQualificationTargetId } from '../lifecycle/derive-qualification-ids';
import { MarketQualificationQueryService } from '../market-qualification-query.service';
import {
  MARKET_QUALIFICATION_CONSUMER_READ_PORT,
  type MarketQualificationConsumerReadPort,
} from '../ports/market-qualification-consumer.port';
import { MARKET_QUALIFICATION_QUERY_PORT } from '../ports/market-qualification.port';

const TS = '2026-08-10T12:00:00.000Z';
const TARGET = {
  workspaceId: 'ws-1',
  exchangeScopeId: 'scope-binance',
  marketSymbol: 'BTCUSDT',
} as const;

describe('RC-25 Epic 6 — Market Qualification consumer reads', () => {
  let consumer: MarketQualificationConsumerReadPort;
  let store: InMemoryQualificationStore;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        InMemoryQualificationStore,
        MarketQualificationQueryService,
        MarketQualificationConsumerReadAdapter,
        {
          provide: MARKET_QUALIFICATION_QUERY_PORT,
          useExisting: MarketQualificationQueryService,
        },
        {
          provide: MARKET_QUALIFICATION_CONSUMER_READ_PORT,
          useExisting: MarketQualificationConsumerReadAdapter,
        },
      ],
    }).compile();

    consumer = moduleRef.get(MARKET_QUALIFICATION_CONSUMER_READ_PORT);
    store = moduleRef.get(InMemoryQualificationStore);
    store.clear();

    const targetId = deriveQualificationTargetId(
      TARGET.workspaceId,
      TARGET.exchangeScopeId,
      TARGET.marketSymbol,
    );
    store.putTarget(
      createQualificationTarget({
        targetId,
        ...TARGET,
        createdAt: TS,
      }),
    );
    store.putState(
      createQualificationState({
        targetId,
        workspaceId: TARGET.workspaceId,
        state: 'qualified',
        latestCompletedRunId: 'run-1',
        updatedAt: TS,
      }),
    );
    store.putRun(
      createQualificationRun({
        qualificationRunId: 'run-1',
        workspaceId: TARGET.workspaceId,
        targetId,
        modeContext: 'lab',
        status: 'completed',
        requestedBy: 'op',
        confirmedBy: 'op',
        inputSummary: { observationCount: 0, researchRefCount: 0 },
        completedAt: TS,
        createdAt: TS,
      }),
    );
    store.putConfidence(
      createMarketConfidence({
        targetId,
        workspaceId: TARGET.workspaceId,
        level: 'high',
        score: 0.8,
        rationaleSummary: 'caller-supplied',
        sourceRunId: 'run-1',
        asOf: TS,
      }),
    );
    store.putHealth(
      createMarketHealth({
        targetId,
        workspaceId: TARGET.workspaceId,
        status: 'healthy',
        indicators: [{ key: 'exchange_connectivity', value: 'ok' }],
        sourceRunId: 'run-1',
        asOf: TS,
      }),
    );
  });

  it('exposes immutable lifecycle / confidence / health / summary projections', async () => {
    const lifecycle = consumer.getLifecycleStatus(TARGET);
    expect(lifecycle?.state).toBe('qualified');
    expect(lifecycle?.mutable).toBe(false);
    expect(lifecycle?.consumerWritable).toBe(false);
    expect(lifecycle?.forcesTrade).toBe(false);
    expect(Object.isFrozen(lifecycle)).toBe(true);

    const confidence = consumer.getConfidenceProjection(TARGET);
    expect(confidence?.level).toBe('high');
    expect(confidence?.authorizesSession).toBe(false);
    expect(Object.isFrozen(confidence)).toBe(true);

    const health = consumer.getHealthProjection(TARGET);
    expect(health?.status).toBe('healthy');
    expect(health?.indicatorCount).toBe(1);
    expect(Object.isFrozen(health)).toBe(true);

    const summary = consumer.getQualificationSummary(TARGET);
    expect(summary?.lifecycle?.state).toBe('qualified');
    expect(summary?.confidence?.level).toBe('high');
    expect(summary?.health?.status).toBe('healthy');
    expect(summary?.latestRunStatus).toBe('completed');
    expect(summary?.consumerWritable).toBe(false);
    expect(Object.isFrozen(summary)).toBe(true);

    await moduleRef.close();
  });

  it('returns null when target is unknown and never mutates store', async () => {
    const before = store.listRuns(TARGET.workspaceId).length;
    expect(
      consumer.getQualificationSummary({
        workspaceId: 'ws-missing',
        exchangeScopeId: 'x',
        marketSymbol: 'Y',
      }),
    ).toBeNull();
    expect(store.listRuns(TARGET.workspaceId)).toHaveLength(before);
    await moduleRef.close();
  });
});

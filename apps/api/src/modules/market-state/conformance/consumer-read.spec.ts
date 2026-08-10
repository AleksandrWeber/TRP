/**
 * RC-26 Epic 6 — Market State consumer read specs.
 */

import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { createMarketState } from '../domain/market-state';
import { MarketStateProjectionStore } from '../domain/market-state-projection.store';
import {
  MARKET_STATE_CONSUMER_READ_PORT,
  type MarketStateConsumerReadPort,
} from '../ports/market-state.port';
import { MarketStateModule } from '../market-state.module';

const asOf = '2026-08-10T20:00:00.000Z';

function seedState(overrides?: { marketStateId?: string; version?: number; status?: string }) {
  return createMarketState({
    marketStateId: overrides?.marketStateId ?? 'ms-1',
    workspaceId: 'ws-1',
    exchangeScopeId: 'binance-spot',
    marketSymbol: 'BTCUSDT',
    version: {
      marketStateId: overrides?.marketStateId ?? 'ms-1',
      version: overrides?.version ?? 1,
      publishedAt: asOf,
      publishedBy: 'op-1',
    },
    lifecycle: {
      status: overrides?.status ?? 'active',
      updatedAt: asOf,
      updatedBy: 'op-1',
      reason: 'seed',
    },
    snapshot: {
      regime: 'trending',
      volatilityClass: 'medium',
      liquidityClass: 'high',
      narrativeSummary: 'descriptive only',
    },
    metadata: {
      observationAsOf: asOf,
      inputSummary: 'opaque refs',
    },
  });
}

describe('RC-26 Epic 6 — Market State consumer reads', () => {
  it('projects immutable current state + transitions with authority flags', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MarketStateModule],
    }).compile();

    const store = moduleRef.get(MarketStateProjectionStore);
    const consumer = moduleRef.get<MarketStateConsumerReadPort>(MARKET_STATE_CONSUMER_READ_PORT);

    const v1 = seedState();
    store.seed(v1);
    const v2 = seedState({ marketStateId: 'ms-2', version: 2, status: 'active' });
    store.seed(v2, v1);

    const projection = consumer.getCurrentStateProjection({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
    });
    expect(projection).not.toBeNull();
    expect(Object.isFrozen(projection)).toBe(true);
    expect(projection?.marketStateId).toBe('ms-2');
    expect(projection?.version).toBe(2);
    expect(projection?.lifecycleStatus).toBe('active');
    expect(projection?.regimeLabel).toBe('trending');
    expect(projection?.metadataSummary).toBe('opaque refs');
    expect(projection?.authorityClass).toBe('market_state_artifact');
    expect(projection?.forcesTrade).toBe(false);
    expect(projection?.isQualification).toBe(false);
    expect(projection?.isProfile).toBe(false);
    expect(projection?.consumerWritable).toBe(false);

    const transitions = consumer.listRecentTransitions({
      workspaceId: 'ws-1',
      exchangeScopeId: 'binance-spot',
      marketSymbol: 'BTCUSDT',
    });
    expect(transitions.length).toBe(2);
    expect(transitions[1]?.toVersion).toBe(2);
    expect(transitions[1]?.forcesTrade).toBe(false);
    expect(transitions[1]?.isQualification).toBe(false);

    await moduleRef.close();
  });

  it('returns null when no current state exists', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [MarketStateModule],
    }).compile();
    const consumer = moduleRef.get<MarketStateConsumerReadPort>(MARKET_STATE_CONSUMER_READ_PORT);
    expect(
      consumer.getCurrentStateProjection({
        workspaceId: 'ws-1',
        exchangeScopeId: 'binance-spot',
        marketSymbol: 'ETHUSDT',
      }),
    ).toBeNull();
    await moduleRef.close();
  });
});

/**
 * RC-26 Epic 3 — Market State domain model specs.
 *
 * Immutable entities, lifecycle edges, version history, overwrite protection.
 * No classification algorithms.
 */

import { describe, expect, it } from 'vitest';
import {
  createMarketState,
  publishNextMarketState,
  withMarketStateLifecycle,
} from './market-state';
import {
  MARKET_STATE_DOMAIN_AUTHORITY_CLASS,
  MARKET_STATE_LIFECYCLE_TRANSITIONS,
  canTransitionMarketStateLifecycle,
} from './market-state-domain-shared';
import {
  createMarketStateLifecycle,
  transitionMarketStateLifecycle,
} from './market-state-lifecycle';
import { createMarketStateMetadata } from './market-state-metadata';
import { createMarketStateSnapshot } from './market-state-snapshot';
import { assertNoVersionOverwrite, createMarketStateVersion } from './market-state-version';

const baseSnapshot = {
  regime: 'quiet' as const,
  volatilityClass: 'low',
  liquidityClass: 'medium',
  narrativeSummary: 'descriptive snapshot only',
};

const baseMetadata = {
  observationAsOf: '2026-08-10T12:00:00.000Z',
  confidenceRef: 'conf-1',
  profileRef: 'mp-1',
  inputSummary: 'lmd+qual+profile refs',
};

function createV1(overrides?: Partial<Parameters<typeof createMarketState>[0]>) {
  return createMarketState({
    marketStateId: 'ms-1',
    workspaceId: 'ws-1',
    exchangeScopeId: 'binance',
    marketSymbol: 'BTCUSDT',
    version: {
      marketStateId: 'ms-1',
      version: 1,
      publishedAt: '2026-08-10T12:00:00.000Z',
      publishedBy: 'operator-1',
    },
    lifecycle: {
      status: 'created',
      updatedAt: '2026-08-10T12:00:00.000Z',
      updatedBy: 'operator-1',
      reason: 'initial',
    },
    snapshot: baseSnapshot,
    metadata: baseMetadata,
    ...overrides,
  });
}

describe('RC-26 Epic 3 — Market State domain model', () => {
  it('creates immutable MarketStateVersion / Snapshot / Metadata / Lifecycle', () => {
    const version = createMarketStateVersion({
      marketStateId: 'ms-1',
      version: 1,
      publishedAt: '2026-08-10T12:00:00.000Z',
      publishedBy: 'op',
    });
    const snapshot = createMarketStateSnapshot(baseSnapshot);
    const metadata = createMarketStateMetadata(baseMetadata);
    const lifecycle = createMarketStateLifecycle({
      status: 'created',
      updatedAt: '2026-08-10T12:00:00.000Z',
      updatedBy: 'op',
      reason: 'initial',
    });

    expect(Object.isFrozen(version)).toBe(true);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(metadata)).toBe(true);
    expect(Object.isFrozen(lifecycle)).toBe(true);
    expect(version.mutable).toBe(false);
    expect(snapshot.decidesTrade).toBe(false);
    expect(metadata.isQualification).toBe(false);
    expect(metadata.isProfile).toBe(false);
    expect(lifecycle.authorizesRuntime).toBe(false);
  });

  it('creates immutable MarketState aggregate with market_state_artifact authority', () => {
    const state = createV1();
    expect(Object.isFrozen(state)).toBe(true);
    expect(state.authorityClass).toBe(MARKET_STATE_DOMAIN_AUTHORITY_CLASS);
    expect(state.forcesTrade).toBe(false);
    expect(state.isQualification).toBe(false);
    expect(state.isProfile).toBe(false);
    expect(state.authorizesRuntime).toBe(false);
    expect(state.mutable).toBe(false);
    expect(state.version.version).toBe(1);
    expect(state.snapshot.regime).toBe('quiet');
  });

  it('rejects unknown regime / lifecycle and mismatched version identity', () => {
    expect(() => createMarketStateSnapshot({ ...baseSnapshot, regime: 'made-up' })).toThrow(
      /known MarketStateRegimeLabel/,
    );
    expect(() =>
      createMarketStateLifecycle({
        status: 'pending',
        updatedAt: '2026-08-10T12:00:00.000Z',
        updatedBy: 'op',
        reason: 'x',
      }),
    ).toThrow(/known MarketStateLifecycleStatus/);
    expect(() =>
      createV1({
        version: {
          marketStateId: 'other',
          version: 1,
          publishedAt: '2026-08-10T12:00:00.000Z',
          publishedBy: 'op',
        },
      }),
    ).toThrow(/version.marketStateId must match/);
  });

  it('enforces Created → Active → Superseded → Archived lifecycle edges only', () => {
    expect(canTransitionMarketStateLifecycle('created', 'active')).toBe(true);
    expect(canTransitionMarketStateLifecycle('active', 'superseded')).toBe(true);
    expect(canTransitionMarketStateLifecycle('superseded', 'archived')).toBe(true);
    expect(canTransitionMarketStateLifecycle('archived', 'active')).toBe(false);
    expect(canTransitionMarketStateLifecycle('created', 'superseded')).toBe(false);
    expect(MARKET_STATE_LIFECYCLE_TRANSITIONS.archived).toEqual([]);

    const created = createMarketStateLifecycle({
      status: 'created',
      updatedAt: '2026-08-10T12:00:00.000Z',
      updatedBy: 'op',
      reason: 'init',
    });
    const active = transitionMarketStateLifecycle(
      created,
      'active',
      '2026-08-10T12:01:00.000Z',
      'op',
      'activate',
    );
    expect(active.status).toBe('active');
    expect(Object.isFrozen(active)).toBe(true);
    expect(created.status).toBe('created');

    expect(() =>
      transitionMarketStateLifecycle(
        created,
        'superseded',
        '2026-08-10T12:02:00.000Z',
        'op',
        'bad',
      ),
    ).toThrow(/forbidden MarketState lifecycle transition/);
  });

  it('withMarketStateLifecycle returns a new immutable aggregate', () => {
    const created = createV1();
    const active = withMarketStateLifecycle(
      created,
      'active',
      '2026-08-10T12:05:00.000Z',
      'op',
      'activate',
    );
    expect(created.lifecycle.status).toBe('created');
    expect(active.lifecycle.status).toBe('active');
    expect(active.marketStateId).toBe(created.marketStateId);
    expect(Object.isFrozen(active)).toBe(true);
  });

  it('publishNextMarketState appends versions and supersedes prior active (no overwrite)', () => {
    const first = publishNextMarketState({
      history: [],
      next: {
        marketStateId: 'ms-1',
        workspaceId: 'ws-1',
        exchangeScopeId: 'binance',
        marketSymbol: 'BTCUSDT',
        versionNumber: 1,
        publishedAt: '2026-08-10T12:00:00.000Z',
        publishedBy: 'op',
        snapshot: baseSnapshot,
        metadata: baseMetadata,
      },
    });
    expect(first.previous).toBeNull();
    expect(first.next.lifecycle.status).toBe('active');
    expect(first.next.version.version).toBe(1);
    expect(first.history).toHaveLength(1);

    const second = publishNextMarketState({
      history: first.history,
      next: {
        marketStateId: 'ms-2',
        workspaceId: 'ws-1',
        exchangeScopeId: 'binance',
        marketSymbol: 'BTCUSDT',
        versionNumber: 2,
        publishedAt: '2026-08-10T13:00:00.000Z',
        publishedBy: 'op',
        snapshot: { ...baseSnapshot, regime: 'trending', narrativeSummary: 'v2 descriptive' },
        metadata: baseMetadata,
      },
    });
    expect(second.previous?.lifecycle.status).toBe('superseded');
    expect(second.previous?.version.version).toBe(1);
    expect(second.next.version.version).toBe(2);
    expect(second.next.lifecycle.status).toBe('active');
    expect(second.history).toHaveLength(2);
    expect(second.history[0]?.lifecycle.status).toBe('superseded');
    expect(second.history[1]?.lifecycle.status).toBe('active');

    // Original first.next remains untouched (immutability of prior object).
    expect(first.next.lifecycle.status).toBe('active');
  });

  it('rejects version overwrite and non-monotonic versions', () => {
    expect(() => assertNoVersionOverwrite([{ version: 1 }], 1)).toThrow(/overwrite forbidden/);
    expect(() =>
      publishNextMarketState({
        history: [],
        next: {
          marketStateId: 'ms-1',
          workspaceId: 'ws-1',
          exchangeScopeId: 'binance',
          marketSymbol: 'BTCUSDT',
          versionNumber: 2,
          publishedAt: '2026-08-10T12:00:00.000Z',
          publishedBy: 'op',
          snapshot: baseSnapshot,
          metadata: baseMetadata,
        },
      }),
    ).toThrow(/monotonic/);
  });

  it('never becomes Qualification / Profile and never decides trades', () => {
    const state = withMarketStateLifecycle(
      createV1(),
      'active',
      '2026-08-10T12:05:00.000Z',
      'op',
      'activate',
    );
    expect(state.isQualification).toBe(false);
    expect(state.isProfile).toBe(false);
    expect(state.forcesTrade).toBe(false);
    expect(state.authorizesRuntime).toBe(false);
    expect(state.snapshot.decidesTrade).toBe(false);
    expect(state).not.toHaveProperty('selectStrategy');
    expect(state).not.toHaveProperty('classifyAlgorithm');
  });
});

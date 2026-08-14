/**
 * RC-27 Epic 2 — Exchange Scope domain model specs.
 *
 * Immutable entities, lifecycle edges, version history, overwrite protection,
 * account bindings. No trading-path behaviour.
 */

import { describe, expect, it } from 'vitest';
import { createAdapterBindingContext } from './adapter-binding-context';
import {
  createExchangeScope,
  publishNextExchangeScopeConfig,
  withExchangeScopeLifecycle,
} from './exchange-scope';
import { createExchangeScopeConfig } from './exchange-scope-config';
import {
  EXCHANGE_POLICY_INPUT_AUTHORITY_CLASS,
  EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
  EXCHANGE_SCOPE_LIFECYCLE_TRANSITIONS,
  canTransitionExchangeScopeLifecycle,
  exchangeScopeBlocksNewSessionCapacity,
} from './exchange-scope-domain-shared';
import {
  createExchangeScopeLifecycle,
  transitionExchangeScopeLifecycle,
} from './exchange-scope-lifecycle';
import { createExchangeScopeMetadata } from './exchange-scope-metadata';
import { assertNoVersionOverwrite, createExchangeScopeVersion } from './exchange-scope-version';
import { createExchangeRiskPolicy, publishNextExchangeRiskPolicy } from './exchange-risk-policy';
import { createTradingAccountBinding, unbindTradingAccount } from './trading-account-binding';

const baseConfig = {
  exchangeScopeId: 'exchange-scope:binance',
  maxActiveSessions: 3,
  symbolAllowlist: ['BTCUSDT'],
  strategyAllowlist: ['lib-entry-1'],
  modeContext: 'paper' as const,
  updatedAt: '2026-08-14T12:00:00.000Z',
  updatedBy: 'operator-1',
};

const baseMetadata = {
  asOf: '2026-08-14T12:00:00.000Z',
  adapterContextRef: 'abc-1',
  policyRef: 'pol-1',
  inputSummary: 'isolation config only',
};

function createV1(overrides?: Partial<Parameters<typeof createExchangeScope>[0]>) {
  return createExchangeScope({
    exchangeScopeId: 'exchange-scope:binance',
    workspaceId: 'ws-1',
    venueCode: 'binance',
    displayName: 'Binance',
    version: {
      exchangeScopeId: 'exchange-scope:binance',
      version: 1,
      publishedAt: '2026-08-14T12:00:00.000Z',
      publishedBy: 'operator-1',
    },
    lifecycle: {
      status: 'created',
      updatedAt: '2026-08-14T12:00:00.000Z',
      updatedBy: 'operator-1',
      reason: 'initial',
    },
    config: baseConfig,
    metadata: baseMetadata,
    ...overrides,
  });
}

describe('RC-27 Epic 2 — Exchange Scope domain model', () => {
  it('creates immutable Version / Config / Metadata / Lifecycle', () => {
    const version = createExchangeScopeVersion({
      exchangeScopeId: 'exchange-scope:binance',
      version: 1,
      publishedAt: '2026-08-14T12:00:00.000Z',
      publishedBy: 'op',
    });
    const config = createExchangeScopeConfig(baseConfig);
    const metadata = createExchangeScopeMetadata(baseMetadata);
    const lifecycle = createExchangeScopeLifecycle({
      status: 'created',
      updatedAt: '2026-08-14T12:00:00.000Z',
      updatedBy: 'op',
      reason: 'initial',
    });

    expect(Object.isFrozen(version)).toBe(true);
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(metadata)).toBe(true);
    expect(Object.isFrozen(lifecycle)).toBe(true);
    expect(version.mutable).toBe(false);
    expect(config.authorizesRuntime).toBe(false);
    expect(config.forcesTrade).toBe(false);
    expect(metadata.ownsStrategyLibrary).toBe(false);
    expect(metadata.ownsTradingSession).toBe(false);
    expect(lifecycle.authorizesRuntime).toBe(false);
    expect(lifecycle.executesActions).toBe(false);
    expect(lifecycle.blocksNewSessionCapacity).toBe(false);
  });

  it('creates immutable ExchangeScope aggregate with exchange_scope_artifact authority', () => {
    const scope = createV1();
    expect(Object.isFrozen(scope)).toBe(true);
    expect(scope.authorityClass).toBe(EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS);
    expect(scope.isRuntime).toBe(false);
    expect(scope.isTradingSession).toBe(false);
    expect(scope.isExecutionEngine).toBe(false);
    expect(scope.isStrategyLibrary).toBe(false);
    expect(scope.isRiskEngine).toBe(false);
    expect(scope.approvesRisk).toBe(false);
    expect(scope.submitsOrders).toBe(false);
    expect(scope.mutable).toBe(false);
    expect(scope.version.version).toBe(1);
    expect(scope.config.maxActiveSessions).toBe(3);
  });

  it('rejects unknown lifecycle / mode and mismatched version identity', () => {
    expect(() =>
      createExchangeScopeLifecycle({
        status: 'pending',
        updatedAt: '2026-08-14T12:00:00.000Z',
        updatedBy: 'op',
        reason: 'x',
      }),
    ).toThrow(/known ExchangeScopeLifecycleStatus/);
    expect(() => createExchangeScopeConfig({ ...baseConfig, modeContext: 'prod' })).toThrow(
      /known ExchangeScopeModeContext/,
    );
    expect(() =>
      createV1({
        version: {
          exchangeScopeId: 'other',
          version: 1,
          publishedAt: '2026-08-14T12:00:00.000Z',
          publishedBy: 'op',
        },
      }),
    ).toThrow(/version.exchangeScopeId must match/);
  });

  it('enforces Created → Active ↔ Suspended → Archived lifecycle edges only', () => {
    expect(canTransitionExchangeScopeLifecycle('created', 'active')).toBe(true);
    expect(canTransitionExchangeScopeLifecycle('active', 'suspended')).toBe(true);
    expect(canTransitionExchangeScopeLifecycle('suspended', 'active')).toBe(true);
    expect(canTransitionExchangeScopeLifecycle('active', 'archived')).toBe(true);
    expect(canTransitionExchangeScopeLifecycle('archived', 'active')).toBe(false);
    expect(canTransitionExchangeScopeLifecycle('created', 'suspended')).toBe(false);
    expect(EXCHANGE_SCOPE_LIFECYCLE_TRANSITIONS.archived).toEqual([]);

    const created = createExchangeScopeLifecycle({
      status: 'created',
      updatedAt: '2026-08-14T12:00:00.000Z',
      updatedBy: 'op',
      reason: 'init',
    });
    const active = transitionExchangeScopeLifecycle(
      created,
      'active',
      '2026-08-14T12:01:00.000Z',
      'op',
      'activate',
    );
    expect(active.status).toBe('active');
    expect(Object.isFrozen(active)).toBe(true);
    expect(created.status).toBe('created');

    const suspended = transitionExchangeScopeLifecycle(
      active,
      'suspended',
      '2026-08-14T12:02:00.000Z',
      'op',
      'pause venue',
    );
    expect(suspended.blocksNewSessionCapacity).toBe(true);
    expect(exchangeScopeBlocksNewSessionCapacity('suspended')).toBe(true);
    expect(exchangeScopeBlocksNewSessionCapacity('archived')).toBe(true);
    expect(exchangeScopeBlocksNewSessionCapacity('active')).toBe(false);

    expect(() =>
      transitionExchangeScopeLifecycle(
        created,
        'suspended',
        '2026-08-14T12:03:00.000Z',
        'op',
        'bad',
      ),
    ).toThrow(/forbidden ExchangeScope lifecycle transition/);

    const scope = withExchangeScopeLifecycle(
      createV1(),
      'active',
      '2026-08-14T12:04:00.000Z',
      'op',
      'activate scope',
    );
    expect(scope.lifecycle.status).toBe('active');
    expect(scope.version.version).toBe(1);
  });

  it('enforces append-only config versioning with overwrite protection', () => {
    assertNoVersionOverwrite([{ version: 1 }], 2);
    expect(() => assertNoVersionOverwrite([{ version: 1 }], 1)).toThrow(/overwrite forbidden/);

    const v1 = withExchangeScopeLifecycle(
      createV1(),
      'active',
      '2026-08-14T12:00:00.000Z',
      'op',
      'activate',
    );

    const published = publishNextExchangeScopeConfig({
      history: [v1],
      next: {
        exchangeScopeId: 'exchange-scope:binance',
        workspaceId: 'ws-1',
        venueCode: 'binance',
        displayName: 'Binance',
        versionNumber: 2,
        publishedAt: '2026-08-14T13:00:00.000Z',
        publishedBy: 'op',
        config: {
          ...baseConfig,
          maxActiveSessions: 5,
          updatedAt: '2026-08-14T13:00:00.000Z',
        },
        metadata: baseMetadata,
      },
    });

    expect(published.next.version.version).toBe(2);
    expect(published.next.config.maxActiveSessions).toBe(5);
    expect(published.history).toHaveLength(2);
    expect(published.history[0]?.version.version).toBe(1);
    expect(v1.config.maxActiveSessions).toBe(3);

    expect(() =>
      publishNextExchangeScopeConfig({
        history: published.history,
        next: {
          exchangeScopeId: 'exchange-scope:binance',
          workspaceId: 'ws-1',
          venueCode: 'binance',
          displayName: 'Binance',
          versionNumber: 2,
          publishedAt: '2026-08-14T14:00:00.000Z',
          publishedBy: 'op',
          config: baseConfig,
          metadata: baseMetadata,
        },
      }),
    ).toThrow(/overwrite forbidden/);

    expect(() =>
      publishNextExchangeScopeConfig({
        history: published.history,
        next: {
          exchangeScopeId: 'exchange-scope:binance',
          workspaceId: 'ws-1',
          venueCode: 'binance',
          displayName: 'Binance',
          versionNumber: 4,
          publishedAt: '2026-08-14T14:00:00.000Z',
          publishedBy: 'op',
          config: baseConfig,
          metadata: baseMetadata,
        },
      }),
    ).toThrow(/monotonic/);
  });

  it('creates immutable policy inputs (never Risk Decisions) with append-only versions', () => {
    const policy = createExchangeRiskPolicy({
      exchangeRiskPolicyId: 'pol-1',
      exchangeScopeId: 'exchange-scope:binance',
      workspaceId: 'ws-1',
      policyVersion: 1,
      limits: {
        maxExposureLabel: '10%',
        maxOrderNotionalLabel: '1000',
      },
      publishedAt: '2026-08-14T12:00:00.000Z',
      publishedBy: 'op',
    });
    expect(Object.isFrozen(policy)).toBe(true);
    expect(policy.authorityClass).toBe(EXCHANGE_POLICY_INPUT_AUTHORITY_CLASS);
    expect(policy.isRiskDecision).toBe(false);
    expect(policy.approvesRisk).toBe(false);

    const next = publishNextExchangeRiskPolicy({
      history: [policy],
      next: {
        exchangeRiskPolicyId: 'pol-2',
        exchangeScopeId: 'exchange-scope:binance',
        workspaceId: 'ws-1',
        policyVersion: 2,
        limits: {
          maxExposureLabel: '8%',
          maxOrderNotionalLabel: '800',
        },
        publishedAt: '2026-08-14T13:00:00.000Z',
        publishedBy: 'op',
      },
    });
    expect(next.history).toHaveLength(2);
    expect(next.next.policyVersion).toBe(2);
  });

  it('represents account bindings only — no ledger ownership or balance moves', () => {
    const binding = createTradingAccountBinding({
      tradingAccountBindingId: 'bind-1',
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      tradingAccountId: 'acct-1',
      boundAt: '2026-08-14T12:00:00.000Z',
      boundBy: 'op',
    });
    expect(Object.isFrozen(binding)).toBe(true);
    expect(binding.status).toBe('bound');
    expect(binding.ownsLedger).toBe(false);
    expect(binding.movesBalances).toBe(false);

    const unbound = unbindTradingAccount(binding, '2026-08-14T13:00:00.000Z', 'op');
    expect(unbound.status).toBe('unbound');
    expect(binding.status).toBe('bound');
    expect(() => unbindTradingAccount(unbound, '2026-08-14T14:00:00.000Z', 'op')).toThrow(
      /already unbound/,
    );
  });

  it('creates logical adapter binding context without becoming Execution Engine', () => {
    const ctx = createAdapterBindingContext({
      adapterBindingContextId: 'abc-1',
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      adapterIdentity: 'binance-paper',
      modeContext: 'paper',
      updatedAt: '2026-08-14T12:00:00.000Z',
      updatedBy: 'op',
    });
    expect(Object.isFrozen(ctx)).toBe(true);
    expect(ctx.isExecutionEngine).toBe(false);
    expect(ctx.submitsOrders).toBe(false);
    expect(ctx.definesWireProtocol).toBe(false);
  });
});

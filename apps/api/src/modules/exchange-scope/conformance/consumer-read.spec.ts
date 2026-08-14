/**
 * RC-27 Epic 5 — Exchange Scope consumer read conformance.
 *
 * Immutable projections, authority flags, consumer isolation,
 * cross-scope aggregate without invented balances.
 */

import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { InMemoryExchangeScopeStore } from '../adapters/in-memory-exchange-scope-store';
import {
  EXCHANGE_SCOPE_CONSUMER_INTENDED,
  EXCHANGE_SCOPE_CONSUMER_FLAGS,
} from '../domain/exchange-scope-consumer-read-model';
import { ExchangeScopeConsumerReadService } from '../exchange-scope-consumer-read.service';
import { ExchangeScopeModule } from '../exchange-scope.module';
import {
  EXCHANGE_SCOPE_CONSUMER_READ_PORT,
  EXCHANGE_SCOPE_SERVICE_PORT,
  type ExchangeScopeConsumerReadPort,
  type ExchangeScopeServicePort,
} from '../ports/exchange-scope.port';

const TS = '2026-08-14T20:00:00.000Z';

describe('RC-27 Epic 5 — Exchange Scope consumer reads', () => {
  async function seedWorkspace() {
    const moduleRef = await Test.createTestingModule({
      imports: [ExchangeScopeModule],
    }).compile();
    const store = moduleRef.get(InMemoryExchangeScopeStore);
    store.clear();
    const service = moduleRef.get<ExchangeScopeServicePort>(EXCHANGE_SCOPE_SERVICE_PORT);
    const consumer = moduleRef.get<ExchangeScopeConsumerReadPort>(
      EXCHANGE_SCOPE_CONSUMER_READ_PORT,
    );

    service.registerExchangeScope({
      workspaceId: 'ws-1',
      venueCode: 'binance',
      displayName: 'Binance',
      requestedBy: 'op',
      requestedAt: TS,
      maxActiveSessions: 2,
    });
    service.activateExchangeScope({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      requestedBy: 'op',
      asOf: '2026-08-14T20:01:00.000Z',
    });
    service.updateExchangeScopeConfig({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      updatedBy: 'op',
      symbolAllowlist: ['BTCUSDT', 'ETHUSDT'],
      asOf: '2026-08-14T20:02:00.000Z',
    });
    service.publishExchangeRiskPolicy({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      publishedBy: 'op',
      limits: { maxExposureLabel: '10%', maxOrderNotionalLabel: '1000' },
      asOf: '2026-08-14T20:03:00.000Z',
    });
    service.bindTradingAccount({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      tradingAccountId: 'acct-1',
      requestedBy: 'op',
      asOf: '2026-08-14T20:04:00.000Z',
    });
    service.registerExchangeScope({
      workspaceId: 'ws-1',
      venueCode: 'bybit',
      displayName: 'Bybit',
      requestedBy: 'op',
      requestedAt: '2026-08-14T20:05:00.000Z',
    });
    service.activateExchangeScope({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:bybit',
      requestedBy: 'op',
      asOf: '2026-08-14T20:06:00.000Z',
    });
    service.suspendExchangeScope({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:bybit',
      requestedBy: 'op',
      asOf: '2026-08-14T20:07:00.000Z',
    });

    return { moduleRef, consumer, service };
  }

  it('wires ConsumerReadService as the Nest consumer-read port', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ExchangeScopeModule],
    }).compile();
    const port = moduleRef.get<ExchangeScopeConsumerReadPort>(EXCHANGE_SCOPE_CONSUMER_READ_PORT);
    const service = moduleRef.get(ExchangeScopeConsumerReadService);
    expect(port).toBe(service);
    await moduleRef.close();
  });

  it('projects immutable identity / lifecycle / config / policy / bindings / metadata / active status', async () => {
    const { moduleRef, consumer } = await seedWorkspace();
    const q = { workspaceId: 'ws-1', exchangeScopeId: 'exchange-scope:binance' };

    const scope = consumer.getScopeProjection(q);
    expect(scope).not.toBeNull();
    expect(Object.isFrozen(scope)).toBe(true);
    expect(scope?.isActive).toBe(true);
    expect(scope?.authorityClass).toBe('exchange_scope_artifact');
    expect(scope?.consumerWritable).toBe(false);
    expect(scope?.isLedger).toBe(false);
    expect(scope?.approvesRisk).toBe(false);
    expect(scope?.submitsOrders).toBe(false);

    const lifecycle = consumer.getLifecycleProjection(q);
    expect(Object.isFrozen(lifecycle)).toBe(true);
    expect(lifecycle?.status).toBe('active');
    expect(lifecycle?.isActive).toBe(true);
    expect(lifecycle?.authorizesRuntime).toBe(false);
    expect(lifecycle?.executesActions).toBe(false);

    const config = consumer.getConfigSummaryProjection(q);
    expect(Object.isFrozen(config)).toBe(true);
    expect(config?.symbolAllowlistCount).toBe(2);
    expect(config?.forcesTrade).toBe(false);

    const policy = consumer.getPolicyInputProjection(q);
    expect(Object.isFrozen(policy)).toBe(true);
    expect(policy?.authorityClass).toBe('exchange_policy_input');
    expect(policy?.isRiskDecision).toBe(false);
    expect(policy?.approvesRisk).toBe(false);

    const bindings = consumer.listAccountBindingProjections(q);
    expect(Object.isFrozen(bindings)).toBe(true);
    expect(bindings).toHaveLength(1);
    expect(bindings[0]?.ownsLedger).toBe(false);
    expect(bindings[0]?.movesBalances).toBe(false);
    expect(Object.isFrozen(bindings[0])).toBe(true);

    const metadata = consumer.getMetadataProjection(q);
    expect(Object.isFrozen(metadata)).toBe(true);
    expect(metadata?.ownsOrders).toBe(false);
    expect(metadata?.ownsExecution).toBe(false);
    expect(metadata?.ownsAccounting).toBe(false);

    const active = consumer.getActiveStatusProjection(q);
    expect(Object.isFrozen(active)).toBe(true);
    expect(active?.isActive).toBe(true);
    expect(active?.blocksNewSessionCapacity).toBe(false);

    await moduleRef.close();
  });

  it('exposes explicit cross-scope workspace aggregate without inventing balances', async () => {
    const { moduleRef, consumer } = await seedWorkspace();
    const aggregate = consumer.getWorkspaceAggregateProjection({ workspaceId: 'ws-1' });
    expect(aggregate).not.toBeNull();
    expect(Object.isFrozen(aggregate)).toBe(true);
    expect(Object.isFrozen(aggregate?.scopes)).toBe(true);
    expect(aggregate?.scopeCount).toBe(2);
    expect(aggregate?.activeCount).toBe(1);
    expect(aggregate?.suspendedCount).toBe(1);
    expect(aggregate?.inventsBalances).toBe(false);
    expect(aggregate?.inventsFills).toBe(false);
    expect(aggregate?.inventsRiskApprovals).toBe(false);
    expect(aggregate?.inventsOrders).toBe(false);
    expect(aggregate?.isRiskEngine).toBe(false);
    expect(aggregate?.isExecutionEngine).toBe(false);

    await moduleRef.close();
  });

  it('never exposes command / mutation surfaces on the consumer port', async () => {
    const { moduleRef, consumer } = await seedWorkspace();
    expect(consumer).not.toHaveProperty('registerExchangeScope');
    expect(consumer).not.toHaveProperty('activateExchangeScope');
    expect(consumer).not.toHaveProperty('updateExchangeScopeConfig');
    expect(consumer).not.toHaveProperty('publishExchangeRiskPolicy');
    expect(consumer).not.toHaveProperty('bindTradingAccount');
    expect(consumer).not.toHaveProperty('createTradingSession');
    expect(consumer).not.toHaveProperty('approveRisk');
    expect(consumer).not.toHaveProperty('submitOrder');
    expect(consumer).not.toHaveProperty('callExchangeApi');
    expect(EXCHANGE_SCOPE_CONSUMER_FLAGS.consumerWritable).toBe(false);
    expect(EXCHANGE_SCOPE_CONSUMER_INTENDED).toEqual(
      expect.arrayContaining([
        'reporting',
        'ai-analytics',
        'knowledge-lake',
        'command-center',
        'notification-delivery',
        'multi-exchange-ui',
      ]),
    );
    await moduleRef.close();
  });

  it('isolates projections by workspace / scope identity', async () => {
    const { moduleRef, consumer } = await seedWorkspace();
    expect(
      consumer.getScopeProjection({
        workspaceId: 'ws-other',
        exchangeScopeId: 'exchange-scope:binance',
      }),
    ).toBeNull();
    expect(
      consumer.getLifecycleProjection({
        workspaceId: 'ws-1',
        exchangeScopeId: 'exchange-scope:missing',
      }),
    ).toBeNull();
    expect(consumer.getWorkspaceAggregateProjection({ workspaceId: '   ' })).toBeNull();
    expect(consumer.listScopeProjections({ workspaceId: 'ws-other' })).toEqual([]);
    await moduleRef.close();
  });
});

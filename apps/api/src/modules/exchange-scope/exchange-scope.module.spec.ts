import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { InMemoryExchangeScopeStore } from './adapters/in-memory-exchange-scope-store';
import {
  EXCHANGE_SCOPE_BOUNDARY,
  EXCHANGE_SCOPE_MODULE_ID,
} from './domain/exchange-scope-boundary';
import { ExchangeScopeBoundaryService } from './exchange-scope-boundary.service';
import { ExchangeScopeModule } from './exchange-scope.module';
import {
  EXCHANGE_SCOPE_CONSUMER_READ_PORT,
  EXCHANGE_SCOPE_PORTS_ACTIVE,
  EXCHANGE_SCOPE_QUERY_PORT,
  EXCHANGE_SCOPE_SERVICE_PORT,
  type ExchangeScopeConsumerReadPort,
  type ExchangeScopeQueryPort,
  type ExchangeScopeServicePort,
} from './ports/exchange-scope.port';

describe('RC-27 Epic 3 — Exchange Scope Nest application ports', () => {
  it('wires service / query / consumer-read ports; persistence/REST stay inactive', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ExchangeScopeModule],
    }).compile();

    const boundary = moduleRef.get(ExchangeScopeBoundaryService);
    expect(boundary.getBoundary()).toBe(EXCHANGE_SCOPE_BOUNDARY);
    expect(boundary.getBoundary().moduleId).toBe(EXCHANGE_SCOPE_MODULE_ID);
    expect(boundary.getBoundary().activePorts).toEqual(EXCHANGE_SCOPE_PORTS_ACTIVE);
    expect(boundary.isRuntime()).toBe(false);
    expect(boundary.isTradingSession()).toBe(false);
    expect(boundary.isExecutionEngine()).toBe(false);

    const service = moduleRef.get<ExchangeScopeServicePort>(EXCHANGE_SCOPE_SERVICE_PORT);
    const query = moduleRef.get<ExchangeScopeQueryPort>(EXCHANGE_SCOPE_QUERY_PORT);
    const consumer = moduleRef.get<ExchangeScopeConsumerReadPort>(
      EXCHANGE_SCOPE_CONSUMER_READ_PORT,
    );
    expect(service).toBeDefined();
    expect(query).toBeDefined();
    expect(consumer).toBeDefined();
    expect(moduleRef.get(InMemoryExchangeScopeStore)).toBeDefined();

    await moduleRef.close();
  });

  it('registers, activates, queries, binds, and projects without trading-path behaviour', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ExchangeScopeModule],
    }).compile();

    const service = moduleRef.get<ExchangeScopeServicePort>(EXCHANGE_SCOPE_SERVICE_PORT);
    const query = moduleRef.get<ExchangeScopeQueryPort>(EXCHANGE_SCOPE_QUERY_PORT);
    const consumer = moduleRef.get<ExchangeScopeConsumerReadPort>(
      EXCHANGE_SCOPE_CONSUMER_READ_PORT,
    );
    const store = moduleRef.get(InMemoryExchangeScopeStore);
    store.clear();

    const registered = service.registerExchangeScope({
      workspaceId: 'ws-1',
      venueCode: 'binance',
      displayName: 'Binance',
      requestedBy: 'op',
      requestedAt: '2026-08-14T18:00:00.000Z',
      maxActiveSessions: 3,
    });
    expect(registered.outcome).toBe('accepted');
    expect(registered.exchangeScopeId).toBe('exchange-scope:binance');
    expect(registered.exchangeScope?.lifecycle.status).toBe('created');
    expect(registered.exchangeScope?.isRuntime).toBe(false);
    expect(registered.exchangeScope?.submitsOrders).toBe(false);

    const activated = service.activateExchangeScope({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      requestedBy: 'op',
      asOf: '2026-08-14T18:01:00.000Z',
    });
    expect(activated.outcome).toBe('accepted');
    expect(activated.exchangeScope?.lifecycle.status).toBe('active');

    const dup = service.registerExchangeScope({
      workspaceId: 'ws-1',
      venueCode: 'binance',
      displayName: 'Binance 2',
      requestedBy: 'op',
      exchangeScopeId: 'exchange-scope:binance-alt',
      requestedAt: '2026-08-14T18:02:00.000Z',
    });
    expect(dup.outcome).toBe('rejected');
    expect(dup.rejectionReasons).toContain('active_venue_exists');

    const bybit = service.registerExchangeScope({
      workspaceId: 'ws-1',
      venueCode: 'bybit',
      displayName: 'Bybit',
      requestedBy: 'op',
      requestedAt: '2026-08-14T18:03:00.000Z',
    });
    expect(bybit.outcome).toBe('accepted');

    const config = service.updateExchangeScopeConfig({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      updatedBy: 'op',
      maxActiveSessions: 5,
      symbolAllowlist: ['BTCUSDT'],
      asOf: '2026-08-14T18:04:00.000Z',
    });
    expect(config.outcome).toBe('accepted');
    expect(config.exchangeScope?.version.version).toBe(2);
    expect(config.exchangeScope?.config.maxActiveSessions).toBe(5);
    expect(config.exchangeScope?.lifecycle.status).toBe('active');

    const policy = service.publishExchangeRiskPolicy({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      publishedBy: 'op',
      limits: { maxExposureLabel: '10%', maxOrderNotionalLabel: '1000' },
      asOf: '2026-08-14T18:05:00.000Z',
    });
    expect(policy.outcome).toBe('accepted');
    expect(policy.policy?.isRiskDecision).toBe(false);
    expect(policy.policy?.approvesRisk).toBe(false);

    const binding = service.bindTradingAccount({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      tradingAccountId: 'acct-1',
      requestedBy: 'op',
      asOf: '2026-08-14T18:06:00.000Z',
    });
    expect(binding.outcome).toBe('accepted');
    expect(binding.binding?.ownsLedger).toBe(false);
    expect(binding.binding?.movesBalances).toBe(false);

    const adapter = service.setAdapterBindingContext({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      adapterIdentity: 'binance-paper',
      requestedBy: 'op',
      asOf: '2026-08-14T18:07:00.000Z',
    });
    expect(adapter.outcome).toBe('accepted');
    expect(adapter.context?.isExecutionEngine).toBe(false);
    expect(adapter.context?.definesWireProtocol).toBe(false);

    const suspended = service.suspendExchangeScope({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      requestedBy: 'op',
      asOf: '2026-08-14T18:08:00.000Z',
    });
    expect(suspended.outcome).toBe('suspended');
    expect(suspended.exchangeScope?.lifecycle.blocksNewSessionCapacity).toBe(true);

    const view = query.getExchangeScope({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
    });
    expect(view?.lifecycle.status).toBe('suspended');
    expect(view?.isRuntime).toBe(false);
    expect(view?.approvesRisk).toBe(false);

    const listed = query.listExchangeScopes({ workspaceId: 'ws-1' });
    expect(listed.length).toBeGreaterThanOrEqual(2);

    const configView = query.getExchangeScopeConfig({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
    });
    expect(configView?.maxActiveSessions).toBe(5);
    expect(configView?.forcesTrade).toBe(false);

    const policyView = query.getExchangeRiskPolicy({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
    });
    expect(policyView?.authorityClass).toBe('exchange_policy_input');
    expect(policyView?.isRiskDecision).toBe(false);

    const bindings = query.listTradingAccountBindings({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
      status: 'bound',
    });
    expect(bindings).toHaveLength(1);

    const projection = consumer.getScopeProjection({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
    });
    expect(projection?.lifecycleStatus).toBe('suspended');
    expect(projection?.consumerWritable).toBe(false);
    expect(projection?.isTradingSession).toBe(false);
    expect(projection?.isActive).toBe(false);
    expect(projection?.isLedger).toBe(false);

    const lifecycle = consumer.getLifecycleProjection({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
    });
    expect(lifecycle?.status).toBe('suspended');
    expect(lifecycle?.authorizesRuntime).toBe(false);

    const metadata = consumer.getMetadataProjection({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
    });
    expect(metadata?.ownsAccounting).toBe(false);

    const aggregate = consumer.getWorkspaceAggregateProjection({ workspaceId: 'ws-1' });
    expect(aggregate?.inventsBalances).toBe(false);
    expect(aggregate?.scopeCount).toBeGreaterThanOrEqual(2);

    const configProjection = consumer.getConfigSummaryProjection({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
    });
    expect(configProjection?.maxActiveSessions).toBe(5);
    expect(configProjection?.submitsOrders).toBe(false);

    const policyProjection = consumer.getPolicyInputProjection({
      workspaceId: 'ws-1',
      exchangeScopeId: 'exchange-scope:binance',
    });
    expect(policyProjection?.authorityClass).toBe('exchange_policy_input');
    expect(policyProjection?.approvesRisk).toBe(false);

    expect(service).not.toHaveProperty('createTradingSession');
    expect(service).not.toHaveProperty('approveRisk');
    expect(service).not.toHaveProperty('submitOrder');
    expect(service).not.toHaveProperty('callExchangeApi');

    await moduleRef.close();
  });
});

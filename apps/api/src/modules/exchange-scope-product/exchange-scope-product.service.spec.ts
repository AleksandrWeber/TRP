import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ExchangeScopeModule } from '../exchange-scope';
import { InMemoryExchangeScopeStore } from '../exchange-scope/adapters/in-memory-exchange-scope-store';
import { ExchangeScopeProductService } from './exchange-scope-product.service';

const asOf = '2026-08-15T20:00:00.000Z';

describe('PC-12 ExchangeScopeProductService', () => {
  let product: ExchangeScopeProductService;
  let store: InMemoryExchangeScopeStore;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ExchangeScopeModule],
      providers: [ExchangeScopeProductService],
    }).compile();
    product = moduleRef.get(ExchangeScopeProductService);
    store = moduleRef.get(InMemoryExchangeScopeStore);
    store.clear();
  });

  it('registers, lists, activates, and exposes existing bindings/policies/history', () => {
    const created = product.register({
      workspaceId: 'ws-1',
      venueCode: 'binance',
      displayName: 'Binance paper',
      requestedBy: 'op-1',
      requestedAt: asOf,
      maxActiveSessions: 2,
      modeContext: 'paper',
    });
    expect(created.outcome).toBe('accepted');
    expect(created.scope?.lifecycle.status).toBe('created');
    expect(created.liveVenueAdapter).toBe(false);
    expect(created.venueApiUsed).toBe(false);

    const workspace = product.getWorkspace('ws-1');
    expect(workspace.scopeCount).toBe(1);
    expect(workspace.createdCount).toBe(1);
    expect(workspace.currentActive).toHaveLength(0);
    expect(workspace.venues).toHaveLength(4);

    const activated = product.activate({
      workspaceId: 'ws-1',
      exchangeScopeId: created.exchangeScopeId,
      requestedBy: 'op-1',
      asOf: '2026-08-15T20:01:00.000Z',
    });
    expect(activated.outcome).toBe('accepted');
    expect(activated.scope?.lifecycle.status).toBe('active');
    expect(activated.scope?.lifecycle.actions.canSuspend).toBe(true);

    const renamed = product.rename({
      workspaceId: 'ws-1',
      exchangeScopeId: created.exchangeScopeId,
      displayName: 'Binance cluster',
      updatedBy: 'op-1',
      asOf: '2026-08-15T20:02:00.000Z',
    });
    expect(renamed.outcome).toBe('accepted');
    expect(renamed.scope?.displayName).toBe('Binance cluster');
    expect(renamed.scope?.versions.length).toBeGreaterThan(1);

    const policy = product.publishPolicy({
      workspaceId: 'ws-1',
      exchangeScopeId: created.exchangeScopeId,
      publishedBy: 'op-1',
      limits: {
        maxExposureLabel: 'paper-cap',
        maxOrderNotionalLabel: 'paper-order',
      },
      asOf: '2026-08-15T20:03:00.000Z',
    });
    expect(policy.outcome).toBe('accepted');
    expect(policy.scope?.currentPolicy?.isRiskDecision).toBe(false);
    expect(policy.scope?.currentPolicy?.maxExposureLabel).toBe('paper-cap');

    const bound = product.bindAccount({
      workspaceId: 'ws-1',
      exchangeScopeId: created.exchangeScopeId,
      tradingAccountId: 'paper-account-1',
      requestedBy: 'op-1',
      asOf: '2026-08-15T20:04:00.000Z',
    });
    expect(bound.outcome).toBe('accepted');
    expect(bound.scope?.bindings[0]?.ownsLedger).toBe(false);
    expect(bound.scope?.bindings[0]?.tradingAccountId).toBe('paper-account-1');

    const detail = product.getScope('ws-1', created.exchangeScopeId);
    expect(detail?.history.some((item) => item.kind === 'policy')).toBe(true);
    expect(detail?.history.some((item) => item.kind === 'binding')).toBe(true);
    expect(detail?.metadata?.ownsTradingSession).toBe(false);
    expect(detail?.isRuntime).toBe(false);
    expect(detail?.isTradingSession).toBe(false);

    const page = product.listScopes('ws-1', 'active');
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.displayName).toBe('Binance cluster');
  });

  it('suspends and archives using existing lifecycle transitions', () => {
    const created = product.register({
      workspaceId: 'ws-1',
      venueCode: 'bybit',
      displayName: 'Bybit paper',
      requestedBy: 'op-1',
      requestedAt: asOf,
    });
    product.activate({
      workspaceId: 'ws-1',
      exchangeScopeId: created.exchangeScopeId,
      requestedBy: 'op-1',
      asOf: '2026-08-15T20:01:00.000Z',
    });
    const suspended = product.suspend({
      workspaceId: 'ws-1',
      exchangeScopeId: created.exchangeScopeId,
      requestedBy: 'op-1',
      asOf: '2026-08-15T20:02:00.000Z',
    });
    expect(suspended.outcome).toBe('suspended');
    expect(suspended.scope?.lifecycle.status).toBe('suspended');
    expect(suspended.scope?.lifecycle.blocksNewSessionCapacity).toBe(true);

    const archived = product.archive({
      workspaceId: 'ws-1',
      exchangeScopeId: created.exchangeScopeId,
      requestedBy: 'op-1',
      asOf: '2026-08-15T20:03:00.000Z',
    });
    expect(archived.outcome).toBe('archived');
    expect(archived.scope?.lifecycle.actions.canActivate).toBe(false);

    const renameArchived = product.rename({
      workspaceId: 'ws-1',
      exchangeScopeId: created.exchangeScopeId,
      displayName: 'Should fail',
      updatedBy: 'op-1',
      asOf: '2026-08-15T20:04:00.000Z',
    });
    expect(renameArchived.outcome).toBe('rejected');
    expect(renameArchived.rejectionReasons).toContain('scope_archived');
  });

  it('does not invent a missing scope or a live venue adapter', () => {
    expect(product.getScope('ws-1', 'exchange-scope:missing')).toBeNull();
    expect(product.listVenues().venueApiUsed).toBe(false);
  });
});

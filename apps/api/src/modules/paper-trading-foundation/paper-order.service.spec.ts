import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketSymbolCache } from '../market-data-foundation/market-symbol.cache';
import { PaperOrderAudit } from './paper-order.audit';
import { PaperOrderMarketDataGateway } from './paper-order-market-data';
import { PaperOrderService } from './paper-order.service';
import { InMemoryPaperOrderStore } from './paper-order.store';
import { createPaperTradingAccount } from './paper-trading-account';
import { InMemoryPaperTradingAccountStore } from './paper-trading-account.store';

describe('PaperOrderService (W2-S04-b)', () => {
  let accounts: InMemoryPaperTradingAccountStore;
  let orders: InMemoryPaperOrderStore;
  let symbols: MarketSymbolCache;
  let audit: { record: ReturnType<typeof vi.fn> };
  let service: PaperOrderService;

  beforeEach(() => {
    accounts = new InMemoryPaperTradingAccountStore();
    orders = new InMemoryPaperOrderStore();
    symbols = new MarketSymbolCache();
    audit = { record: vi.fn().mockResolvedValue(undefined) };
    service = new PaperOrderService(
      orders,
      accounts,
      new PaperOrderMarketDataGateway(symbols),
      audit as unknown as PaperOrderAudit,
    );
  });

  async function seedAccount(workspaceId = 'workspace-a') {
    const account = createPaperTradingAccount({
      id: 'pa-1',
      workspaceId,
      ownerId: 'user-1',
      createdAt: '2026-08-26T12:00:00.000Z',
    });
    await accounts.create(account);
    return account;
  }

  function seedSymbol(workspaceId = 'workspace-a') {
    symbols.set(workspaceId, 'connection-1', {
      providerId: 'BINANCE',
      discoveredAt: '2026-08-26T12:00:00.000Z',
      symbols: [
        {
          exchangeSymbol: 'BTCUSDT',
          normalizedSymbol: 'BTC-USDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          tradingStatus: 'TRADING',
          providerId: 'BINANCE',
        },
      ],
    });
  }

  it('creates a Pending order when account and symbol are valid', async () => {
    await seedAccount();
    seedSymbol();
    const created = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-1',
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'LIMIT',
      quantity: '1',
      limitPrice: '50000',
    });
    expect(created.status).toBe('PENDING');
    expect(created.paperAccountId).toBe('pa-1');
    expect(audit.record.mock.calls.map((call) => call[0].outcome)).toContain('paper_order_created');
  });

  it('rejects unknown symbol and missing Paper Account', async () => {
    await expect(
      service.create({
        workspaceId: 'workspace-a',
        actorUserId: 'user-1',
        exchange: 'BINANCE',
        symbol: 'BTC-USDT',
        side: 'BUY',
        orderType: 'MARKET',
        quantity: '1',
      }),
    ).rejects.toThrow(/Paper Account is required/);

    await seedAccount();
    await expect(
      service.create({
        workspaceId: 'workspace-a',
        actorUserId: 'user-1',
        exchange: 'BINANCE',
        symbol: 'DOGE-USDT',
        side: 'BUY',
        orderType: 'MARKET',
        quantity: '1',
      }),
    ).rejects.toThrow(/unknown symbol/);
    expect(audit.record.mock.calls.map((call) => call[0].outcome)).toContain(
      'paper_order_rejected',
    );
  });

  it('cancels Pending orders and isolates by workspace', async () => {
    await seedAccount('workspace-a');
    await seedAccount('workspace-b');
    seedSymbol('workspace-a');
    seedSymbol('workspace-b');

    const a = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-1',
      exchange: 'BINANCE',
      symbol: 'BTCUSDT',
      side: 'SELL',
      orderType: 'MARKET',
      quantity: '2',
    });
    await service.create({
      workspaceId: 'workspace-b',
      actorUserId: 'user-2',
      exchange: 'BINANCE',
      symbol: 'BTCUSDT',
      side: 'BUY',
      orderType: 'MARKET',
      quantity: '1',
    });

    const cancelled = await service.cancel('workspace-a', a.id, 'user-1');
    expect(cancelled.status).toBe('CANCELLED');

    const listedA = await service.list('workspace-a');
    const listedB = await service.list('workspace-b');
    expect(listedA.orders).toHaveLength(1);
    expect(listedB.orders).toHaveLength(1);
    expect(listedA.orders[0]?.id).not.toBe(listedB.orders[0]?.id);
  });
});

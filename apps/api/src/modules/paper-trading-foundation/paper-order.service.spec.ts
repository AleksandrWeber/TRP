import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketSymbolCache } from '../market-data-foundation/market-symbol.cache';
import { MarketTickerCache } from '../market-data-foundation/market-ticker.cache';
import { PaperOrderAudit } from './paper-order.audit';
import { PaperOrderMarketDataGateway } from './paper-order-market-data';
import { PaperOrderService } from './paper-order.service';
import { InMemoryPaperOrderStore } from './paper-order.store';
import { createPaperTradingAccount } from './paper-trading-account';
import { InMemoryPaperTradingAccountStore } from './paper-trading-account.store';
import { seedKnownSymbolAndTicker } from './paper-trading-test-helpers';

describe('PaperOrderService (W2-S04-b)', () => {
  let accounts: InMemoryPaperTradingAccountStore;
  let orders: InMemoryPaperOrderStore;
  let symbols: MarketSymbolCache;
  let tickers: MarketTickerCache;
  let audit: { record: ReturnType<typeof vi.fn> };
  let service: PaperOrderService;

  beforeEach(() => {
    accounts = new InMemoryPaperTradingAccountStore();
    orders = new InMemoryPaperOrderStore();
    symbols = new MarketSymbolCache();
    tickers = new MarketTickerCache();
    audit = { record: vi.fn().mockResolvedValue(undefined) };
    service = new PaperOrderService(
      orders,
      accounts,
      new PaperOrderMarketDataGateway(symbols, tickers),
      audit as unknown as PaperOrderAudit,
    );
  });

  async function seedAccount(workspaceId = 'workspace-a') {
    const account = createPaperTradingAccount({
      id: `pa-${workspaceId}`,
      workspaceId,
      ownerId: 'user-1',
      createdAt: '2026-08-26T12:00:00.000Z',
    });
    await accounts.create(account);
    return account;
  }

  it('creates a Pending order when account and symbol are valid', async () => {
    await seedAccount();
    seedKnownSymbolAndTicker(symbols, tickers, 'workspace-a');
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
  });

  it('cancels Pending orders and isolates by workspace', async () => {
    await seedAccount('workspace-a');
    await seedAccount('workspace-b');
    seedKnownSymbolAndTicker(symbols, tickers, 'workspace-a');
    seedKnownSymbolAndTicker(symbols, tickers, 'workspace-b');

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
    expect((await service.list('workspace-a')).orders).toHaveLength(1);
    expect((await service.list('workspace-b')).orders).toHaveLength(1);
  });
});

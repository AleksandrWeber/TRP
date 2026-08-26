import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketSymbolCache } from '../market-data-foundation/market-symbol.cache';
import { MarketTickerCache } from '../market-data-foundation/market-ticker.cache';
import type { WorkspaceAccessService } from '../workspace';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { PaperExecutionAudit } from './paper-execution.audit';
import { PaperExecutionService } from './paper-execution.service';
import { InMemoryPaperFillStore } from './paper-fill.store';
import { PaperOrderAudit } from './paper-order.audit';
import { PaperOrderMarketDataGateway } from './paper-order-market-data';
import { PaperOrderService } from './paper-order.service';
import { InMemoryPaperOrderStore } from './paper-order.store';
import { PaperTradingAccountAudit } from './paper-trading-account.audit';
import { PaperTradingAccountService } from './paper-trading-account.service';
import { InMemoryPaperTradingAccountStore } from './paper-trading-account.store';
import { PaperTradingFoundationController } from './paper-trading-foundation.controller';

export function seedKnownSymbolAndTicker(
  symbols: MarketSymbolCache,
  tickers: MarketTickerCache,
  workspaceId: string,
  options?: { lastPrice?: string; bid?: string; ask?: string; freshness?: string },
) {
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
  tickers.set(workspaceId, 'connection-1', 'BTCUSDT', {
    providerId: 'BINANCE',
    exchangeSymbol: 'BTCUSDT',
    retrievedAt: '2026-08-26T12:00:00.000Z',
    ticker: {
      normalizedSymbol: 'BTC-USDT',
      lastPrice: options?.lastPrice ?? '50000',
      bid: options?.bid ?? '49990',
      ask: options?.ask ?? '50010',
      changePercent24h: '1',
      high24h: '51000',
      low24h: '49000',
      volume24h: '1000',
      exchangeTimestamp: '2026-08-26T12:00:00.000Z',
      retrievalTimestamp: '2026-08-26T12:00:00.000Z',
      providerId: 'BINANCE',
      freshness: (options?.freshness as 'FRESH') ?? 'FRESH',
    },
  });
}

export function buildPaperTradingTestStack(options?: { denyWorkspaceB?: boolean }) {
  const accounts = new InMemoryPaperTradingAccountStore();
  const orders = new InMemoryPaperOrderStore();
  const fills = new InMemoryPaperFillStore();
  const symbols = new MarketSymbolCache();
  const tickers = new MarketTickerCache();
  const gateway = new PaperOrderMarketDataGateway(symbols, tickers);
  const accountAudit = { record: vi.fn().mockResolvedValue(undefined) };
  const orderAudit = { record: vi.fn().mockResolvedValue(undefined) };
  const executionAudit = { record: vi.fn().mockResolvedValue(undefined) };
  const accountService = new PaperTradingAccountService(
    accounts,
    accountAudit as unknown as PaperTradingAccountAudit,
  );
  const orderService = new PaperOrderService(
    orders,
    accounts,
    gateway,
    orderAudit as unknown as PaperOrderAudit,
  );
  const executionService = new PaperExecutionService(
    orders,
    fills,
    gateway,
    executionAudit as unknown as PaperExecutionAudit,
  );
  const trader: AuthUser = {
    userId: 'trader-1',
    email: 'trader@example.com',
    displayName: 'Trader',
    role: Role.Trader,
  };
  const workspaceAccess = {
    assertMember: vi.fn((workspaceId: string, userId: string) => {
      if (
        options?.denyWorkspaceB !== false &&
        workspaceId === 'workspace-b' &&
        userId === trader.userId
      ) {
        throw new Error('not a member');
      }
    }),
  };
  const controller = new PaperTradingFoundationController(
    accountService,
    orderService,
    executionService,
    workspaceAccess as unknown as WorkspaceAccessService,
  );
  return {
    accounts,
    orders,
    fills,
    symbols,
    tickers,
    gateway,
    accountService,
    orderService,
    executionService,
    executionAudit,
    controller,
    trader,
    workspaceAccess,
  };
}

describe('paper trading test helpers', () => {
  beforeEach(() => {
    // placeholder so the helper file is a valid suite if imported alone
  });
  it('builds a stack', () => {
    const stack = buildPaperTradingTestStack();
    expect(stack.controller).toBeTruthy();
  });
});

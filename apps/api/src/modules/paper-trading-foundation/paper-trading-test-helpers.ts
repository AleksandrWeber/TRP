import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
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
import { PaperPortfolioAudit } from './paper-portfolio.audit';
import { PaperPortfolioService } from './paper-portfolio.service';
import { PaperTradingAccountAudit } from './paper-trading-account.audit';
import { PaperTradingAccountService } from './paper-trading-account.service';
import { InMemoryPaperTradingAccountStore } from './paper-trading-account.store';
import { PaperTradingFoundationController } from './paper-trading-foundation.controller';

// Explicit Mock<> keeps declaration emit portable under Vitest 4 (avoids deep @vitest/spy paths).
type AuditRecordMock = { record: Mock<(payload: { outcome: string }) => Promise<void>> };

export type PaperTradingTestStack = {
  accounts: InMemoryPaperTradingAccountStore;
  orders: InMemoryPaperOrderStore;
  fills: InMemoryPaperFillStore;
  symbols: MarketSymbolCache;
  tickers: MarketTickerCache;
  gateway: PaperOrderMarketDataGateway;
  accountService: PaperTradingAccountService;
  orderService: PaperOrderService;
  executionService: PaperExecutionService;
  portfolioService: PaperPortfolioService;
  portfolioAudit: AuditRecordMock;
  executionAudit: AuditRecordMock;
  controller: PaperTradingFoundationController;
  trader: AuthUser;
  workspaceAccess: {
    assertMember: Mock<(workspaceId: string, userId: string) => void>;
  };
};

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

export function buildPaperTradingTestStack(options?: {
  denyWorkspaceB?: boolean;
}): PaperTradingTestStack {
  const accounts = new InMemoryPaperTradingAccountStore();
  const orders = new InMemoryPaperOrderStore();
  const fills = new InMemoryPaperFillStore();
  const symbols = new MarketSymbolCache();
  const tickers = new MarketTickerCache();
  const gateway = new PaperOrderMarketDataGateway(symbols, tickers);
  const accountAudit: AuditRecordMock = {
    record: vi.fn<(payload: { outcome: string }) => Promise<void>>().mockResolvedValue(undefined),
  };
  const orderAudit: AuditRecordMock = {
    record: vi.fn<(payload: { outcome: string }) => Promise<void>>().mockResolvedValue(undefined),
  };
  const executionAudit: AuditRecordMock = {
    record: vi.fn<(payload: { outcome: string }) => Promise<void>>().mockResolvedValue(undefined),
  };
  const portfolioAudit: AuditRecordMock = {
    record: vi.fn<(payload: { outcome: string }) => Promise<void>>().mockResolvedValue(undefined),
  };
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
  const portfolioService = new PaperPortfolioService(
    accounts,
    fills,
    gateway,
    portfolioAudit as unknown as PaperPortfolioAudit,
  );
  const executionService = new PaperExecutionService(
    orders,
    fills,
    accounts,
    gateway,
    portfolioService,
    executionAudit as unknown as PaperExecutionAudit,
  );
  const trader: AuthUser = {
    userId: 'trader-1',
    email: 'trader@example.com',
    displayName: 'Trader',
    role: Role.Trader,
  };
  const workspaceAccess: PaperTradingTestStack['workspaceAccess'] = {
    assertMember: vi.fn<(workspaceId: string, userId: string) => void>((workspaceId, userId) => {
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
    portfolioService,
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
    portfolioService,
    portfolioAudit,
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

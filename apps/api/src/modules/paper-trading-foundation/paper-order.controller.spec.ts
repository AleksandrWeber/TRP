import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '../auth/jwt.strategy';
import { Role } from '../identity/role';
import { MarketSymbolCache } from '../market-data-foundation/market-symbol.cache';
import type { WorkspaceAccessService } from '../workspace';
import { PaperOrderAudit } from './paper-order.audit';
import { PaperOrderMarketDataGateway } from './paper-order-market-data';
import { PaperOrderService } from './paper-order.service';
import { InMemoryPaperOrderStore } from './paper-order.store';
import { PaperTradingAccountAudit } from './paper-trading-account.audit';
import { PaperTradingAccountService } from './paper-trading-account.service';
import { InMemoryPaperTradingAccountStore } from './paper-trading-account.store';
import { PaperTradingFoundationController } from './paper-trading-foundation.controller';

describe('PaperTradingFoundationController orders (W2-S04-b)', () => {
  let controller: PaperTradingFoundationController;
  let symbols: MarketSymbolCache;
  let workspaceAccess: { assertMember: ReturnType<typeof vi.fn> };

  const trader: AuthUser = {
    userId: 'trader-1',
    email: 'trader@example.com',
    displayName: 'Trader',
    role: Role.Trader,
  };

  beforeEach(() => {
    const accounts = new InMemoryPaperTradingAccountStore();
    const orders = new InMemoryPaperOrderStore();
    symbols = new MarketSymbolCache();
    const accountAudit = { record: vi.fn().mockResolvedValue(undefined) };
    const orderAudit = { record: vi.fn().mockResolvedValue(undefined) };
    const accountService = new PaperTradingAccountService(
      accounts,
      accountAudit as unknown as PaperTradingAccountAudit,
    );
    const orderService = new PaperOrderService(
      orders,
      accounts,
      new PaperOrderMarketDataGateway(symbols),
      orderAudit as unknown as PaperOrderAudit,
    );
    workspaceAccess = {
      assertMember: vi.fn((workspaceId: string, userId: string) => {
        if (workspaceId === 'workspace-b' && userId === trader.userId) {
          throw new Error('not a member');
        }
      }),
    };
    controller = new PaperTradingFoundationController(
      accountService,
      orderService,
      workspaceAccess as unknown as WorkspaceAccessService,
    );
  });

  async function seed() {
    await controller.createAccount({ user: trader }, 'workspace-a', {});
    symbols.set('workspace-a', 'connection-1', {
      providerId: 'BINANCE',
      discoveredAt: '2026-08-26T12:00:00.000Z',
      symbols: [
        {
          exchangeSymbol: 'ETHUSDT',
          normalizedSymbol: 'ETH-USDT',
          baseAsset: 'ETH',
          quoteAsset: 'USDT',
          tradingStatus: 'TRADING',
          providerId: 'BINANCE',
        },
      ],
    });
  }

  it('creates, lists, reviews, and cancels Paper Orders', async () => {
    await seed();
    const created = await controller.createOrder({ user: trader }, 'workspace-a', {
      exchange: 'BINANCE',
      symbol: 'ETH-USDT',
      side: 'BUY',
      orderType: 'LIMIT',
      quantity: '3',
      limitPrice: '2000',
    });
    expect(created.status).toBe('PENDING');

    const listed = await controller.listOrders({ user: trader }, 'workspace-a');
    expect(listed.orders).toHaveLength(1);

    const reviewed = await controller.getOrder({ user: trader }, 'workspace-a', created.id);
    expect(reviewed.id).toBe(created.id);

    const cancelled = await controller.cancelOrder({ user: trader }, 'workspace-a', created.id);
    expect(cancelled.status).toBe('CANCELLED');
  });

  it('returns validation errors for unknown symbols and denies foreign workspace', async () => {
    await seed();
    await expect(
      controller.createOrder({ user: trader }, 'workspace-a', {
        exchange: 'BINANCE',
        symbol: 'UNKNOWN',
        side: 'BUY',
        orderType: 'MARKET',
        quantity: '1',
      }),
    ).rejects.toThrow(/unknown symbol/);

    await expect(controller.listOrders({ user: trader }, 'workspace-b')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

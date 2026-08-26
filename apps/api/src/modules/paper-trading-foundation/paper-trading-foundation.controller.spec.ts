import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildPaperTradingTestStack, seedKnownSymbolAndTicker } from './paper-trading-test-helpers';
import { PaperTradingFoundationController } from './paper-trading-foundation.controller';
import type { AuthUser } from '../auth/jwt.strategy';

describe('PaperTradingFoundationController (W2-S04-a)', () => {
  let controller: PaperTradingFoundationController;
  let trader: AuthUser;

  beforeEach(() => {
    const stack = buildPaperTradingTestStack();
    controller = stack.controller;
    trader = stack.trader;
  });

  it('creates and returns the workspace Paper Account projection', async () => {
    const created = await controller.createAccount({ user: trader }, 'workspace-a', {
      startingBalance: '100000',
    });
    expect(created.status).toBe('ACTIVE');
    expect(created.account?.baseCurrency).toBe('USD');
    expect(created.account?.startingBalance).toBe('100000');

    const viewed = await controller.getAccount({ user: trader }, 'workspace-a');
    expect(viewed.account?.id).toBe(created.account?.id);
  });

  it('rejects duplicate create for the same workspace', async () => {
    await controller.createAccount({ user: trader }, 'workspace-a', {});
    await expect(controller.createAccount({ user: trader }, 'workspace-a', {})).rejects.toThrow(
      /already exists/,
    );
  });

  it('denies foreign workspace access', async () => {
    await expect(controller.getAccount({ user: trader }, 'workspace-b')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('disables an account for Disabled UI state', async () => {
    await controller.createAccount({ user: trader }, 'workspace-a', {});
    const disabled = await controller.disableAccount({ user: trader }, 'workspace-a');
    expect(disabled.status).toBe('DISABLED');
    expect(disabled.account?.status).toBe('DISABLED');
  });
});

describe('PaperTradingFoundationController orders (W2-S04-b)', () => {
  let stack: ReturnType<typeof buildPaperTradingTestStack>;

  beforeEach(() => {
    stack = buildPaperTradingTestStack();
  });

  async function seed() {
    await stack.controller.createAccount({ user: stack.trader }, 'workspace-a', {});
    seedKnownSymbolAndTicker(stack.symbols, stack.tickers, 'workspace-a');
  }

  it('creates, lists, reviews, and cancels Paper Orders', async () => {
    await seed();
    const created = await stack.controller.createOrder({ user: stack.trader }, 'workspace-a', {
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'LIMIT',
      quantity: '3',
      limitPrice: '60000',
    });
    expect(created.status).toBe('PENDING');
    const listed = await stack.controller.listOrders({ user: stack.trader }, 'workspace-a');
    expect(listed.orders).toHaveLength(1);
    const cancelled = await stack.controller.cancelOrder(
      { user: stack.trader },
      'workspace-a',
      created.id,
    );
    expect(cancelled.status).toBe('CANCELLED');
  });

  it('returns validation errors for unknown symbols and denies foreign workspace', async () => {
    await seed();
    await expect(
      stack.controller.createOrder({ user: stack.trader }, 'workspace-a', {
        exchange: 'BINANCE',
        symbol: 'UNKNOWN',
        side: 'BUY',
        orderType: 'MARKET',
        quantity: '1',
      }),
    ).rejects.toThrow(/unknown symbol/);
    await expect(
      stack.controller.listOrders({ user: stack.trader }, 'workspace-b'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

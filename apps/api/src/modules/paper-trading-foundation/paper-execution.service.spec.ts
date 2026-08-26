import { beforeEach, describe, expect, it } from 'vitest';
import { buildPaperTradingTestStack, seedKnownSymbolAndTicker } from './paper-trading-test-helpers';

describe('PaperExecutionService (W2-S04-c)', () => {
  let stack: ReturnType<typeof buildPaperTradingTestStack>;

  beforeEach(() => {
    stack = buildPaperTradingTestStack();
  });

  async function seedPendingMarketBuy() {
    await stack.controller.createAccount({ user: stack.trader }, 'workspace-a', {});
    seedKnownSymbolAndTicker(stack.symbols, stack.tickers, 'workspace-a');
    return stack.controller.createOrder({ user: stack.trader }, 'workspace-a', {
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'MARKET',
      quantity: '1',
    });
  }

  it('executes a Pending order into a Paper Fill using Market Data', async () => {
    const order = await seedPendingMarketBuy();
    const result = await stack.executionService.execute({
      workspaceId: 'workspace-a',
      actorUserId: stack.trader.userId,
      orderId: order.id,
    });
    expect(result.status).toBe('FILLED');
    expect(result.fill.executionPrice).toBe('50010');
    expect(result.fill.paperOrderId).toBe(order.id);
    expect(result.fill).not.toHaveProperty('exchangeExecutionId');

    const listed = await stack.executionService.listFills('workspace-a');
    expect(listed.fills).toHaveLength(1);
    const outcomes = stack.executionAudit.record.mock.calls.map((call) => call[0].outcome);
    expect(outcomes).toEqual(['paper_fill_created', 'paper_execution_completed']);
  });

  it('rejects execution when Market Data is unavailable', async () => {
    await stack.controller.createAccount({ user: stack.trader }, 'workspace-a', {});
    seedKnownSymbolAndTicker(stack.symbols, stack.tickers, 'workspace-a');
    // wipe tickers only
    stack.tickers.clear('workspace-a', 'connection-1', 'BTCUSDT');
    const order = await stack.controller.createOrder({ user: stack.trader }, 'workspace-a', {
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'MARKET',
      quantity: '1',
    });
    await expect(
      stack.executionService.execute({
        workspaceId: 'workspace-a',
        actorUserId: stack.trader.userId,
        orderId: order.id,
      }),
    ).rejects.toThrow(/unavailable/i);
  });

  it('isolates fills by workspace', async () => {
    await stack.controller.createAccount({ user: stack.trader }, 'workspace-a', {});
    seedKnownSymbolAndTicker(stack.symbols, stack.tickers, 'workspace-a');
    const order = await stack.controller.createOrder({ user: stack.trader }, 'workspace-a', {
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'MARKET',
      quantity: '1',
    });
    await stack.executionService.execute({
      workspaceId: 'workspace-a',
      actorUserId: stack.trader.userId,
      orderId: order.id,
    });
    expect((await stack.executionService.listFills('workspace-b')).fills).toHaveLength(0);
  });
});

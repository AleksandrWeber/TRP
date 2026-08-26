import { describe, expect, it } from 'vitest';
import { buildPaperTradingTestStack, seedKnownSymbolAndTicker } from './paper-trading-test-helpers';

/**
 * W2-S04-e Close evidence: end-to-end Paper Trading walkthrough against existing services.
 * No new product APIs or domain behavior — validates the assembled package journey.
 */
describe('W2-S04 Paper Trading Walkthrough (Close evidence)', () => {
  it('completes Sign-in-gated journey: Account → Order → Match → Fill → Position → Portfolio → PnL → History', async () => {
    const stack = buildPaperTradingTestStack();
    const headers = 'workspace-a';
    const user = { user: stack.trader };

    // Create Paper Account
    const account = await stack.controller.createAccount(user, headers, {
      startingBalance: '100000',
    });
    expect(account.status).toBe('ACTIVE');
    expect(account.account?.currentBalance).toBe('100000');

    seedKnownSymbolAndTicker(stack.symbols, stack.tickers, 'workspace-a', {
      lastPrice: '50500',
      ask: '50010',
      bid: '49990',
    });

    // Create Paper Order (Pending intent)
    const order = await stack.controller.createOrder(user, headers, {
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'MARKET',
      quantity: '1',
    });
    expect(order.status).toBe('PENDING');

    // Execute Matching → Observe Paper Fill
    const execution = await stack.controller.executeOrder(user, headers, order.id);
    expect(execution.status).toBe('FILLED');
    expect(execution.fill.executionPrice).toBe('50010');
    expect(execution.fill).not.toHaveProperty('exchangeExecutionId');

    const fills = await stack.controller.listFills(user, headers);
    expect(fills.fills).toHaveLength(1);

    // Observe Paper Position
    const positions = await stack.controller.listPositions(user, headers);
    expect(positions.positions).toHaveLength(1);
    expect(positions.positions[0].side).toBe('LONG');
    expect(positions.positions[0].quantity).toBe('1');

    // Observe Portfolio + Paper Balance
    const portfolio = await stack.controller.getPortfolio(user, headers);
    expect(portfolio.cashBalance).toBe('49990');
    expect(portfolio.honesty).toMatch(/Not exchange assets/i);

    const refreshed = await stack.controller.getAccount(user, headers);
    expect(refreshed.account?.currentBalance).toBe('49990');

    // Observe Realized / Unrealized PnL
    const pnl = await stack.controller.getPnL(user, headers);
    expect(pnl.realizedPnL).toBe('0');
    expect(pnl.unrealizedPnL).toBe('490');
    expect(pnl.honesty).toMatch(/Not exchange assets|Not real capital/i);

    // Review Execution History
    const history = await stack.controller.getExecutionHistory(user, headers);
    expect(history.entries).toHaveLength(1);
    expect(history.entries[0].kind).toBe('FILL');
    expect(history.honesty).toMatch(/Not exchange execution/i);

    // Honesty: no exchange order APIs / Live Trading coupling in isolation suite is separate;
    // walkthrough proves paper-only projections after fill.
    expect(stack.executionAudit.record).toHaveBeenCalled();
    expect(stack.portfolioAudit.record).toHaveBeenCalled();
  });

  it('denies cross-workspace paper observation', async () => {
    const stack = buildPaperTradingTestStack();
    await stack.controller.createAccount({ user: stack.trader }, 'workspace-a', {});
    seedKnownSymbolAndTicker(stack.symbols, stack.tickers, 'workspace-a');
    const order = await stack.controller.createOrder({ user: stack.trader }, 'workspace-a', {
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'MARKET',
      quantity: '1',
    });
    await stack.controller.executeOrder({ user: stack.trader }, 'workspace-a', order.id);

    await expect(
      stack.controller.getPortfolio({ user: stack.trader }, 'workspace-b'),
    ).rejects.toThrow(/workspace access denied|Forbidden/i);
  });
});

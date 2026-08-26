import { beforeEach, describe, expect, it } from 'vitest';
import { buildPaperTradingTestStack, seedKnownSymbolAndTicker } from './paper-trading-test-helpers';

describe('PaperPortfolioService (W2-S04-d)', () => {
  let stack: ReturnType<typeof buildPaperTradingTestStack>;

  beforeEach(() => {
    stack = buildPaperTradingTestStack();
  });

  it('derives position, portfolio, PnL, balance, and history from fills', async () => {
    seedKnownSymbolAndTicker(stack.symbols, stack.tickers, 'workspace-a', {
      lastPrice: '50500',
      ask: '50010',
      bid: '49990',
    });
    await stack.accountService.create({
      workspaceId: 'workspace-a',
      ownerId: 'trader-1',
      startingBalance: '100000',
    });
    const order = await stack.orderService.create({
      workspaceId: 'workspace-a',
      actorUserId: 'trader-1',
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'MARKET',
      quantity: '1',
    });
    await stack.executionService.execute({
      workspaceId: 'workspace-a',
      actorUserId: 'trader-1',
      orderId: order.id,
    });

    const positions = await stack.portfolioService.getPositions('workspace-a');
    expect(positions.positions).toHaveLength(1);
    expect(positions.positions[0].side).toBe('LONG');
    expect(positions.positions[0].quantity).toBe('1');
    expect(positions.positions[0].unrealizedPnL).toBe('490');

    const portfolio = await stack.portfolioService.getPortfolio('workspace-a');
    // MARKET BUY fills at ask 50010 => cash = 100000 - 50010
    expect(portfolio.cashBalance).toBe('49990');
    expect(portfolio.realizedPnL).toBe('0');
    // mark 50500 - entry 50010
    expect(portfolio.unrealizedPnL).toBe('490');

    const pnl = await stack.portfolioService.getPnL('workspace-a');
    expect(pnl.realizedPnL).toBe('0');
    expect(pnl.unrealizedPnL).toBe('490');

    const account = await stack.accounts.findByWorkspace('workspace-a');
    expect(account?.currentBalance).toBe('49990');

    const history = await stack.portfolioService.getExecutionHistory('workspace-a');
    expect(history.entries).toHaveLength(1);
    expect(history.entries[0].kind).toBe('FILL');

    expect(stack.portfolioAudit.record).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'paper_position_created' }),
    );
    expect(stack.portfolioAudit.record).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'paper_balance_updated' }),
    );
    expect(stack.portfolioAudit.record).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'paper_portfolio_updated' }),
    );
    expect(stack.portfolioAudit.record).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'paper_pnl_updated' }),
    );
  });

  it('isolates portfolio by workspace', async () => {
    seedKnownSymbolAndTicker(stack.symbols, stack.tickers, 'workspace-a');
    await stack.accountService.create({
      workspaceId: 'workspace-a',
      ownerId: 'trader-1',
    });
    await stack.accountService.create({
      workspaceId: 'workspace-b',
      ownerId: 'trader-2',
    });
    const order = await stack.orderService.create({
      workspaceId: 'workspace-a',
      actorUserId: 'trader-1',
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      orderType: 'MARKET',
      quantity: '1',
    });
    await stack.executionService.execute({
      workspaceId: 'workspace-a',
      actorUserId: 'trader-1',
      orderId: order.id,
    });

    expect((await stack.portfolioService.getPositions('workspace-b')).positions).toHaveLength(0);
    expect((await stack.portfolioService.getPortfolio('workspace-b')).cashBalance).toBe('100000');
  });
});

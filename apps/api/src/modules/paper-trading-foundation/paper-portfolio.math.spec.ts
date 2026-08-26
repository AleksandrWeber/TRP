import { describe, expect, it } from 'vitest';
import { createPaperFill, type PaperFill } from './paper-fill';
import { derivePortfolioFromFills, markPortfolio } from './paper-portfolio.math';

function fill(
  partial: Partial<PaperFill> & Pick<PaperFill, 'id' | 'side' | 'quantity' | 'executionPrice'>,
): PaperFill {
  return createPaperFill({
    id: partial.id,
    workspaceId: 'workspace-a',
    paperAccountId: 'pa-1',
    paperOrderId: `order-${partial.id}`,
    exchange: 'BINANCE',
    symbol: 'BTC-USDT',
    side: partial.side,
    quantity: partial.quantity,
    executionPrice: partial.executionPrice,
    executionTime: partial.executionTime ?? '2026-08-26T12:00:00.000Z',
    createdAt: partial.createdAt ?? '2026-08-26T12:00:00.000Z',
  });
}

describe('Paper portfolio math (W2-S04-d)', () => {
  it('opens a long position and reduces cash on BUY', () => {
    const state = derivePortfolioFromFills('100000', [
      fill({
        id: 'f1',
        side: 'BUY',
        quantity: '1',
        executionPrice: '50000',
      }),
    ]);
    expect(state.cashBalance).toBe('50000');
    expect(state.positions).toHaveLength(1);
    expect(state.positions[0]).toMatchObject({
      side: 'LONG',
      quantity: '1',
      averageEntryPrice: '50000',
    });
    expect(state.realizedPnL).toBe('0');
  });

  it('realizes PnL on partial SELL and marks unrealized from Market Data', () => {
    const state = derivePortfolioFromFills('100000', [
      fill({
        id: 'f1',
        side: 'BUY',
        quantity: '2',
        executionPrice: '50000',
        executionTime: '2026-08-26T12:00:00.000Z',
        createdAt: '2026-08-26T12:00:00.000Z',
      }),
      fill({
        id: 'f2',
        side: 'SELL',
        quantity: '1',
        executionPrice: '51000',
        executionTime: '2026-08-26T12:01:00.000Z',
        createdAt: '2026-08-26T12:01:00.000Z',
      }),
    ]);
    expect(state.cashBalance).toBe('51000'); // 100000 - 100000 + 51000
    expect(state.realizedPnL).toBe('1000');
    expect(state.positions[0]).toMatchObject({
      side: 'LONG',
      quantity: '1',
      averageEntryPrice: '50000',
    });

    const marked = markPortfolio(state, () => '52000');
    expect(marked.unrealizedPnL).toBe('2000');
    expect(marked.totalPnL).toBe('3000');
    expect(marked.equity).toBe('103000'); // cash 51000 + 1*52000
  });

  it('leaves unrealized null when mark is unavailable', () => {
    const state = derivePortfolioFromFills('100000', [
      fill({ id: 'f1', side: 'BUY', quantity: '1', executionPrice: '50000' }),
    ]);
    const marked = markPortfolio(state, () => null);
    expect(marked.unrealizedPnL).toBeNull();
    expect(marked.equity).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import type { TradeResult } from './domain/trade-result';
import { TradeHistory } from './trade-history';

const RESULT: TradeResult = {
  positionId: 'position-1',
  action: 'OPEN_LONG',
  price: 100,
  quantity: 1,
  realizedPnL: 0,
  timestamp: '2026-01-01T00:00:00.000Z',
};

describe('TradeHistory (US010)', () => {
  it('records executed trades in order and isolates workspaces', () => {
    const history = new TradeHistory();
    history.record('ws-1', RESULT);
    history.record('ws-1', { ...RESULT, action: 'CLOSE_LONG', price: 110, realizedPnL: 10 });
    history.record('ws-2', { ...RESULT, positionId: 'other' });

    expect(history.list('ws-1').map((result) => result.action)).toEqual([
      'OPEN_LONG',
      'CLOSE_LONG',
    ]);
    expect(history.list('ws-2')).toHaveLength(1);
  });

  it('does not accept ignored decisions as trade history', () => {
    const history = new TradeHistory();
    expect(() =>
      history.record('ws-1', {
        ...RESULT,
        positionId: null,
        action: 'IGNORED',
        quantity: 0,
      }),
    ).toThrow(/not trade history/);
    expect(history.list('ws-1')).toEqual([]);
  });
});

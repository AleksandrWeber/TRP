import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Timeframe } from '../market-data-domain';
import { createSignalResult, type SignalType } from '../signal-engine';
import { PnLCalculator } from './pnl-calculator';
import { PositionManager } from './position-manager';
import { PositionRegistry } from './position-registry';
import { TradeHistory } from './trade-history';

function signal(value: SignalType) {
  return createSignalResult({
    strategyId: 'strategy-1',
    symbol: 'BTCUSDT',
    timeframe: Timeframe.H1,
    signal: value,
    confidence: 1,
    timestamp: '2026-01-01T00:00:00.000Z',
    metadata: {},
  });
}

describe('PositionManager (US010)', () => {
  let positions: PositionRegistry;
  let history: TradeHistory;
  let manager: PositionManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T00:00:00.000Z'));
    positions = new PositionRegistry();
    history = new TradeHistory();
    manager = new PositionManager(positions, history, new PnLCalculator());
  });

  afterEach(() => vi.useRealTimers());

  it('BUY opens one LONG using the strategy quantity and ticker price', () => {
    const result = manager.execute('ws-1', signal('BUY'), 100, 2);

    expect(result).toMatchObject({
      action: 'OPEN_LONG',
      price: 100,
      quantity: 2,
      realizedPnL: 0,
      timestamp: '2026-02-01T00:00:00.000Z',
    });
    expect(result.positionId).not.toBeNull();
    expect(positions.list('ws-1')).toEqual([
      expect.objectContaining({
        id: result.positionId,
        strategyId: 'strategy-1',
        symbol: 'BTCUSDT',
        side: 'LONG',
        quantity: 2,
        entryPrice: 100,
        status: 'OPEN',
      }),
    ]);
    expect(history.list('ws-1')).toEqual([result]);
  });

  it('a second BUY is ignored and does not enter history', () => {
    manager.execute('ws-1', signal('BUY'), 100, 1);
    const ignored = manager.execute('ws-1', signal('BUY'), 101, 1);

    expect(ignored).toMatchObject({
      positionId: null,
      action: 'IGNORED',
      price: 101,
      quantity: 0,
      realizedPnL: 0,
    });
    expect(positions.list('ws-1')).toHaveLength(1);
    expect(history.list('ws-1')).toHaveLength(1);
  });

  it('SELL closes the LONG and realizes simple profit', () => {
    const opened = manager.execute('ws-1', signal('BUY'), 100, 2);
    const closed = manager.execute('ws-1', signal('SELL'), 112.5, 999);

    expect(closed).toMatchObject({
      positionId: opened.positionId,
      action: 'CLOSE_LONG',
      price: 112.5,
      quantity: 2,
      realizedPnL: 25,
    });
    expect(positions.list('ws-1')[0]).toMatchObject({ status: 'CLOSED' });
    expect(history.list('ws-1')).toHaveLength(2);
  });

  it('SELL without an open position is ignored', () => {
    expect(manager.execute('ws-1', signal('SELL'), 100, 1)).toMatchObject({
      positionId: null,
      action: 'IGNORED',
    });
    expect(history.list('ws-1')).toEqual([]);
  });

  it('HOLD is ignored whether or not a position exists', () => {
    expect(manager.execute('ws-1', signal('HOLD'), 100, 1).action).toBe('IGNORED');
    manager.execute('ws-1', signal('BUY'), 100, 1);
    expect(manager.execute('ws-1', signal('HOLD'), 105, 1).action).toBe('IGNORED');
    expect(positions.getOpenByStrategy('ws-1', 'strategy-1')).not.toBeNull();
  });

  it('keeps the one-position rule scoped to each workspace', () => {
    expect(manager.execute('ws-1', signal('BUY'), 100, 1).action).toBe('OPEN_LONG');
    expect(manager.execute('ws-2', signal('BUY'), 100, 1).action).toBe('OPEN_LONG');
    expect(positions.list('ws-1')).toHaveLength(1);
    expect(positions.list('ws-2')).toHaveLength(1);
  });
});

import { describe, expect, it } from 'vitest';
import type { PaperPosition } from './domain/paper-position';
import { PositionRegistry } from './position-registry';

const POSITION: PaperPosition = {
  id: 'position-1',
  strategyId: 'strategy-1',
  symbol: 'BTCUSDT',
  side: 'LONG',
  quantity: 1,
  entryPrice: 100,
  entryTime: '2026-01-01T00:00:00.000Z',
  status: 'OPEN',
};

describe('PositionRegistry (US010)', () => {
  it('stores, resolves, and closes a position', () => {
    const registry = new PositionRegistry();
    registry.add('ws-1', POSITION);

    expect(registry.getOpenByStrategy('ws-1', 'strategy-1')).toEqual(POSITION);
    expect(registry.close('ws-1', 'position-1')).toMatchObject({ status: 'CLOSED' });
    expect(registry.getOpenByStrategy('ws-1', 'strategy-1')).toBeNull();
    expect(registry.list('ws-1')).toEqual([{ ...POSITION, status: 'CLOSED' }]);
  });

  it('enforces one open position per strategy', () => {
    const registry = new PositionRegistry();
    registry.add('ws-1', POSITION);
    expect(() => registry.add('ws-1', { ...POSITION, id: 'position-2' })).toThrow(/already exists/);
  });

  it('isolates positions between workspaces', () => {
    const registry = new PositionRegistry();
    registry.add('ws-1', POSITION);
    registry.add('ws-2', POSITION);

    expect(registry.list('ws-1')).toHaveLength(1);
    expect(registry.list('ws-2')).toHaveLength(1);
    registry.close('ws-1', POSITION.id);
    expect(registry.getOpenByStrategy('ws-2', POSITION.strategyId)).not.toBeNull();
  });

  it('rejects duplicate ids and invalid close operations', () => {
    const registry = new PositionRegistry();
    registry.add('ws-1', POSITION);
    expect(() => registry.add('ws-1', POSITION)).toThrow(/already registered/);
    expect(() => registry.close('ws-1', 'missing')).toThrow(/not found/);
    registry.close('ws-1', POSITION.id);
    expect(() => registry.close('ws-1', POSITION.id)).toThrow(/already closed/);
  });
});

import { describe, expect, it } from 'vitest';
import { M2_PAPER_FILL_CONFIGURATION } from '../../execution-adapter';
import { PositionSide, type Position } from './position';
import { valuePosition, type PositionMarkPrice } from './position-valuation';

const position: Position = Object.freeze({
  id: 'position-1',
  workspaceId: 'workspace-1',
  paperAccountId: 'account-1',
  instrument: 'BTCUSDT',
  side: PositionSide.LONG,
  quantity: '2',
  averageEntryPrice: '100',
  costBasis: '200',
  realizedPnl: '25',
  version: 3,
  lastAppliedFillId: 'fill-3',
  lastAppliedFillSequence: 3,
  occurredAt: '2026-07-18T12:00:00.000Z',
  recordedAt: '2026-07-18T12:00:01.000Z',
});

const mark: PositionMarkPrice = Object.freeze({
  workspaceId: 'workspace-1',
  instrument: 'BTCUSDT',
  marketStreamId: 'mark-stream-1',
  marketEventId: 'mark-10',
  marketSequence: 10,
  markPrice: '125.125',
  occurredAt: '2026-07-18T12:01:00.000Z',
  recordedAt: '2026-07-18T12:01:01.000Z',
});

describe('US175 — Position valuation', () => {
  it('derives decimal market value and unrealized PnL without changing accounting', () => {
    const valuation = valuePosition(position, mark, null, M2_PAPER_FILL_CONFIGURATION.precision);

    expect(valuation.marketValue).toBe('250.25');
    expect(valuation.unrealizedPnl).toBe('50.25');
    expect(valuation.costBasis).toBe('200');
    expect(valuation.realizedPnl).toBe('25');
    expect(valuation.positionVersion).toBe(3);
    expect(position.costBasis).toBe('200');
  });

  it('versions marks and rejects duplicate, out-of-order, or cross-stream updates', () => {
    const current = valuePosition(position, mark, null, M2_PAPER_FILL_CONFIGURATION.precision);
    expect(() =>
      valuePosition(position, mark, current, M2_PAPER_FILL_CONFIGURATION.precision),
    ).toThrow('duplicate or out of order');
    expect(() =>
      valuePosition(
        position,
        { ...mark, marketEventId: 'mark-9', marketSequence: 9 },
        current,
        M2_PAPER_FILL_CONFIGURATION.precision,
      ),
    ).toThrow('duplicate or out of order');
    expect(() =>
      valuePosition(
        position,
        { ...mark, marketStreamId: 'other-stream', marketEventId: 'mark-11', marketSequence: 11 },
        current,
        M2_PAPER_FILL_CONFIGURATION.precision,
      ),
    ).toThrow('cannot switch');
  });
});

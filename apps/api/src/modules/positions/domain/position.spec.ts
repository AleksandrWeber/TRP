import { describe, expect, it } from 'vitest';
import { M2_PAPER_FILL_CONFIGURATION } from '../../execution-adapter';
import type { PaperFill } from '../../execution-engine';
import { applyFillToPosition, PositionSide } from './position';

const recordedAt = '2026-07-18T19:00:00.100Z';

function fill(
  id: string,
  side: 'buy' | 'sell',
  quantity: string,
  price: string,
  grossNotional: string,
): PaperFill {
  return Object.freeze({
    id,
    workspaceId: 'ws-us172',
    orderId: `order-${id}`,
    paperAccountId: 'account-us172',
    tradingSessionId: 'session-us172',
    adapterOrderId: `adapter-${id}`,
    adapterFillId: `adapter-fill-${id}`,
    sequence: 1,
    instrument: 'BTCUSDT',
    side,
    price,
    quantity,
    grossNotional,
    fee: '0.1',
    executionContextHash: 'execution-context',
    configurationId: M2_PAPER_FILL_CONFIGURATION.configurationId,
    configurationVersion: M2_PAPER_FILL_CONFIGURATION.version,
    configurationHash: M2_PAPER_FILL_CONFIGURATION.hash,
    occurredAt: '2026-07-18T19:00:00.000Z',
    recordedAt,
  });
}

describe('US172 — long-only Position accounting', () => {
  it('derives quantity, average entry, and cost basis from immutable buy Fills', () => {
    const first = applyFillToPosition(
      null,
      fill('fill-1', 'buy', '2', '100', '200'),
      M2_PAPER_FILL_CONFIGURATION.precision,
      recordedAt,
    );
    const second = applyFillToPosition(
      first.position,
      fill('fill-2', 'buy', '1', '130', '130'),
      M2_PAPER_FILL_CONFIGURATION.precision,
      recordedAt,
    );

    expect(first.position).toMatchObject({
      side: PositionSide.LONG,
      quantity: '2',
      averageEntryPrice: '100',
      costBasis: '200',
      realizedPnl: '0',
      version: 1,
      lastAppliedFillSequence: 1,
    });
    expect(second.position).toMatchObject({
      quantity: '3',
      averageEntryPrice: '110',
      costBasis: '330',
      version: 2,
      lastAppliedFillSequence: 2,
      lastAppliedFillId: 'fill-2',
    });
  });

  it('realizes PnL from a sell and returns to flat without rounding residue', () => {
    const opened = applyFillToPosition(
      null,
      fill('fill-open', 'buy', '2', '100', '200'),
      M2_PAPER_FILL_CONFIGURATION.precision,
      recordedAt,
    );
    const partial = applyFillToPosition(
      opened.position,
      fill('fill-sell-1', 'sell', '1', '120', '120'),
      M2_PAPER_FILL_CONFIGURATION.precision,
      recordedAt,
    );
    const closed = applyFillToPosition(
      partial.position,
      fill('fill-sell-2', 'sell', '1', '90', '90'),
      M2_PAPER_FILL_CONFIGURATION.precision,
      recordedAt,
    );

    expect(partial).toMatchObject({
      costBasisReleased: '100',
      realizedPnlDelta: '20',
      position: {
        side: PositionSide.LONG,
        quantity: '1',
        costBasis: '100',
        realizedPnl: '20',
      },
    });
    expect(closed).toMatchObject({
      costBasisReleased: '100',
      realizedPnlDelta: '-10',
      position: {
        side: PositionSide.FLAT,
        quantity: '0',
        averageEntryPrice: '0',
        costBasis: '0',
        realizedPnl: '10',
      },
    });
  });

  it('rejects a sell that exceeds the open long quantity', () => {
    const opened = applyFillToPosition(
      null,
      fill('fill-open', 'buy', '1', '100', '100'),
      M2_PAPER_FILL_CONFIGURATION.precision,
      recordedAt,
    );
    expect(() =>
      applyFillToPosition(
        opened.position,
        fill('fill-over', 'sell', '2', '100', '200'),
        M2_PAPER_FILL_CONFIGURATION.precision,
        recordedAt,
      ),
    ).toThrow(/cannot exceed/);
  });

  it('rejects a forged Fill whose notional does not match price and quantity', () => {
    expect(() =>
      applyFillToPosition(
        null,
        fill('fill-forged', 'buy', '2', '100', '201'),
        M2_PAPER_FILL_CONFIGURATION.precision,
        recordedAt,
      ),
    ).toThrow(/gross notional/);
  });
});

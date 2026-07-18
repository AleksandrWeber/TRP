import { describe, expect, it } from 'vitest';
import { M2_PAPER_FILL_CONFIGURATION } from '../execution-adapter';
import type { PaperFill } from '../execution-engine';
import { rebuildPositions } from './accounting-rebuild.service';

function fill(overrides: Partial<PaperFill>): PaperFill {
  return Object.freeze({
    id: 'fill-buy',
    workspaceId: 'workspace-1',
    orderId: 'order-buy',
    paperAccountId: 'account-1',
    tradingSessionId: 'session-1',
    adapterOrderId: 'adapter-order-buy',
    adapterFillId: 'adapter-fill-buy',
    sequence: 1,
    instrument: 'BTCUSDT',
    side: 'buy',
    price: '100',
    quantity: '2',
    grossNotional: '200',
    fee: '0.2',
    executionContextHash: 'context',
    configurationId: M2_PAPER_FILL_CONFIGURATION.configurationId,
    configurationVersion: M2_PAPER_FILL_CONFIGURATION.version,
    configurationHash: M2_PAPER_FILL_CONFIGURATION.hash,
    occurredAt: '2026-07-18T12:00:00.000Z',
    recordedAt: '2026-07-18T12:00:01.000Z',
    ...overrides,
  });
}

describe('US177 — deterministic accounting rebuild', () => {
  it('rebuilds Position state identically from any input ordering without mutating facts', () => {
    const buy = fill({});
    const sell = fill({
      id: 'fill-sell',
      orderId: 'order-sell',
      adapterOrderId: 'adapter-order-sell',
      adapterFillId: 'adapter-fill-sell',
      side: 'sell',
      price: '120',
      quantity: '1',
      grossNotional: '120',
      fee: '0.12',
      occurredAt: '2026-07-18T12:02:00.000Z',
      recordedAt: '2026-07-18T12:02:01.000Z',
    });
    const facts = Object.freeze([sell, buy]);
    const first = rebuildPositions(facts, M2_PAPER_FILL_CONFIGURATION, '2026-07-18T12:03:00.000Z');
    const second = rebuildPositions(
      [buy, sell],
      M2_PAPER_FILL_CONFIGURATION,
      '2026-07-18T12:03:00.000Z',
    );

    expect(first).toEqual(second);
    expect(first[0]).toMatchObject({
      quantity: '1',
      costBasis: '100',
      realizedPnl: '20',
      version: 2,
    });
    expect(facts).toEqual([sell, buy]);
  });
});

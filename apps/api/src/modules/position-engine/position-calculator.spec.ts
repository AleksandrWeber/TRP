import { describe, expect, it } from 'vitest';
import {
  closePosition,
  increasePosition,
  markPosition,
  openPosition,
  reducePosition,
} from './domain/position';
import { PositionCalculator } from './position-calculator';
import { PositionInvalidStateError } from './position-errors';

const NOW = '2026-07-20T12:00:00.000Z';

function sampleLong(
  overrides: Partial<{ quantity: string; entryPrice: string; markPrice: string }> = {},
) {
  return openPosition({
    id: 'pos-1',
    portfolioId: 'pf-1',
    symbol: 'BTC-USD',
    side: 'LONG',
    quantity: overrides.quantity ?? '2',
    entryPrice: overrides.entryPrice ?? '100',
    markPrice: overrides.markPrice ?? '100',
    createdAt: NOW,
    updatedAt: NOW,
  });
}

describe('US205 PositionCalculator', () => {
  it('calculates average entry price after increase', () => {
    expect(
      PositionCalculator.calculateAverageEntryPrice({
        currentQuantity: '2',
        currentAverageEntryPrice: '100',
        addQuantity: '2',
        addPrice: '120',
      }),
    ).toBe('110');
  });

  it('calculates long and short unrealized PnL from mark price', () => {
    const longPos = sampleLong({ markPrice: '110' });
    expect(PositionCalculator.calculateUnrealizedPnL(longPos)).toBe('20');

    const short = openPosition({
      id: 'pos-2',
      portfolioId: 'pf-1',
      symbol: 'ETH-USD',
      side: 'SHORT',
      quantity: '3',
      entryPrice: '50',
      markPrice: '40',
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(PositionCalculator.calculateUnrealizedPnL(short)).toBe('30');
  });

  it('calculates realized PnL for reduce', () => {
    expect(
      PositionCalculator.calculateRealizedPnL({
        side: 'LONG',
        averageEntryPrice: '100',
        exitPrice: '110',
        quantity: '1',
      }),
    ).toBe('10');
    expect(
      PositionCalculator.calculateRealizedPnL({
        side: 'SHORT',
        averageEntryPrice: '100',
        exitPrice: '90',
        quantity: '2',
      }),
    ).toBe('20');
  });

  it('calculates exposure, position value, and return percent', () => {
    const position = sampleLong({ quantity: '2', markPrice: '110' });
    expect(PositionCalculator.calculateExposure(position)).toBe('220');
    expect(PositionCalculator.calculatePositionValue(position)).toBe('220');
    expect(PositionCalculator.calculateReturnPercent(position)).toBe('0.1');
  });

  it('recalculates average entry only on increase and realized only on reduce', () => {
    let position = sampleLong();
    position = increasePosition(position, {
      quantity: '2',
      price: '120',
      updatedAt: NOW,
    });
    expect(position.averageEntryPrice).toBe('110');
    expect(position.realizedPnL).toBe('0');

    const reduced = reducePosition(position, {
      quantity: '1',
      price: '130',
      updatedAt: NOW,
    });
    expect(reduced.position.averageEntryPrice).toBe('110');
    expect(reduced.realizedDelta).toBe('20');
    expect(reduced.position.realizedPnL).toBe('20');
    expect(reduced.position.status).toBe('PARTIALLY_CLOSED');
  });

  it('closes position and zeroes quantity', () => {
    const closed = closePosition(sampleLong(), { price: '105', updatedAt: NOW });
    expect(closed.position.status).toBe('CLOSED');
    expect(closed.position.quantity).toBe('0');
    expect(closed.position.closedAt).toBe(NOW);
    expect(closed.realizedDelta).toBe('10');
  });

  it('rejects mutations on closed positions', () => {
    const closed = closePosition(sampleLong(), { price: '100', updatedAt: NOW }).position;
    expect(() => increasePosition(closed, { quantity: '1', price: '100', updatedAt: NOW })).toThrow(
      /immutable/,
    );
    expect(() => markPosition(closed, { markPrice: '101', updatedAt: NOW })).toThrow(/immutable/);
  });

  it('never allows negative quantity', () => {
    const position = sampleLong({ quantity: '1' });
    expect(() => reducePosition(position, { quantity: '2', price: '100', updatedAt: NOW })).toThrow(
      /exceeds/,
    );
  });

  it('assertValid rejects closed positions with remaining quantity', () => {
    const broken = {
      ...sampleLong(),
      status: 'CLOSED' as const,
      quantity: '1',
      closedAt: NOW,
    };
    expect(() => PositionCalculator.assertValid(broken)).toThrow(PositionInvalidStateError);
  });
});

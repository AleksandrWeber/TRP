import { describe, expect, it } from 'vitest';
import { ExposureCalculator } from './exposure-calculator';
import type { RiskOrderRequest } from './domain/risk-evaluation-context';

const baseOrder = (overrides: Partial<RiskOrderRequest> = {}): RiskOrderRequest =>
  Object.freeze({
    id: 'ord-1',
    portfolioId: 'pf-1',
    symbol: 'BTC-USD',
    side: 'BUY',
    type: 'LIMIT',
    quantity: '2',
    requestedPrice: '100',
    ...overrides,
  });

describe('US207 ExposureCalculator', () => {
  it('computes order notional from quantity × price', () => {
    expect(ExposureCalculator.orderNotional(baseOrder())).toBe('200');
  });

  it('returns null notional when no price is available', () => {
    expect(
      ExposureCalculator.orderNotional(baseOrder({ requestedPrice: null, referencePrice: null })),
    ).toBeNull();
  });

  it('uses referencePrice when requestedPrice is absent', () => {
    expect(
      ExposureCalculator.orderNotional(baseOrder({ requestedPrice: null, referencePrice: '50' })),
    ).toBe('100');
  });

  it('sums open exposure and projects with new order', () => {
    const positions = [
      { id: 'p1', symbol: 'ETH-USD', side: 'LONG', quantity: '1', exposure: '100' },
      { id: 'p2', symbol: 'BTC-USD', side: 'LONG', quantity: '1', exposure: '50' },
    ];
    expect(ExposureCalculator.totalOpenExposure(positions)).toBe('150');
    expect(ExposureCalculator.projectedExposure(positions, baseOrder())).toBe('350');
  });

  it('computes exposure percent of equity', () => {
    const percent = ExposureCalculator.exposurePercentOfEquity(
      [],
      baseOrder({ quantity: '1', requestedPrice: '50' }),
      '100',
    );
    expect(percent).toBe('50');
  });
});

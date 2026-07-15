import { describe, expect, it } from 'vitest';
import { RiskService } from './risk.service';

describe('RiskService', () => {
  const risk = new RiskService();

  it('rejects hold signals', () => {
    const result = risk.evaluate({
      deploymentStatus: 'active',
      signalType: 'hold',
      positionSide: 'flat',
      quantity: 0,
      price: 100,
      maxNotional: 1000,
    });
    expect(result.approved).toBe(false);
  });

  it('approves buy when flat', () => {
    const result = risk.evaluate({
      deploymentStatus: 'active',
      signalType: 'buy',
      positionSide: 'flat',
      quantity: 0.01,
      price: 100_000,
      maxNotional: 1000,
    });
    expect(result.approved).toBe(true);
  });

  it('rejects buy when already long', () => {
    const result = risk.evaluate({
      deploymentStatus: 'active',
      signalType: 'buy',
      positionSide: 'long',
      quantity: 0.01,
      price: 100_000,
      maxNotional: 1000,
    });
    expect(result.approved).toBe(false);
  });

  it('rejects when deployment stopped', () => {
    const result = risk.evaluate({
      deploymentStatus: 'stopped',
      signalType: 'buy',
      positionSide: 'flat',
      quantity: 0.01,
      price: 100,
      maxNotional: 1000,
    });
    expect(result.approved).toBe(false);
  });
});

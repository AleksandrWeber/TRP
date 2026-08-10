import { describe, expect, it } from 'vitest';
import {
  createTacticalEnvelope,
  parseTacticalEnvelope,
  serializeTacticalEnvelope,
} from './tactical-envelope';

describe('RC-19 Epic 3 — Tactical Envelope schema stub', () => {
  it('creates an immutable structural envelope', () => {
    const envelope = createTacticalEnvelope({
      timeframe: '5m',
      allowedStrategyVersion: 'trend-v1',
      allowedParameterRanges: {
        riskPerTrade: { min: 0.5, max: 2, step: 0.5 },
      },
      riskProfileReference: 'risk-profile:paper-default',
      allowedSymbols: ['BTCUSDT'],
      allowedTimeframes: ['5m', '15m'],
    });

    expect(Object.isFrozen(envelope)).toBe(true);
    expect(envelope.timeframe).toBe('5m');
    expect(envelope.allowedStrategyVersion).toBe('trend-v1');
    expect(envelope.allowedParameterRanges?.riskPerTrade).toEqual({
      min: 0.5,
      max: 2,
      step: 0.5,
    });
    expect(envelope.riskProfileReference).toBe('risk-profile:paper-default');
  });

  it('round-trips through serialize/parse without semantic validation', () => {
    const original = createTacticalEnvelope({
      timeframe: '15m',
      allowedStrategyVersion: 'mean-reversion-v2',
      allowedParameterRanges: { maxPositions: { min: 1, max: 3 } },
      riskProfileReference: 'risk-profile:conservative',
    });

    const serialized = serializeTacticalEnvelope(original);
    const restored = parseTacticalEnvelope(serialized);

    expect(restored).toEqual(original);
    expect(Object.isFrozen(restored)).toBe(true);
  });

  it('treats null/undefined as absent envelope', () => {
    expect(parseTacticalEnvelope(null)).toBeNull();
    expect(parseTacticalEnvelope(undefined)).toBeNull();
    expect(serializeTacticalEnvelope(null)).toBeNull();
  });

  it('rejects non-object persisted values', () => {
    expect(() => parseTacticalEnvelope('5m')).toThrow(/must be a JSON object/);
    expect(() => parseTacticalEnvelope([])).toThrow(/must be a JSON object/);
  });

  it('creates an empty structural stub when no fields are supplied', () => {
    const envelope = createTacticalEnvelope();
    expect(Object.isFrozen(envelope)).toBe(true);
    expect(envelope).toEqual({});
  });
});

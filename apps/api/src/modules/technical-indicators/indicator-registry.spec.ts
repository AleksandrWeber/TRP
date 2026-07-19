import { describe, expect, it } from 'vitest';
import {
  DuplicateIndicatorError,
  InvalidIndicatorInputError,
  UnknownIndicatorError,
} from './domain/technical-indicators.error';
import { EmaIndicator } from './indicators/ema-indicator';
import type { SeriesIndicator } from './indicators/series-indicator';
import { SmaIndicator } from './indicators/sma-indicator';
import { IndicatorRegistry } from './indicator-registry';

function stubIndicator(id: string): SeriesIndicator {
  return {
    id: () => id,
    name: () => `Stub ${id}`,
    calculate: () => {
      throw new Error('not implemented');
    },
  };
}

describe('IndicatorRegistry (US011)', () => {
  it('registers indicators and lists their ids in order', () => {
    const registry = new IndicatorRegistry();
    registry.register(new SmaIndicator());
    registry.register(new EmaIndicator());

    expect(registry.list()).toEqual(['sma', 'ema']);
  });

  it('resolves an indicator by id', () => {
    const registry = new IndicatorRegistry();
    const sma = new SmaIndicator();
    registry.register(sma);
    registry.register(new EmaIndicator());

    expect(registry.resolve('sma')).toBe(sma);
    expect(registry.resolve('ema').id()).toBe('ema');
  });

  it('reports availability via has()', () => {
    const registry = new IndicatorRegistry();
    registry.register(new SmaIndicator());

    expect(registry.has('sma')).toBe(true);
    expect(registry.has('rsi')).toBe(false);
  });

  it('throws the domain error for an unknown indicator id', () => {
    const registry = new IndicatorRegistry();
    registry.register(new SmaIndicator());

    expect(() => registry.resolve('rsi')).toThrow(UnknownIndicatorError);
    expect(() => registry.resolve('rsi')).toThrow(/rsi.*sma/);
  });

  it('rejects duplicate ids', () => {
    const registry = new IndicatorRegistry();
    registry.register(new SmaIndicator());

    expect(() => registry.register(new SmaIndicator())).toThrow(DuplicateIndicatorError);
    expect(() => registry.register(stubIndicator('sma'))).toThrow(/already registered/);
  });

  it('rejects empty ids', () => {
    const registry = new IndicatorRegistry();

    expect(() => registry.register(stubIndicator('  '))).toThrow(InvalidIndicatorInputError);
  });

  it('returns a frozen id list', () => {
    const registry = new IndicatorRegistry();
    registry.register(new SmaIndicator());

    expect(Object.isFrozen(registry.list())).toBe(true);
  });
});

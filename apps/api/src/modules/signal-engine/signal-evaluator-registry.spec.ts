import { describe, expect, it } from 'vitest';
import { UnknownStrategyEvaluatorError } from './domain/signal-engine.error';
import { DummyStrategyEvaluator } from './evaluators/dummy-strategy-evaluator';
import type { StrategyEvaluator } from './evaluators/strategy-evaluator';
import { SignalEvaluatorRegistry } from './signal-evaluator-registry';

function stubEvaluator(id: string): StrategyEvaluator {
  return {
    id,
    evaluate: async () => ({ signal: 'HOLD', confidence: 0, metadata: {} }),
  };
}

describe('SignalEvaluatorRegistry (US009)', () => {
  it('registers evaluators and lists their ids in order', () => {
    const registry = new SignalEvaluatorRegistry();
    registry.register(new DummyStrategyEvaluator());
    registry.register(stubEvaluator('rsi'));

    expect(registry.list()).toEqual(['dummy', 'rsi']);
  });

  it('resolves an evaluator by id', () => {
    const registry = new SignalEvaluatorRegistry();
    const dummy = new DummyStrategyEvaluator();
    registry.register(dummy);
    registry.register(stubEvaluator('rsi'));

    expect(registry.resolve('dummy')).toBe(dummy);
    expect(registry.resolve('rsi').id).toBe('rsi');
  });

  it('resolves the first registered evaluator as the default', () => {
    const registry = new SignalEvaluatorRegistry();
    const dummy = new DummyStrategyEvaluator();
    registry.register(dummy);
    registry.register(stubEvaluator('rsi'));

    expect(registry.resolve()).toBe(dummy);
  });

  it('throws the domain error for an unknown evaluator id', () => {
    const registry = new SignalEvaluatorRegistry();
    registry.register(new DummyStrategyEvaluator());

    expect(() => registry.resolve('macd')).toThrow(UnknownStrategyEvaluatorError);
    expect(() => registry.resolve('macd')).toThrow(/macd.*dummy/);
  });

  it('rejects duplicate and empty ids', () => {
    const registry = new SignalEvaluatorRegistry();
    registry.register(new DummyStrategyEvaluator());

    expect(() => registry.register(new DummyStrategyEvaluator())).toThrow(/already registered/);
    expect(() => registry.register(stubEvaluator('  '))).toThrow(/must not be empty/);
  });

  it('fails resolving the default when nothing is registered', () => {
    expect(() => new SignalEvaluatorRegistry().resolve()).toThrow(/No StrategyEvaluator/);
  });
});

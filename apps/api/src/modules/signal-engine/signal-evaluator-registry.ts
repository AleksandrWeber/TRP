import { Injectable } from '@nestjs/common';
import { UnknownStrategyEvaluatorError } from './domain/signal-engine.error';
import type { StrategyEvaluator } from './evaluators/strategy-evaluator';

/**
 * Registry of StrategyEvaluator implementations (US009).
 * Mirrors the MarketDataProviderRegistry policy (US006): consumers resolve
 * evaluators by id and never reference an implementation. The first
 * registered evaluator is the default used when a strategy does not request
 * a specific one.
 */
@Injectable()
export class SignalEvaluatorRegistry {
  private readonly evaluators = new Map<string, StrategyEvaluator>();
  private defaultId: string | null = null;

  register(evaluator: StrategyEvaluator): void {
    const id = evaluator.id.trim();
    if (id === '') {
      throw new Error('StrategyEvaluator id must not be empty');
    }
    if (this.evaluators.has(id)) {
      throw new Error(`StrategyEvaluator already registered: ${id}`);
    }
    this.evaluators.set(id, evaluator);
    if (this.defaultId === null) {
      this.defaultId = id;
    }
  }

  /**
   * Resolve an evaluator by id, or the default when no id is requested.
   * An unknown id is a domain error (the strategy configuration names an
   * evaluator that does not exist) — mapped to 400 by the engine filter.
   */
  resolve(id?: string): StrategyEvaluator {
    if (id === undefined) {
      if (this.defaultId === null) {
        throw new Error('No StrategyEvaluator registered');
      }
      return this.evaluators.get(this.defaultId) as StrategyEvaluator;
    }
    const evaluator = this.evaluators.get(id);
    if (!evaluator) {
      throw new UnknownStrategyEvaluatorError(id, this.list());
    }
    return evaluator;
  }

  list(): ReadonlyArray<string> {
    return Object.freeze([...this.evaluators.keys()]);
  }
}

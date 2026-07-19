import type { StrategyParameters } from '../strategies';
import { assertPeriod, InvalidIndicatorPeriodError } from '../technical-indicators';
import { InvalidEvaluatorConfigError } from './evaluator-config.error';

/**
 * Shared strategy.parameters readers for the US014 evaluators.
 * Period-like values keep the exact US012 behaviour (non-numbers and
 * non-positive-integers raise InvalidIndicatorPeriodError → 400); other
 * numeric values raise InvalidEvaluatorConfigError → 400. Both fail fast on
 * NaN and Infinity so evaluators never decide on garbage configuration.
 */

/** Read a positive-integer period parameter, falling back to a default. */
export function readPeriodParameter(
  parameters: StrategyParameters,
  key: string,
  defaultValue: number,
): number {
  const requested = parameters[key];
  if (requested === undefined) return defaultValue;
  if (typeof requested !== 'number') {
    throw new InvalidIndicatorPeriodError(Number(requested));
  }
  assertPeriod(requested);
  return requested;
}

/** Read a finite numeric parameter, falling back to a default. */
export function readNumberParameter(
  parameters: StrategyParameters,
  key: string,
  defaultValue: number,
): number {
  const requested = parameters[key];
  if (requested === undefined) return defaultValue;
  if (typeof requested !== 'number' || !Number.isFinite(requested)) {
    throw new InvalidEvaluatorConfigError(
      `Evaluator parameter '${key}' must be a finite number, received: ${String(requested)}`,
    );
  }
  return requested;
}

/** Round to 4 decimals — the confidence precision shared by all evaluators. */
export function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

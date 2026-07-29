import type { StrategyDeployment } from '../../strategy-deployment';
import { SignalIntentDirection } from './signal-intent';
import { candleMatchesDeployment, type EvaluationCandle } from './evaluation-candle';

export const EvaluationOutcomeKind = {
  SIGNAL_INTENT: 'SIGNAL_INTENT',
  NO_ACTION: 'NO_ACTION',
} as const;

export type EvaluationOutcomeKind =
  (typeof EvaluationOutcomeKind)[keyof typeof EvaluationOutcomeKind];

export type SignalIntentEvaluationDecision = Readonly<{
  kind: typeof EvaluationOutcomeKind.SIGNAL_INTENT;
  direction: SignalIntentDirection;
  confidence: number | null;
  reason: string;
}>;

export type NoActionEvaluationDecision = Readonly<{
  kind: typeof EvaluationOutcomeKind.NO_ACTION;
  reason: string;
}>;

export type EvaluationDecision = SignalIntentEvaluationDecision | NoActionEvaluationDecision;

/**
 * Deterministic Runtime evaluator (US219 / ADR-014 / ADR-018).
 * Pure function of approved Deployment parameters + admitted closed candle.
 * Does not use wall-clock, research Signal Engine, or Evaluation Scheduler.
 *
 * Parameter contract (optional, immutable on Deployment):
 * - `action`: `buy` | `sell` | `hold` — explicit fixture/simple deployments
 * - `compareCloseToOpen`: `true` — bullish close→buy, bearish→sell, else hold
 * Default without actionable parameters: NO_ACTION.
 */
export function decideRuntimeEvaluation(input: {
  deployment: StrategyDeployment;
  candle: EvaluationCandle;
}): EvaluationDecision {
  candleMatchesDeployment(input.candle, input.deployment);

  const parameters = input.deployment.parameters;
  const explicit = readExplicitAction(parameters.action);
  if (explicit !== null) {
    if (explicit === 'hold') {
      return noAction('deployment action=hold');
    }
    const direction = explicit === 'buy' ? SignalIntentDirection.BUY : SignalIntentDirection.SELL;
    return signal(
      direction,
      readConfidence(parameters.confidence),
      `deployment action=${explicit}`,
    );
  }

  if (parameters.compareCloseToOpen === true) {
    if (input.candle.close > input.candle.open) {
      return signal(
        SignalIntentDirection.BUY,
        readConfidence(parameters.confidence),
        'close > open',
      );
    }
    if (input.candle.close < input.candle.open) {
      return signal(
        SignalIntentDirection.SELL,
        readConfidence(parameters.confidence),
        'close < open',
      );
    }
    return noAction('close equals open');
  }

  return noAction('no actionable deployment parameters');
}

function signal(
  direction: SignalIntentDirection,
  confidence: number | null,
  reason: string,
): SignalIntentEvaluationDecision {
  return Object.freeze({
    kind: EvaluationOutcomeKind.SIGNAL_INTENT,
    direction,
    confidence,
    reason,
  });
}

function noAction(reason: string): NoActionEvaluationDecision {
  return Object.freeze({
    kind: EvaluationOutcomeKind.NO_ACTION,
    reason,
  });
}

function readExplicitAction(value: unknown): 'buy' | 'sell' | 'hold' | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new Error('deployment parameters.action must be a string when provided');
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'buy' || normalized === 'sell' || normalized === 'hold') {
    return normalized;
  }
  throw new Error('deployment parameters.action must be buy, sell, or hold');
}

function readConfidence(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('deployment parameters.confidence must be a finite number');
  }
  if (value < 0 || value > 1) {
    throw new Error('deployment parameters.confidence must be in [0, 1]');
  }
  return Math.round(value * 10_000) / 10_000;
}

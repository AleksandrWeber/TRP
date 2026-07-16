import { calculateEma } from '../indicators/ema';
import type { OhlcvBar, Strategy, StrategyParams, StrategySignal } from '../types';

export type EmaCrossoverParams = {
  emaFast: number;
  emaSlow: number;
};

export function emaCrossoverSignals(
  bars: OhlcvBar[],
  params: EmaCrossoverParams,
): StrategySignal[] {
  const closes = bars.map((b) => b.close);
  const fast = calculateEma(closes, params.emaFast);
  const slow = calculateEma(closes, params.emaSlow);

  const signals: StrategySignal[] = [];

  for (let i = 1; i < bars.length; i++) {
    const prevDiff = fast[i - 1] - slow[i - 1];
    const currDiff = fast[i] - slow[i];

    let signal: StrategySignal['signal'] = 'hold';
    if (prevDiff <= 0 && currDiff > 0) {
      signal = 'buy';
    } else if (prevDiff >= 0 && currDiff < 0) {
      signal = 'sell';
    }

    signals.push({ timestamp: bars[i].timestamp, signal });
  }

  return signals;
}

/** Evaluate signal on the last complete bar (requires at least emaSlow + 2 bars). */
export function latestEmaCrossoverSignal(
  bars: OhlcvBar[],
  params: EmaCrossoverParams,
): StrategySignal {
  const signals = emaCrossoverSignals(bars, params);
  const last = signals.at(-1);
  if (!last) {
    const bar = bars.at(-1);
    return { timestamp: bar?.timestamp ?? Date.now(), signal: 'hold' };
  }
  return last;
}

export const DEFAULT_EMA_CROSSOVER_PARAMS: EmaCrossoverParams = {
  emaFast: 20,
  emaSlow: 50,
};

export const STRATEGY_ID = 'ema-crossover';
export const STRATEGY_VERSION = '1.0.0';

function requirePositiveInteger(value: unknown, name: string): number {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value as number;
}

export const EMA_CROSSOVER_STRATEGY: Strategy<EmaCrossoverParams> = {
  id: STRATEGY_ID,
  version: STRATEGY_VERSION,
  defaultParams: DEFAULT_EMA_CROSSOVER_PARAMS,
  normalizeParams(params: StrategyParams = DEFAULT_EMA_CROSSOVER_PARAMS): EmaCrossoverParams {
    const emaFast = requirePositiveInteger(params.emaFast, 'emaFast');
    const emaSlow = requirePositiveInteger(params.emaSlow, 'emaSlow');
    if (emaFast >= emaSlow) {
      throw new Error('emaFast must be less than emaSlow');
    }
    return { emaFast, emaSlow };
  },
  minBars(params: EmaCrossoverParams) {
    return params.emaSlow + 2;
  },
  signals(bars: OhlcvBar[], params: EmaCrossoverParams) {
    return emaCrossoverSignals(bars, params);
  },
};

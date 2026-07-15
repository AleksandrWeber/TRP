import { calculateEma } from '../indicators/ema';
import type { OhlcvBar, StrategyParams } from '../types';

export type Signal = 'buy' | 'sell' | 'hold';

export function emaCrossoverSignals(
  bars: OhlcvBar[],
  params: StrategyParams,
): Array<{ timestamp: number; signal: Signal }> {
  const closes = bars.map((b) => b.close);
  const fast = calculateEma(closes, params.emaFast);
  const slow = calculateEma(closes, params.emaSlow);

  const signals: Array<{ timestamp: number; signal: Signal }> = [];

  for (let i = 1; i < bars.length; i++) {
    const prevDiff = fast[i - 1] - slow[i - 1];
    const currDiff = fast[i] - slow[i];

    let signal: Signal = 'hold';
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
  params: StrategyParams,
): { timestamp: number; signal: Signal } {
  const signals = emaCrossoverSignals(bars, params);
  const last = signals.at(-1);
  if (!last) {
    const bar = bars.at(-1);
    return { timestamp: bar?.timestamp ?? Date.now(), signal: 'hold' };
  }
  return last;
}

export const DEFAULT_EMA_CROSSOVER_PARAMS: StrategyParams = {
  emaFast: 20,
  emaSlow: 50,
};

export const STRATEGY_ID = 'ema-crossover';
export const STRATEGY_VERSION = '1.0.0';

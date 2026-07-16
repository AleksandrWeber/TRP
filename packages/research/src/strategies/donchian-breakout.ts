import type { OhlcvBar, Strategy, StrategyParams, StrategySignal } from '../types';

export type DonchianParams = {
  channelPeriod: number;
};

export const DEFAULT_DONCHIAN_PARAMS: DonchianParams = {
  channelPeriod: 20,
};

export const DONCHIAN_STRATEGY_ID = 'donchian-breakout';
export const DONCHIAN_STRATEGY_VERSION = '1.0.0';

function requireChannelPeriod(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 2) {
    throw new Error('channelPeriod must be an integer greater than or equal to 2');
  }
  return value as number;
}

export class DonchianStrategy implements Strategy<DonchianParams> {
  readonly id = DONCHIAN_STRATEGY_ID;
  readonly version = DONCHIAN_STRATEGY_VERSION;
  readonly defaultParams = DEFAULT_DONCHIAN_PARAMS;

  normalizeParams(params: StrategyParams = DEFAULT_DONCHIAN_PARAMS): DonchianParams {
    return { channelPeriod: requireChannelPeriod(params.channelPeriod) };
  }

  minBars(params: DonchianParams): number {
    return params.channelPeriod + 1;
  }

  signals(bars: OhlcvBar[], params: DonchianParams): StrategySignal[] {
    const signals: StrategySignal[] = [];

    for (let index = params.channelPeriod; index < bars.length; index += 1) {
      const channelBars = bars.slice(index - params.channelPeriod, index);
      const upperChannel = Math.max(...channelBars.map((bar) => bar.high));
      const lowerChannel = Math.min(...channelBars.map((bar) => bar.low));
      const close = bars[index].close;

      const signal = close > upperChannel ? 'buy' : close < lowerChannel ? 'sell' : 'hold';
      signals.push({ timestamp: bars[index].timestamp, signal });
    }

    return signals;
  }
}

export const DONCHIAN_STRATEGY = new DonchianStrategy();

import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateStrategyBodyDto, UpdateStrategyBodyDto } from './strategies.dto';

describe('Strategy configuration DTOs (US005)', () => {
  it('accepts a complete valid configuration', () => {
    const dto = Object.assign(new CreateStrategyBodyDto(), {
      name: 'Momentum',
      tradingPair: 'BTCUSDT',
      timeframe: '15m',
      direction: 'LONG',
      positionSize: 100,
      stopLossPercent: 2,
      takeProfitPercent: 5,
      parameters: { emaFast: 20, emaSlow: 50 },
    });

    expect(validateSync(dto)).toEqual([]);
  });

  it('requires name, tradingPair, timeframe, and direction', () => {
    const errors = validateSync(new CreateStrategyBodyDto());
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['name', 'tradingPair', 'timeframe', 'direction']),
    );
  });

  it('rejects invalid pair, timeframe, direction, risk, and parameter shapes', () => {
    const dto = Object.assign(new CreateStrategyBodyDto(), {
      name: 'Invalid',
      tradingPair: 'btc/usdt',
      timeframe: '30m',
      direction: 'UP',
      positionSize: 0,
      stopLossPercent: -1,
      takeProfitPercent: 101,
      parameters: [],
    });

    const fields = validateSync(dto).map((error) => error.property);
    expect(fields).toEqual(
      expect.arrayContaining([
        'tradingPair',
        'timeframe',
        'direction',
        'positionSize',
        'stopLossPercent',
        'takeProfitPercent',
        'parameters',
      ]),
    );
  });

  it('allows partial valid updates', () => {
    const dto = Object.assign(new UpdateStrategyBodyDto(), {
      timeframe: '4h',
      direction: 'SHORT',
      parameters: { rsi: 14 },
    });

    expect(validateSync(dto)).toEqual([]);
  });
});

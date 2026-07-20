import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import type {
  BollingerBandsInput,
  BollingerBandsResult,
} from './indicators/bollinger-bands-indicator';
import type { MacdInput, MacdResult } from './indicators/macd-indicator';
import { IndicatorRegistry } from './indicator-registry';
import { TechnicalIndicatorsModule } from './technical-indicators.module';

describe('TechnicalIndicatorsModule (US011)', () => {
  async function bootModule() {
    const moduleRef = await Test.createTestingModule({
      imports: [TechnicalIndicatorsModule],
    }).compile();
    await moduleRef.init();
    return moduleRef;
  }

  it('boots standalone — no other module required', async () => {
    const moduleRef = await bootModule();
    expect(moduleRef.get(IndicatorRegistry)).toBeInstanceOf(IndicatorRegistry);
    await moduleRef.close();
  });

  it('registers all indicators out of the box', async () => {
    const moduleRef = await bootModule();

    const registry = moduleRef.get(IndicatorRegistry);
    expect(registry.list()).toEqual(['sma', 'ema', 'rsi', 'macd', 'bollinger']);

    await moduleRef.close();
  });

  it('serves calculations end to end through the registry', async () => {
    const moduleRef = await bootModule();

    const registry = moduleRef.get(IndicatorRegistry);
    const sma = registry.resolve('sma').calculate({ series: [1, 2, 3, 4, 5], period: 3 });
    const ema = registry.resolve('ema').calculate({ series: [1, 2, 3, 4, 5], period: 3 });
    const rsi = registry.resolve('rsi').calculate({ series: [1, 2, 3, 4, 5], period: 3 });
    const macd = registry.resolve<MacdInput, MacdResult>('macd').calculate({
      series: [1, 2, 3, 4, 5],
      fastPeriod: 2,
      slowPeriod: 3,
      signalPeriod: 2,
    });
    const bollinger = registry
      .resolve<BollingerBandsInput, BollingerBandsResult>('bollinger')
      .calculate({ series: [1, 2, 3, 4, 5], period: 3, multiplier: 2 });

    expect(sma.values).toEqual([2, 3, 4]);
    expect(ema.values).toEqual([2, 3, 4]);
    expect(rsi.values).toEqual([100, 100]);
    expect(macd.macd).toEqual([0.5, 0.5]);
    expect(bollinger.middle).toEqual([2, 3, 4]);
    expect(sma.metadata).toEqual({ period: 3, inputLength: 5, calculatedLength: 3 });

    await moduleRef.close();
  });
});

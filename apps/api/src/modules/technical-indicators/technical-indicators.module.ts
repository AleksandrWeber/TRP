import { Module } from '@nestjs/common';
import { EmaIndicator } from './indicators/ema-indicator';
import { SmaIndicator } from './indicators/sma-indicator';
import { IndicatorRegistry } from './indicator-registry';

/**
 * Technical Indicators Engine Nest module (US011).
 * A pure calculation library: input → indicator → immutable result. Ships
 * SMA and EMA behind the Indicator port and the IndicatorRegistry. No
 * controllers, no HTTP surface, no provider access, no trading decisions —
 * consumers (future indicator-based evaluators, US009 §Future) import the
 * module and resolve indicators by id. Depends on nothing but the candle
 * *type* from the Market Data Domain.
 */
@Module({
  providers: [
    {
      provide: IndicatorRegistry,
      useFactory: () => {
        const registry = new IndicatorRegistry();
        registry.register(new SmaIndicator());
        registry.register(new EmaIndicator());
        return registry;
      },
    },
  ],
  exports: [IndicatorRegistry],
})
export class TechnicalIndicatorsModule {}

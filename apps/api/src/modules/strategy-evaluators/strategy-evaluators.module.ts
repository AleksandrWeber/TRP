import { Inject, Module, type OnModuleInit } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SignalEngineModule, SignalEvaluatorRegistry } from '../signal-engine';
import { IndicatorRegistry, TechnicalIndicatorsModule } from '../technical-indicators';
import { BollingerStrategyEvaluator } from './bollinger-strategy-evaluator';
import { EmaStrategyEvaluator } from './ema-strategy-evaluator';
import { EvaluatorConfigErrorFilter } from './evaluator-config-error.filter';
import { MacdStrategyEvaluator } from './macd-strategy-evaluator';
import { RsiStrategyEvaluator } from './rsi-strategy-evaluator';
import { SmaStrategyEvaluator } from './sma-strategy-evaluator';
import { TechnicalIndicatorsErrorFilter } from './technical-indicators-error.filter';

/**
 * Strategy Evaluators Nest module (US012, extended by US014).
 * The bridge between the Signal Engine (US009) and the Technical Indicators
 * Engine (US011/US013): registers the indicator-backed SMA/EMA (US012) and
 * RSI/MACD/Bollinger (US014) evaluators into the SignalEvaluatorRegistry at
 * boot. The dependency direction is one-way — this module knows both
 * engines, but the Signal Engine still sees only the StrategyEvaluator port
 * and the Indicators Engine stays a pure calculation library. Neither engine
 * was modified. The dummy evaluator remains the registry default (first
 * registered, in SignalEngineModule).
 */
@Module({
  imports: [SignalEngineModule, TechnicalIndicatorsModule],
  providers: [
    {
      // Indicator errors escaping an evaluation become 400/502 instead of
      // opaque 500s. Catches TechnicalIndicatorsError only.
      provide: APP_FILTER,
      useClass: TechnicalIndicatorsErrorFilter,
    },
    {
      // Evaluator misconfiguration (thresholds, multiplier, fast >= slow)
      // becomes 400. Catches InvalidEvaluatorConfigError only.
      provide: APP_FILTER,
      useClass: EvaluatorConfigErrorFilter,
    },
  ],
})
export class StrategyEvaluatorsModule implements OnModuleInit {
  constructor(
    // Explicit tokens — vitest (esbuild) emits no design:paramtypes metadata.
    @Inject(SignalEvaluatorRegistry) private readonly evaluators: SignalEvaluatorRegistry,
    @Inject(IndicatorRegistry) private readonly indicators: IndicatorRegistry,
  ) {}

  onModuleInit(): void {
    this.evaluators.register(new SmaStrategyEvaluator(this.indicators));
    this.evaluators.register(new EmaStrategyEvaluator(this.indicators));
    this.evaluators.register(new RsiStrategyEvaluator(this.indicators));
    this.evaluators.register(new MacdStrategyEvaluator(this.indicators));
    this.evaluators.register(new BollingerStrategyEvaluator(this.indicators));
  }
}

export { SignalEngineModule } from './signal-engine.module';
export { SignalEngineController } from './signal-engine.controller';
export { SignalEngineService, SIGNAL_CANDLES_LIMIT } from './signal-engine.service';
export { SignalEvaluatorRegistry } from './signal-evaluator-registry';
export { StrategyRunner, EVALUATOR_PARAMETER_KEY } from './strategy-runner';
export { createSignalResult, isSignalType, SIGNAL_TYPES } from './domain/signal-result';
export type { SignalMetadata, SignalResult, SignalType } from './domain/signal-result';
export type {
  StrategyEvaluation,
  StrategyEvaluationContext,
  StrategyEvaluator,
} from './evaluators/strategy-evaluator';
export {
  DummyStrategyEvaluator,
  DUMMY_STRATEGY_EVALUATOR_ID,
} from './evaluators/dummy-strategy-evaluator';
export {
  SignalEngineError,
  UnknownStrategyEvaluatorError,
  EmptyCandleSeriesError,
  SIGNAL_ENGINE_ERROR_CODES,
} from './domain/signal-engine.error';
export type { SignalEngineErrorCode } from './domain/signal-engine.error';
export { SignalEngineErrorFilter } from './signal-engine-error.filter';

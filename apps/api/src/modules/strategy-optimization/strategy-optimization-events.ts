/**
 * Application events for US203 Strategy Optimization.
 *
 * Collected in-memory by StrategyOptimizationService. No transport layer
 * and no message bus.
 */

type StrategyOptimizationEventBase<Type extends string> = Readonly<{
  eventType: Type;
  optimizationId: string;
  occurredAt: string;
}>;

export type OptimizationStarted = StrategyOptimizationEventBase<'OptimizationStarted'> &
  Readonly<{
    configurationCount: number;
    criteria: string;
  }>;

export type ConfigurationEvaluated = StrategyOptimizationEventBase<'ConfigurationEvaluated'> &
  Readonly<{
    configurationId: string;
    reportId: string;
    totalExecutions: number;
    executionSuccessRate: number;
  }>;

export type OptimizationCompleted = StrategyOptimizationEventBase<'OptimizationCompleted'> &
  Readonly<{
    reportId: string;
    bestConfigurationId: string;
    configurationsEvaluated: number;
    completedAt: string;
  }>;

export type StrategyOptimizationEvent =
  OptimizationStarted | ConfigurationEvaluated | OptimizationCompleted;

export const STRATEGY_OPTIMIZATION_EVENT_TYPES = Object.freeze([
  'OptimizationStarted',
  'ConfigurationEvaluated',
  'OptimizationCompleted',
] as const);

export type StrategyOptimizationEventType = (typeof STRATEGY_OPTIMIZATION_EVENT_TYPES)[number];

import {
  DeterministicReplayValidationService,
  type CreateDeterministicReplayService,
  type DeterministicReplayValidationServiceDependencies,
} from '../deterministic-replay-validation';
import { createHistoricalReplayBenchmarkDependencies } from '../performance-benchmark';
import {
  HistoricalMarketDataProvider,
  HistoricalReplayService,
  HistoricalReplayStrategy,
  type HistoricalReplayServiceDependencies,
} from '../historical-replay';
import type { HistoricalDataset } from '../historical-replay/historical-dataset';
import {
  MultiYearResearchService,
  type CreateMultiYearWalkForwardService,
  type MultiYearResearchServiceDependencies,
} from '../multi-year-research';
import { ResearchApplicationService } from '../research-api';
import type { PaperStrategy } from '../paper-trading-runner';
import {
  InMemorySmokeSessionRepository,
  SmokeBacktestService,
  StubMarketDataProvider,
  StubPaperStrategy,
  type SmokeBacktestServiceDependencies,
  type SmokeResearchOrchestrator,
} from '../smoke-backtest';
import {
  WalkForwardValidationService,
  type CreateWalkForwardReplayService,
  type WalkForwardValidationServiceDependencies,
} from '../walk-forward-validation';
import type { ReplayWindow } from '../walk-forward-validation/replay-window';
import type { WalkForwardConfiguration } from '../walk-forward-validation/walk-forward-configuration';
import { ExecutionStatus } from '../smoke-backtest';
import type { ChaosScenario } from './chaos-scenario';
import {
  createEventEmissionFailingNotifier,
  DETERMINISTIC_COMPLETION_EVENTS,
  HISTORICAL_REPLAY_COMPLETION_EVENTS,
  MULTI_YEAR_COMPLETION_EVENTS,
  SMOKE_COMPLETION_EVENT,
  WALK_FORWARD_COMPLETION_EVENTS,
} from './event-emission-failure-overrides';
import { FailingMarketDataProvider } from './failing-market-data-provider';
import { FailingPaperStrategy } from './failing-paper-strategy';
import { FailingResearchOrchestrator } from './failing-research-orchestrator';
import { FailingSessionRepository } from './failing-session-repository';
import type { InjectedFailureType } from './injected-failure-type';

/**
 * Deterministic failure injection for US199 Chaos Testing.
 *
 * Builds dependency overrides using test doubles only.
 */

export type ChaosScenarioContext = Readonly<{
  clock: () => string;
  workspaceId: string;
  strategyId: string;
  leaseDurationMs: number;
  heartbeatTimeoutMs: number;
}>;

export type ChaosServiceFactories = Readonly<{
  createSmokeBacktestService: (
    overrides?: Partial<SmokeBacktestServiceDependencies>,
  ) => SmokeBacktestService;
  createHistoricalReplayService: (
    overrides?: Partial<HistoricalReplayServiceDependencies>,
  ) => HistoricalReplayService;
  createWalkForwardValidationService: (
    overrides?: Partial<WalkForwardValidationServiceDependencies>,
  ) => WalkForwardValidationService;
  createMultiYearResearchService: (
    overrides?: Partial<MultiYearResearchServiceDependencies>,
  ) => MultiYearResearchService;
  createDeterministicReplayValidationService: (
    overrides?: Partial<DeterministicReplayValidationServiceDependencies>,
  ) => DeterministicReplayValidationService;
}>;

export type FailureInjectionResult = Readonly<{
  serviceOverrides: Readonly<{
    smoke?: Partial<SmokeBacktestServiceDependencies>;
    historicalReplay?: Partial<HistoricalReplayServiceDependencies>;
    walkForward?: Partial<WalkForwardValidationServiceDependencies>;
    multiYear?: Partial<MultiYearResearchServiceDependencies>;
    deterministic?: Partial<DeterministicReplayValidationServiceDependencies>;
  }>;
  clock?: () => string;
  leaseDurationMs?: number;
  heartbeatTimeoutMs?: number;
}>;

export type ExecutableChaosService =
  | SmokeBacktestService
  | HistoricalReplayService
  | WalkForwardValidationService
  | MultiYearResearchService
  | DeterministicReplayValidationService;

export function extractErrorCode(error: unknown): string | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code;
  }
  return null;
}

export function verifyExecutionEvents(
  service: ExecutableChaosService,
  expectedFailedEventType: string,
): boolean {
  const events = service.domainEvents();
  return events.some((event) => event.eventType === expectedFailedEventType);
}

export function verifyEventEmissionInfrastructureFailure(service: ExecutableChaosService): boolean {
  if (!('eventEmissionDiagnostics' in service)) {
    return false;
  }
  return service.eventEmissionDiagnostics().length > 0;
}

export function verifyCompletedExecutionPreserved(service: ExecutableChaosService): boolean {
  const result = service.lastResult();
  if (result === null || result === undefined) {
    return false;
  }
  if ('executionStatus' in result) {
    return result.executionStatus === ExecutionStatus.COMPLETED;
  }
  if ('datasetsSucceeded' in result) {
    return result.datasetsSucceeded >= 1;
  }
  if ('completedWindows' in result) {
    return result.completedWindows >= 1;
  }
  if ('successfulIterations' in result) {
    return result.successfulIterations >= 1;
  }
  return true;
}

export function verifyExecutionCleanup(
  service: ExecutableChaosService,
  injectedFailure: InjectedFailureType,
): boolean {
  if (injectedFailure === 'Strategy') {
    const strategy = readStrategy(service);
    if (strategy !== null && typeof strategy === 'object' && 'shutdownCalls' in strategy) {
      return Array.isArray(strategy.shutdownCalls);
    }
  }

  return service.lastResult() !== undefined || service.domainEvents().length > 0;
}

export class FailureInjector {
  inject(scenario: ChaosScenario, context: ChaosScenarioContext): FailureInjectionResult {
    switch (scenario.injectedFailure) {
      case 'MarketDataProvider':
        return this.injectMarketDataFailure(scenario, context);
      case 'Strategy':
        return this.injectStrategyFailure(scenario, context);
      case 'Repository':
        return this.injectRepositoryFailure(scenario, context);
      case 'SessionLeaseExpiration':
        return this.injectLeaseExpiration(scenario, context);
      case 'ValidationFailure':
        return this.injectValidationFailure(scenario, context);
      case 'EventEmissionFailure':
        return this.injectEventEmissionFailure(scenario, context);
      default: {
        const exhaustive: never = scenario.injectedFailure;
        throw new Error(`unsupported injected failure: ${String(exhaustive)}`);
      }
    }
  }

  createService(
    scenario: ChaosScenario,
    factories: ChaosServiceFactories,
    injection: FailureInjectionResult,
  ): ExecutableChaosService {
    switch (scenario.scenarioType) {
      case 'Smoke':
        return factories.createSmokeBacktestService(injection.serviceOverrides.smoke);
      case 'HistoricalReplay':
        return factories.createHistoricalReplayService(injection.serviceOverrides.historicalReplay);
      case 'WalkForward':
        return factories.createWalkForwardValidationService(injection.serviceOverrides.walkForward);
      case 'MultiYearResearch':
        return factories.createMultiYearResearchService(injection.serviceOverrides.multiYear);
      case 'DeterministicReplayValidation':
        return factories.createDeterministicReplayValidationService(
          injection.serviceOverrides.deterministic,
        );
      default: {
        const exhaustive: never = scenario.scenarioType;
        throw new Error(`unsupported scenario type: ${String(exhaustive)}`);
      }
    }
  }

  private injectMarketDataFailure(
    scenario: ChaosScenario,
    context: ChaosScenarioContext,
  ): FailureInjectionResult {
    switch (scenario.scenarioType) {
      case 'Smoke': {
        const marketData = StubMarketDataProvider.create();
        const failingMarketData = FailingMarketDataProvider.create({
          delegate: marketData,
          failAfterCalls: 0,
        });
        const strategy = StubPaperStrategy.create({ marketDataProvider: failingMarketData });
        return Object.freeze({
          serviceOverrides: Object.freeze({
            smoke: Object.freeze({
              marketDataProvider: failingMarketData,
              strategy,
              cycles: 1,
              clock: context.clock,
              workspaceId: context.workspaceId,
              strategyId: context.strategyId,
              leaseDurationMs: context.leaseDurationMs,
              heartbeatTimeoutMs: context.heartbeatTimeoutMs,
            }),
          }),
        });
      }
      case 'HistoricalReplay': {
        const base = createHistoricalReplayBase(context);
        const failingMarketData = FailingMarketDataProvider.create({
          delegate: base.marketDataProvider,
          failAfterCalls: 0,
        });
        const strategy = HistoricalReplayStrategy.create({
          marketDataProvider: failingMarketData,
        });
        return Object.freeze({
          serviceOverrides: Object.freeze({
            historicalReplay: Object.freeze({
              ...base.dependencies,
              strategy,
            }),
          }),
        });
      }
      case 'WalkForward':
        return this.injectWalkForwardReplayFailure(context, (base) => {
          const failingMarketData = FailingMarketDataProvider.create({
            delegate: base.marketDataProvider,
            failAfterCalls: 0,
          });
          const strategy = HistoricalReplayStrategy.create({
            marketDataProvider: failingMarketData,
          });
          return Object.freeze({
            ...base.dependencies,
            strategy,
          });
        });
      case 'MultiYearResearch':
        return this.injectMultiYearWalkForwardFailure(context, (base) => {
          const failingMarketData = FailingMarketDataProvider.create({
            delegate: base.marketDataProvider,
            failAfterCalls: 0,
          });
          const strategy = HistoricalReplayStrategy.create({
            marketDataProvider: failingMarketData,
          });
          return Object.freeze({
            ...base.dependencies,
            strategy,
          });
        });
      case 'DeterministicReplayValidation':
        return this.injectDeterministicReplayFailure(context, (base) => {
          const failingMarketData = FailingMarketDataProvider.create({
            delegate: base.marketDataProvider,
            failAfterCalls: 0,
          });
          const strategy = HistoricalReplayStrategy.create({
            marketDataProvider: failingMarketData,
          });
          return Object.freeze({
            ...base.dependencies,
            strategy,
          });
        });
      default:
        throw new Error(`market data failure unsupported for ${scenario.scenarioType}`);
    }
  }

  private injectStrategyFailure(
    scenario: ChaosScenario,
    context: ChaosScenarioContext,
  ): FailureInjectionResult {
    switch (scenario.scenarioType) {
      case 'Smoke': {
        const marketData = StubMarketDataProvider.create();
        const strategy = FailingPaperStrategy.create({
          delegate: StubPaperStrategy.create({ marketDataProvider: marketData }),
          failOn: 'initialize',
        });
        return Object.freeze({
          serviceOverrides: Object.freeze({
            smoke: Object.freeze({
              marketDataProvider: marketData,
              strategy,
              clock: context.clock,
              workspaceId: context.workspaceId,
              strategyId: context.strategyId,
              leaseDurationMs: context.leaseDurationMs,
              heartbeatTimeoutMs: context.heartbeatTimeoutMs,
            }),
          }),
        });
      }
      case 'HistoricalReplay': {
        const base = createHistoricalReplayBase(context);
        const strategy = FailingPaperStrategy.create({
          delegate: HistoricalReplayStrategy.create({
            marketDataProvider: base.marketDataProvider,
          }),
          failOn: 'initialize',
        });
        return Object.freeze({
          serviceOverrides: Object.freeze({
            historicalReplay: Object.freeze({
              ...base.dependencies,
              strategy,
            }),
          }),
        });
      }
      case 'WalkForward':
        return this.injectWalkForwardReplayFailure(context, (base) => {
          const strategy = FailingPaperStrategy.create({
            delegate: HistoricalReplayStrategy.create({
              marketDataProvider: base.marketDataProvider,
            }),
            failOn: 'initialize',
          });
          return Object.freeze({
            ...base.dependencies,
            strategy,
          });
        });
      case 'MultiYearResearch':
        return this.injectMultiYearWalkForwardFailure(context, (base) => {
          const strategy = FailingPaperStrategy.create({
            delegate: HistoricalReplayStrategy.create({
              marketDataProvider: base.marketDataProvider,
            }),
            failOn: 'initialize',
          });
          return Object.freeze({
            ...base.dependencies,
            strategy,
          });
        });
      case 'DeterministicReplayValidation':
        return this.injectDeterministicReplayFailure(context, (base) => {
          const strategy = FailingPaperStrategy.create({
            delegate: HistoricalReplayStrategy.create({
              marketDataProvider: base.marketDataProvider,
            }),
            failOn: 'initialize',
          });
          return Object.freeze({
            ...base.dependencies,
            strategy,
          });
        });
      default:
        throw new Error(`strategy failure unsupported for ${scenario.scenarioType}`);
    }
  }

  private injectRepositoryFailure(
    scenario: ChaosScenario,
    context: ChaosScenarioContext,
  ): FailureInjectionResult {
    const failingRepository = FailingSessionRepository.create({
      delegate: new InMemorySmokeSessionRepository(),
      failOn: 'save',
    });

    switch (scenario.scenarioType) {
      case 'Smoke': {
        const marketData = StubMarketDataProvider.create();
        const strategy = StubPaperStrategy.create({ marketDataProvider: marketData });
        return Object.freeze({
          serviceOverrides: Object.freeze({
            smoke: Object.freeze({
              marketDataProvider: marketData,
              strategy,
              repository: failingRepository,
              clock: context.clock,
              workspaceId: context.workspaceId,
              strategyId: context.strategyId,
              leaseDurationMs: context.leaseDurationMs,
              heartbeatTimeoutMs: context.heartbeatTimeoutMs,
            }),
          }),
        });
      }
      case 'HistoricalReplay': {
        const base = createHistoricalReplayBase(context);
        return Object.freeze({
          serviceOverrides: Object.freeze({
            historicalReplay: Object.freeze({
              ...base.dependencies,
              repository: failingRepository,
            }),
          }),
        });
      }
      case 'WalkForward':
        return this.injectWalkForwardReplayFailure(context, (base) =>
          Object.freeze({
            ...base.dependencies,
            repository: failingRepository,
          }),
        );
      case 'MultiYearResearch':
        return this.injectMultiYearWalkForwardFailure(context, (base) =>
          Object.freeze({
            ...base.dependencies,
            repository: failingRepository,
          }),
        );
      case 'DeterministicReplayValidation':
        return this.injectDeterministicReplayFailure(context, (base) =>
          Object.freeze({
            ...base.dependencies,
            repository: failingRepository,
          }),
        );
      default:
        throw new Error(`repository failure unsupported for ${scenario.scenarioType}`);
    }
  }

  private injectLeaseExpiration(
    scenario: ChaosScenario,
    context: ChaosScenarioContext,
  ): FailureInjectionResult {
    const leaseDurationMs = scenario.leaseDurationMs ?? 60_000;
    const heartbeatTimeoutMs = scenario.heartbeatTimeoutMs ?? 300_000;
    const clock = createScenarioClock(scenario, context);

    switch (scenario.scenarioType) {
      case 'Smoke': {
        const marketData = StubMarketDataProvider.create();
        const strategy = StubPaperStrategy.create({ marketDataProvider: marketData });
        return Object.freeze({
          serviceOverrides: Object.freeze({
            smoke: Object.freeze({
              marketDataProvider: marketData,
              strategy,
              cycles: 1,
              clock,
              workspaceId: context.workspaceId,
              strategyId: context.strategyId,
              leaseDurationMs,
              heartbeatTimeoutMs,
            }),
          }),
          clock,
          leaseDurationMs,
          heartbeatTimeoutMs,
        });
      }
      case 'HistoricalReplay': {
        const base = createHistoricalReplayBase({ ...context, clock });
        return Object.freeze({
          serviceOverrides: Object.freeze({
            historicalReplay: Object.freeze({
              ...base.dependencies,
              clock,
              leaseDurationMs,
              heartbeatTimeoutMs,
            }),
          }),
          clock,
          leaseDurationMs,
          heartbeatTimeoutMs,
        });
      }
      case 'WalkForward':
        return this.injectWalkForwardReplayFailure(
          { ...context, clock },
          (base) =>
            Object.freeze({
              ...base.dependencies,
              clock,
              leaseDurationMs,
              heartbeatTimeoutMs,
            }),
          { clock, leaseDurationMs, heartbeatTimeoutMs },
        );
      case 'MultiYearResearch':
        return this.injectMultiYearWalkForwardFailure(
          { ...context, clock },
          (base) =>
            Object.freeze({
              ...base.dependencies,
              clock,
              leaseDurationMs,
              heartbeatTimeoutMs,
            }),
          { clock, leaseDurationMs, heartbeatTimeoutMs },
        );
      case 'DeterministicReplayValidation':
        return this.injectDeterministicReplayFailure(
          { ...context, clock },
          (base) =>
            Object.freeze({
              ...base.dependencies,
              clock,
              leaseDurationMs,
              heartbeatTimeoutMs,
            }),
          { clock, leaseDurationMs, heartbeatTimeoutMs },
        );
      default:
        throw new Error(`lease expiration unsupported for ${scenario.scenarioType}`);
    }
  }

  private injectValidationFailure(
    scenario: ChaosScenario,
    context: ChaosScenarioContext,
  ): FailureInjectionResult {
    switch (scenario.scenarioType) {
      case 'Smoke':
      case 'HistoricalReplay':
        return this.injectResearchValidationFailure(scenario, context);
      case 'WalkForward':
        return this.injectWalkForwardReplayFailure(context, (base) =>
          Object.freeze({
            ...base.dependencies,
            researchService: createFailingResearchOrchestrator(base.dependencies, 'createSession'),
          }),
        );
      case 'MultiYearResearch':
        return this.injectMultiYearWalkForwardFailure(context, (base) =>
          Object.freeze({
            ...base.dependencies,
            researchService: createFailingResearchOrchestrator(base.dependencies, 'createSession'),
          }),
        );
      case 'DeterministicReplayValidation':
        return this.injectDeterministicReplayFailure(context, (base) =>
          Object.freeze({
            ...base.dependencies,
            researchService: createFailingResearchOrchestrator(base.dependencies, 'createSession'),
          }),
        );
      default:
        throw new Error(`validation failure unsupported for ${scenario.scenarioType}`);
    }
  }

  private injectEventEmissionFailure(
    scenario: ChaosScenario,
    context: ChaosScenarioContext,
  ): FailureInjectionResult {
    switch (scenario.scenarioType) {
      case 'Smoke':
        return this.injectSmokeEventEmissionFailure(context);
      case 'HistoricalReplay':
        return this.injectHistoricalReplayEventEmissionFailure(context);
      case 'WalkForward':
        return this.injectWalkForwardEventEmissionFailure(context);
      case 'MultiYearResearch':
        return this.injectMultiYearEventEmissionFailure(context);
      case 'DeterministicReplayValidation':
        return this.injectDeterministicEventEmissionFailure(context);
      default:
        throw new Error(`event emission failure unsupported for ${scenario.scenarioType}`);
    }
  }

  private injectSmokeEventEmissionFailure(context: ChaosScenarioContext): FailureInjectionResult {
    const marketData = StubMarketDataProvider.create();
    const strategy = StubPaperStrategy.create({ marketDataProvider: marketData });
    return Object.freeze({
      serviceOverrides: Object.freeze({
        smoke: Object.freeze({
          marketDataProvider: marketData,
          strategy,
          cycles: 1,
          clock: context.clock,
          workspaceId: context.workspaceId,
          strategyId: context.strategyId,
          leaseDurationMs: context.leaseDurationMs,
          heartbeatTimeoutMs: context.heartbeatTimeoutMs,
          applicationEventNotifier: createEventEmissionFailingNotifier([SMOKE_COMPLETION_EVENT]),
        }),
      }),
    });
  }

  private injectHistoricalReplayEventEmissionFailure(
    context: ChaosScenarioContext,
  ): FailureInjectionResult {
    const base = createHistoricalReplayBase(context);
    return Object.freeze({
      serviceOverrides: Object.freeze({
        historicalReplay: Object.freeze({
          ...base.dependencies,
          applicationEventNotifier: createEventEmissionFailingNotifier(
            HISTORICAL_REPLAY_COMPLETION_EVENTS,
          ),
        }),
      }),
    });
  }

  private injectWalkForwardEventEmissionFailure(
    context: ChaosScenarioContext,
  ): FailureInjectionResult {
    return Object.freeze({
      serviceOverrides: Object.freeze({
        walkForward: Object.freeze({
          clock: context.clock,
          workspaceId: context.workspaceId,
          strategyId: context.strategyId,
          leaseDurationMs: context.leaseDurationMs,
          heartbeatTimeoutMs: context.heartbeatTimeoutMs,
          applicationEventNotifier: createEventEmissionFailingNotifier(
            WALK_FORWARD_COMPLETION_EVENTS,
          ),
        }),
      }),
    });
  }

  private injectMultiYearEventEmissionFailure(
    context: ChaosScenarioContext,
  ): FailureInjectionResult {
    return Object.freeze({
      serviceOverrides: Object.freeze({
        multiYear: Object.freeze({
          clock: context.clock,
          workspaceId: context.workspaceId,
          strategyId: context.strategyId,
          leaseDurationMs: context.leaseDurationMs,
          heartbeatTimeoutMs: context.heartbeatTimeoutMs,
          applicationEventNotifier: createEventEmissionFailingNotifier(
            MULTI_YEAR_COMPLETION_EVENTS,
          ),
        }),
      }),
    });
  }

  private injectDeterministicEventEmissionFailure(
    context: ChaosScenarioContext,
  ): FailureInjectionResult {
    return Object.freeze({
      serviceOverrides: Object.freeze({
        deterministic: Object.freeze({
          clock: context.clock,
          workspaceId: context.workspaceId,
          strategyId: context.strategyId,
          leaseDurationMs: context.leaseDurationMs,
          heartbeatTimeoutMs: context.heartbeatTimeoutMs,
          applicationEventNotifier: createEventEmissionFailingNotifier(
            DETERMINISTIC_COMPLETION_EVENTS,
          ),
        }),
      }),
    });
  }

  private injectResearchValidationFailure(
    scenario: ChaosScenario,
    context: ChaosScenarioContext,
  ): FailureInjectionResult {
    if (scenario.scenarioType === 'Smoke') {
      const marketData = StubMarketDataProvider.create();
      const strategy = StubPaperStrategy.create({ marketDataProvider: marketData });
      const researchService = createSmokeFailingResearch(
        context,
        strategy,
        'createSession',
        'validation',
      );
      return Object.freeze({
        serviceOverrides: Object.freeze({
          smoke: Object.freeze({
            marketDataProvider: marketData,
            strategy,
            researchService,
            clock: context.clock,
            workspaceId: context.workspaceId,
            strategyId: context.strategyId,
            leaseDurationMs: context.leaseDurationMs,
            heartbeatTimeoutMs: context.heartbeatTimeoutMs,
          }),
        }),
      });
    }

    if (scenario.scenarioType === 'HistoricalReplay') {
      const base = createHistoricalReplayBase(context);
      return Object.freeze({
        serviceOverrides: Object.freeze({
          historicalReplay: Object.freeze({
            ...base.dependencies,
            researchService: createFailingResearchOrchestrator(base.dependencies, 'createSession'),
          }),
        }),
      });
    }

    throw new Error(`validation failure unsupported for ${scenario.scenarioType}`);
  }

  private injectWalkForwardReplayFailure(
    context: ChaosScenarioContext,
    buildReplayDependencies: (base: HistoricalReplayBase) => HistoricalReplayServiceDependencies,
    timing?: Readonly<{
      clock?: () => string;
      leaseDurationMs?: number;
      heartbeatTimeoutMs?: number;
    }>,
  ): FailureInjectionResult {
    return Object.freeze({
      serviceOverrides: Object.freeze({
        walkForward: Object.freeze({
          clock: timing?.clock ?? context.clock,
          workspaceId: context.workspaceId,
          strategyId: context.strategyId,
          leaseDurationMs: timing?.leaseDurationMs ?? context.leaseDurationMs,
          heartbeatTimeoutMs: timing?.heartbeatTimeoutMs ?? context.heartbeatTimeoutMs,
          createReplayService: ((
            _window: ReplayWindow,
            dependencies: HistoricalReplayServiceDependencies,
          ) =>
            HistoricalReplayService.create(
              buildReplayDependencies(createHistoricalReplayBase(context, dependencies)),
            )) satisfies CreateWalkForwardReplayService,
        }),
      }),
      clock: timing?.clock,
      leaseDurationMs: timing?.leaseDurationMs,
      heartbeatTimeoutMs: timing?.heartbeatTimeoutMs,
    });
  }

  private injectMultiYearWalkForwardFailure(
    context: ChaosScenarioContext,
    buildReplayDependencies: (base: HistoricalReplayBase) => HistoricalReplayServiceDependencies,
    timing?: Readonly<{
      clock?: () => string;
      leaseDurationMs?: number;
      heartbeatTimeoutMs?: number;
    }>,
  ): FailureInjectionResult {
    const walkForwardInjection = this.injectWalkForwardReplayFailure(
      { ...context, clock: timing?.clock ?? context.clock },
      buildReplayDependencies,
      timing,
    );
    const walkForwardOverrides = walkForwardInjection.serviceOverrides.walkForward ?? {};

    return Object.freeze({
      serviceOverrides: Object.freeze({
        multiYear: Object.freeze({
          clock: walkForwardOverrides.clock ?? timing?.clock ?? context.clock,
          workspaceId: context.workspaceId,
          strategyId: context.strategyId,
          leaseDurationMs:
            walkForwardOverrides.leaseDurationMs ??
            timing?.leaseDurationMs ??
            context.leaseDurationMs,
          heartbeatTimeoutMs:
            walkForwardOverrides.heartbeatTimeoutMs ??
            timing?.heartbeatTimeoutMs ??
            context.heartbeatTimeoutMs,
          createWalkForwardService: ((
            dataset: HistoricalDataset,
            walkForwardConfiguration: WalkForwardConfiguration,
            dependencies: Omit<
              WalkForwardValidationServiceDependencies,
              'dataset' | 'configuration'
            >,
          ) =>
            WalkForwardValidationService.create({
              ...dependencies,
              dataset,
              configuration: walkForwardConfiguration,
              ...walkForwardOverrides,
            })) satisfies CreateMultiYearWalkForwardService,
        }),
      }),
      clock: walkForwardInjection.clock,
      leaseDurationMs: walkForwardInjection.leaseDurationMs,
      heartbeatTimeoutMs: walkForwardInjection.heartbeatTimeoutMs,
    });
  }

  private injectDeterministicReplayFailure(
    context: ChaosScenarioContext,
    buildReplayDependencies: (base: HistoricalReplayBase) => HistoricalReplayServiceDependencies,
    timing?: Readonly<{
      clock?: () => string;
      leaseDurationMs?: number;
      heartbeatTimeoutMs?: number;
    }>,
  ): FailureInjectionResult {
    return Object.freeze({
      serviceOverrides: Object.freeze({
        deterministic: Object.freeze({
          clock: timing?.clock ?? context.clock,
          workspaceId: context.workspaceId,
          strategyId: context.strategyId,
          leaseDurationMs: timing?.leaseDurationMs ?? context.leaseDurationMs,
          heartbeatTimeoutMs: timing?.heartbeatTimeoutMs ?? context.heartbeatTimeoutMs,
          createReplayService: ((
            _iteration: number,
            dependencies: HistoricalReplayServiceDependencies,
          ) =>
            HistoricalReplayService.create(
              buildReplayDependencies(createHistoricalReplayBase(context, dependencies)),
            )) satisfies CreateDeterministicReplayService,
        }),
      }),
      clock: timing?.clock,
      leaseDurationMs: timing?.leaseDurationMs,
      heartbeatTimeoutMs: timing?.heartbeatTimeoutMs,
    });
  }
}

type HistoricalReplayBase = Readonly<{
  marketDataProvider: HistoricalMarketDataProvider;
  dependencies: HistoricalReplayServiceDependencies;
}>;

function createHistoricalReplayBase(
  context: ChaosScenarioContext,
  seed?: Partial<HistoricalReplayServiceDependencies>,
): HistoricalReplayBase {
  const defaults = createHistoricalReplayBenchmarkDependencies({
    clock: context.clock,
    workspaceId: context.workspaceId,
    strategyId: context.strategyId,
    leaseDurationMs: context.leaseDurationMs,
    heartbeatTimeoutMs: context.heartbeatTimeoutMs,
  });
  const dependencies = {
    ...defaults,
    ...seed,
  } as HistoricalReplayServiceDependencies;
  const marketDataProvider =
    dependencies.marketDataProvider ??
    HistoricalMarketDataProvider.create({ dataset: dependencies.dataset });

  return Object.freeze({
    marketDataProvider,
    dependencies: Object.freeze({
      ...dependencies,
      marketDataProvider,
      clock: dependencies.clock ?? context.clock,
      workspaceId: dependencies.workspaceId ?? context.workspaceId,
      strategyId: dependencies.strategyId ?? context.strategyId,
      leaseDurationMs: dependencies.leaseDurationMs ?? context.leaseDurationMs,
      heartbeatTimeoutMs: dependencies.heartbeatTimeoutMs ?? context.heartbeatTimeoutMs,
    }),
  });
}

function createSmokeFailingResearch(
  context: ChaosScenarioContext,
  strategy: PaperStrategy,
  failOn: 'createSession' | 'runCycle',
  _mode: 'validation' | 'event',
): SmokeResearchOrchestrator {
  const delegate = ResearchApplicationService.create({
    repository: new InMemorySmokeSessionRepository(),
    resolveStrategy: () => strategy,
    clock: context.clock,
    leaseDurationMs: context.leaseDurationMs,
    heartbeatTimeoutMs: context.heartbeatTimeoutMs,
  });

  return FailingResearchOrchestrator.create({
    delegate,
    failOn,
    validationMessage: 'chaos: validation failure',
    eventEmissionMessage: 'chaos: event emission failure',
  });
}

function createFailingResearchOrchestrator(
  dependencies: Partial<HistoricalReplayServiceDependencies>,
  failOn: 'createSession' | 'runCycle',
  _mode: 'validation' | 'event' = 'validation',
): SmokeResearchOrchestrator {
  const strategy = dependencies.strategy as PaperStrategy;
  const delegate = ResearchApplicationService.create({
    repository: dependencies.repository ?? new InMemorySmokeSessionRepository(),
    resolveStrategy: () => strategy,
    clock: dependencies.clock,
    leaseDurationMs: dependencies.leaseDurationMs,
    heartbeatTimeoutMs: dependencies.heartbeatTimeoutMs,
  });

  return FailingResearchOrchestrator.create({
    delegate,
    failOn,
    validationMessage: 'chaos: validation failure',
    eventEmissionMessage: 'chaos: event emission failure',
  });
}

function createScenarioClock(scenario: ChaosScenario, context: ChaosScenarioContext): () => string {
  if (scenario.clockTimes === undefined || scenario.clockTimes.length === 0) {
    return context.clock;
  }

  let index = 0;
  const times = scenario.clockTimes;
  return () => {
    const value = times[Math.min(index, times.length - 1)] as string;
    index += 1;
    return value;
  };
}

function readStrategy(service: ExecutableChaosService): unknown {
  if (service instanceof SmokeBacktestService) {
    return service.paperStrategy();
  }
  return null;
}

export const failureInjector = new FailureInjector();

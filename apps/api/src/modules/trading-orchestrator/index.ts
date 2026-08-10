/**
 * RC-26 — Trading Orchestrator public barrel.
 *
 * Epic 5 exports: boundary, domain factories, workflow ports, Nest Module.
 */

export {
  TRADING_ORCHESTRATOR_AUTHORITY_CLASS,
  TRADING_ORCHESTRATOR_BOUNDARY,
  TRADING_ORCHESTRATOR_DISTINCT_FROM,
  TRADING_ORCHESTRATOR_FORBIDDEN_CAPABILITIES,
  TRADING_ORCHESTRATOR_MODULE_ID,
  TRADING_ORCHESTRATOR_NON_OWNED,
  TRADING_ORCHESTRATOR_OWNED_CONCERNS,
  isTradingOrchestratorForbiddenCapability,
  tradingOrchestratorApprovesRisk,
  tradingOrchestratorForcesTrade,
  tradingOrchestratorIsExecutionEngine,
  tradingOrchestratorIsExecutionSourceOfTruth,
  tradingOrchestratorOwnsMarketProfile,
  tradingOrchestratorOwnsMarketState,
  tradingOrchestratorOwnsQualification,
  tradingOrchestratorOwnsSessionLifecycle,
  tradingOrchestratorReplacesRuntimeEnforcement,
  tradingOrchestratorReplacesStrategyLibrary,
  tradingOrchestratorSubmitsOrders,
  type TradingOrchestratorBoundary,
  type TradingOrchestratorForbiddenCapability,
  type TradingOrchestratorNonOwned,
  type TradingOrchestratorOwnedConcern,
} from './domain/trading-orchestrator-boundary';

export {
  ORCHESTRATION_LIFECYCLE_STATUSES,
  ORCHESTRATION_LIFECYCLE_TRANSITIONS,
  ORCHESTRATION_MODE_CONTEXTS,
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  assertOrchestrationLifecycleTransition,
  assertPositiveVersion,
  canTransitionOrchestrationLifecycle,
  deepFreeze,
  isOrchestrationLifecycleStatus,
  isOrchestrationModeContext,
  type OrchestrationLifecycleStatus,
  type OrchestrationModeContext,
} from './domain/trading-orchestrator-domain-shared';

export {
  ORCHESTRATION_RUN_STATUSES,
  ORCHESTRATION_RUN_TRANSITIONS,
  SESSION_HANDOFF_INTENT_STATUSES,
  assertOrchestrationRunTransition,
  canTransitionOrchestrationRun,
  isOrchestrationRunStatus,
  isSessionHandoffIntentStatus,
  type OrchestrationRunStatus,
  type SessionHandoffIntentStatus,
} from './domain/orchestration-workflow-shared';

export {
  createTradingOrchestrator,
  type CreateTradingOrchestratorInput,
  type TradingOrchestrator,
} from './domain/trading-orchestrator';

export {
  createOrchestrationPlan,
  publishNextOrchestrationPlan,
  withOrchestrationPlanLifecycle,
  type CreateOrchestrationPlanInput,
  type OrchestrationPlan,
} from './domain/orchestration-plan';

export {
  assertNextPlanVersionMonotonic,
  assertNoPlanVersionOverwrite,
  createOrchestrationPlanVersion,
  type CreateOrchestrationPlanVersionInput,
  type OrchestrationPlanVersion,
} from './domain/orchestration-plan-version';

export {
  createOrchestrationLifecycle,
  transitionOrchestrationLifecycle,
  type CreateOrchestrationLifecycleInput,
  type OrchestrationLifecycle,
} from './domain/orchestration-lifecycle';

export {
  createOrchestrationIntent,
  type CreateOrchestrationIntentInput,
  type OrchestrationIntent,
} from './domain/orchestration-intent';

export {
  createOrchestrationMetadata,
  type CreateOrchestrationMetadataInput,
  type OrchestrationMetadata,
} from './domain/orchestration-metadata';

export {
  createOrchestrationRun,
  withOrchestrationRunStatus,
  type CreateOrchestrationRunInput,
  type OrchestrationRun,
} from './domain/orchestration-run';

export {
  createSelectionDecision,
  type CreateSelectionDecisionInput,
  type SelectionDecision,
} from './domain/selection-decision';

export {
  createSessionHandoffIntent,
  type CreateSessionHandoffIntentInput,
  type SessionHandoffIntent,
} from './domain/session-handoff-intent';

export { InMemoryOrchestratorMarketStateAdapter } from './adapters/in-memory-market-state.adapter';
export { TradingOrchestratorConsumerReadAdapter } from './adapters/trading-orchestrator-consumer-read.adapter';
export { OrchestrationCoordinationStore } from './application/orchestration-coordination.store';
export { OrchestrationWorkflowCoordinator } from './application/orchestration-workflow.coordinator';
export {
  TRADING_ORCHESTRATOR_CONSUMER_FLAGS,
  TRADING_ORCHESTRATOR_CONSUMER_INTENDED,
  type OrchestrationSummaryProjection,
  type SelectionDecisionProjection,
  type SessionHandoffIntentProjection,
  type TradingOrchestratorConsumerAudience,
} from './domain/trading-orchestrator-consumer-read-model';
export { TradingOrchestratorBoundaryService } from './trading-orchestrator-boundary.service';
export { TradingOrchestratorModule } from './trading-orchestrator.module';

export {
  ORCHESTRATOR_MARKET_STATE_CONSUMER,
  ORCHESTRATOR_PROFILE_CONSUMER,
  ORCHESTRATOR_QUALIFICATION_CONSUMER,
  ORCHESTRATOR_RISK_POLICY_READ_CONSUMER,
  ORCHESTRATOR_RUNTIME_ENFORCEMENT_CONSUMER,
  ORCHESTRATOR_STRATEGY_LIBRARY_CONSUMER,
  TRADING_ORCHESTRATOR_CONSUMER_READ_PORT,
  TRADING_ORCHESTRATOR_PORTS_ACTIVE,
  TRADING_ORCHESTRATOR_QUERY_PORT,
  TRADING_ORCHESTRATOR_SERVICE_PORT,
  type CancelOrchestrationRun,
  type ConfirmOrchestrationRun,
  type EmitSessionHandoff,
  type OrchestrationCommandResult,
  type OrchestratorMarketStateConsumerPort,
  type OrchestratorRiskPolicyReadPort,
  type OrchestratorRuntimeEnforcementConsumerPort,
  type OrchestratorStrategyLibraryConsumerPort,
  type ProposeSelection,
  type RequestOrchestrationRun,
  type TradingOrchestratorConsumerReadPort,
  type TradingOrchestratorQueryPort,
  type TradingOrchestratorServicePort,
} from './ports/trading-orchestrator.port';

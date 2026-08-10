export {
  MARKET_QUALIFICATION_AUTHORITY_CLASS,
  MARKET_QUALIFICATION_BOUNDARY,
  MARKET_QUALIFICATION_DISTINCT_FROM,
  MARKET_QUALIFICATION_FORBIDDEN_CAPABILITIES,
  MARKET_QUALIFICATION_MODULE_ID,
  MARKET_QUALIFICATION_NON_OWNED,
  MARKET_QUALIFICATION_OWNED_CONCERNS,
  isMarketQualificationForbiddenCapability,
  marketQualificationCommandsSessions,
  marketQualificationForcesTrade,
  marketQualificationIsExecutionSourceOfTruth,
  marketQualificationOwnsMarketProfileVersions,
  marketQualificationReplacesRuntimeEnforcement,
  marketQualificationReplacesStrategyLibrary,
  marketQualificationSelectsStrategies,
  type MarketQualificationBoundary,
  type MarketQualificationForbiddenCapability,
  type MarketQualificationNonOwned,
  type MarketQualificationOwnedConcern,
} from './domain/market-qualification-boundary';
export {
  MARKET_OBSERVATION_AUTHORITY_CLASS,
  RESEARCH_OUTPUT_REF_AUTHORITY_CLASS,
  toConnectivityHealthView,
  toExchangeMetadataSlices,
  toHistoricalCharacteristicSlices,
  toMarketObservationSlices,
  toResearchOutputRefs,
  type ConnectivityHealthView,
  type ExchangeMetadataSlice,
  type HistoricalCharacteristicSlice,
  type LiveMarketDataReadQuery,
  type MarketObservationSlice,
  type ResearchOutputReadQuery,
  type ResearchOutputRef,
} from './domain/market-qualification-observational-read-model';
export {
  MARKET_QUALIFICATION_DOMAIN_AUTHORITY_CLASS,
  QUALIFICATION_LIFECYCLE_STATES,
  QUALIFICATION_RUN_STATUSES,
  assertQualificationStateTransition,
  canTransitionQualificationState,
  type MarketConfidenceLevel,
  type MarketHealthStatus,
  type QualificationLifecycleState,
  type QualificationModeContext,
  type QualificationRunStatus,
} from './domain/market-qualification-domain-shared';
export {
  createQualificationTarget,
  type CreateQualificationTargetInput,
  type QualificationTarget,
} from './domain/qualification-target';
export {
  createQualificationRun,
  type CreateQualificationRunInput,
  type QualificationRun,
  type QualificationRunInputSummary,
} from './domain/qualification-run';
export {
  createQualificationState,
  transitionQualificationState,
  type CreateQualificationStateInput,
  type QualificationState,
} from './domain/qualification-state';
export {
  createMarketConfidence,
  type CreateMarketConfidenceInput,
  type MarketConfidence,
} from './domain/market-confidence';
export {
  createMarketHealth,
  type CreateMarketHealthInput,
  type MarketHealth,
  type MarketHealthIndicator,
} from './domain/market-health';
export { LiveMarketDataReadAdapter } from './adapters/live-market-data-read.adapter';
export { ResearchOutputReadAdapter } from './adapters/research-output-read.adapter';
export { InMemoryQualificationStore } from './adapters/in-memory-qualification-store';
export {
  deriveQualificationRunId,
  deriveQualificationTargetId,
} from './lifecycle/derive-qualification-ids';
export { MarketQualificationBoundaryService } from './market-qualification-boundary.service';
export { MarketQualificationLifecycleService } from './market-qualification-lifecycle.service';
export { MarketQualificationObservationalReadService } from './market-qualification-observational-read.service';
export { MarketQualificationQueryService } from './market-qualification-query.service';
export { MarketQualificationModule } from './market-qualification.module';
export {
  MARKET_QUALIFICATION_CONSUMER_INTENDED,
  MARKET_QUALIFICATION_LAKE_PROJECTION_CATEGORY,
  type MarketConfidenceProjection,
  type MarketHealthProjection,
  type MarketQualificationConsumerAudience,
  type QualificationConsumerSummary,
  type QualificationLifecycleStatusProjection,
} from './domain/market-qualification-consumer-read-model';
export { MarketQualificationConsumerReadAdapter } from './adapters/market-qualification-consumer-read.adapter';
export {
  MARKET_QUALIFICATION_CONSUMER_READ_PORT,
  type MarketQualificationConsumerReadPort,
  type QualificationConsumerTargetQuery,
} from './ports/market-qualification-consumer.port';
export {
  LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_QUALIFICATION_PORTS_ACTIVE,
  MARKET_QUALIFICATION_QUERY_PORT,
  MARKET_QUALIFICATION_SERVICE_PORT,
  RESEARCH_OUTPUT_READ_CONSUMER,
  type LiveMarketDataReadPort,
  type MarketQualificationQueryPort,
  type MarketQualificationServicePort,
  type ResearchOutputReadPort,
} from './ports/market-qualification.port';

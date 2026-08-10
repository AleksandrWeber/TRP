/**
 * RC-26 — Market State public barrel.
 *
 * Epic 3 exports: boundary, observational reads, immutable domain factories.
 */

export {
  MARKET_STATE_AUTHORITY_CLASS,
  MARKET_STATE_BOUNDARY,
  MARKET_STATE_DISTINCT_FROM,
  MARKET_STATE_FORBIDDEN_CAPABILITIES,
  MARKET_STATE_MODULE_ID,
  MARKET_STATE_NON_OWNED,
  MARKET_STATE_OWNED_CONCERNS,
  isMarketStateForbiddenCapability,
  marketStateCommandsSessions,
  marketStateForcesTrade,
  marketStateIsExecutionSourceOfTruth,
  marketStateIsProfile,
  marketStateIsQualification,
  marketStateOwnsProfileVersions,
  marketStateOwnsQualificationDecisions,
  marketStateSelectsStrategies,
  type MarketStateBoundary,
  type MarketStateForbiddenCapability,
  type MarketStateNonOwned,
  type MarketStateOwnedConcern,
} from './domain/market-state-boundary';

export {
  MARKET_STATE_DOMAIN_AUTHORITY_CLASS,
  MARKET_STATE_LIFECYCLE_STATUSES,
  MARKET_STATE_LIFECYCLE_TRANSITIONS,
  MARKET_STATE_REGIME_LABELS,
  assertMarketStateLifecycleTransition,
  assertIsoTimestamp,
  assertNonEmptyString,
  assertPositiveVersion,
  canTransitionMarketStateLifecycle,
  deepFreeze,
  isMarketStateLifecycleStatus,
  isMarketStateRegimeLabel,
  type MarketStateLifecycleStatus,
  type MarketStateRegimeLabel,
} from './domain/market-state-domain-shared';

export {
  createMarketState,
  publishNextMarketState,
  withMarketStateLifecycle,
  type CreateMarketStateInput,
  type MarketState,
} from './domain/market-state';

export {
  createMarketStateLifecycle,
  transitionMarketStateLifecycle,
  type CreateMarketStateLifecycleInput,
  type MarketStateLifecycle,
} from './domain/market-state-lifecycle';

export {
  createMarketStateMetadata,
  type CreateMarketStateMetadataInput,
  type MarketStateMetadata,
} from './domain/market-state-metadata';

export {
  createMarketStateSnapshot,
  type CreateMarketStateSnapshotInput,
  type MarketStateSnapshot,
} from './domain/market-state-snapshot';

export {
  assertNextVersionMonotonic,
  assertNoVersionOverwrite,
  createMarketStateVersion,
  type CreateMarketStateVersionInput,
  type MarketStateVersion,
} from './domain/market-state-version';

export {
  MARKET_STATE_INPUT_OBSERVATION_AUTHORITY,
  MARKET_STATE_INPUT_RESEARCH_AUTHORITY,
  toExchangeMetadataInputs,
  toMarketSnapshotInputs,
  toProfileLatestInput,
  toProfileVersionMetadataInput,
  toProfileVersionMetadataInputs,
  toQualificationConfidenceInput,
  toQualificationHealthInput,
  toQualificationLifecycleInput,
  toQualificationSummaryInput,
  toSymbolStateBundle,
  type ExchangeMetadataInput,
  type MarketSnapshotInput,
  type MarketStateLiveMarketDataReadQuery,
  type MarketStateProfileVersionReadQuery,
  type MarketStateTargetReadQuery,
  type ProfileLatestInput,
  type ProfileVersionMetadataInput,
  type QualificationConfidenceInput,
  type QualificationHealthInput,
  type QualificationLifecycleInput,
  type QualificationSummaryInput,
  type SymbolStateBundle,
  type SymbolStateInput,
} from './domain/market-state-input-read-model';

export { MarketStateLiveMarketDataReadAdapter } from './adapters/live-market-data-read.adapter';
export { MarketStateProfileReadAdapter } from './adapters/profile-consumer-read.adapter';
export { MarketStateQualificationReadAdapter } from './adapters/qualification-consumer-read.adapter';
export { MarketStateConsumerReadAdapter } from './adapters/market-state-consumer-read.adapter';
export { MarketStateProjectionStore } from './domain/market-state-projection.store';
export {
  MARKET_STATE_CONSUMER_FLAGS,
  MARKET_STATE_CONSUMER_INTENDED,
  type MarketStateConsumerAudience,
  type MarketStateProjection,
  type MarketStateTransitionProjection,
} from './domain/market-state-consumer-read-model';
export { MarketStateBoundaryService } from './market-state-boundary.service';
export { MarketStateObservationalReadService } from './market-state-observational-read.service';
export { MarketStateModule } from './market-state.module';

export {
  MARKET_STATE_CONSUMER_READ_PORT,
  MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_STATE_PORTS_ACTIVE,
  MARKET_STATE_PROFILE_CONSUMER,
  MARKET_STATE_QUALIFICATION_CONSUMER,
  MARKET_STATE_QUERY_PORT,
  MARKET_STATE_SERVICE_PORT,
  type MarketStateConsumerReadPort,
  type MarketStateConsumerReadQuery,
  type MarketStateLiveMarketDataReadPort,
  type MarketStateProfileConsumerPort,
  type MarketStateQualificationConsumerPort,
  type MarketStateQueryPort,
  type MarketStateServicePort,
} from './ports/market-state.port';

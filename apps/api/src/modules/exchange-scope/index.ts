/**
 * RC-27 — Exchange Scope public barrel.
 *
 * Epic 1 exports: RC-19 identity + boundary + inactive ports + Nest module.
 * Epic 2 exports: immutable domain factories (no Nest port activation).
 */

export {
  DEFAULT_BINANCE_EXCHANGE_SCOPE,
  DEFAULT_BINANCE_EXCHANGE_SCOPE_ID,
  resolveExchangeScopeId,
  type ExchangeScopeIdentity,
} from './domain/exchange-scope-identity';

export { assertSameExchangeScope, sameExchangeScope } from './domain/trading-path-scope';

export {
  EXCHANGE_SCOPE_AUTHORITY_CLASS,
  EXCHANGE_SCOPE_BOUNDARY,
  EXCHANGE_SCOPE_DISTINCT_FROM,
  EXCHANGE_SCOPE_FORBIDDEN_CAPABILITIES,
  EXCHANGE_SCOPE_MODULE_ID,
  EXCHANGE_SCOPE_NON_OWNED,
  EXCHANGE_SCOPE_OWNED_CONCERNS,
  EXCHANGE_SCOPE_UI_ALIAS,
  exchangeScopeApprovesRisk,
  exchangeScopeForcesTrade,
  exchangeScopeIsExecutionEngine,
  exchangeScopeIsExecutionSourceOfTruth,
  exchangeScopeIsRiskEngine,
  exchangeScopeIsRuntime,
  exchangeScopeIsStrategyLibrary,
  exchangeScopeIsTradingSession,
  exchangeScopeOwnsSessionLifecycle,
  exchangeScopeOwnsStrategyCertification,
  exchangeScopeSubmitsOrders,
  isExchangeScopeForbiddenCapability,
  type ExchangeScopeBoundary,
  type ExchangeScopeForbiddenCapability,
  type ExchangeScopeNonOwned,
  type ExchangeScopeOwnedConcern,
} from './domain/exchange-scope-boundary';

export {
  EXCHANGE_POLICY_INPUT_AUTHORITY_CLASS,
  EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
  EXCHANGE_SCOPE_LIFECYCLE_STATUSES,
  EXCHANGE_SCOPE_LIFECYCLE_TRANSITIONS,
  EXCHANGE_SCOPE_MODE_CONTEXTS,
  EXCHANGE_SCOPE_VENUE_CODES,
  assertExchangeScopeLifecycleTransition,
  assertIsoTimestamp,
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPositiveVersion,
  canTransitionExchangeScopeLifecycle,
  deepFreeze,
  exchangeScopeBlocksNewSessionCapacity,
  isExchangeScopeLifecycleStatus,
  isExchangeScopeModeContext,
  isExchangeScopeVenueCode,
  type ExchangeScopeLifecycleStatus,
  type ExchangeScopeModeContext,
  type ExchangeScopeVenueCode,
} from './domain/exchange-scope-domain-shared';

export {
  assertNextVersionMonotonic,
  assertNoVersionOverwrite,
  createExchangeScopeVersion,
  type CreateExchangeScopeVersionInput,
  type ExchangeScopeVersion,
} from './domain/exchange-scope-version';

export {
  createExchangeScopeLifecycle,
  transitionExchangeScopeLifecycle,
  type CreateExchangeScopeLifecycleInput,
  type ExchangeScopeLifecycle,
} from './domain/exchange-scope-lifecycle';

export {
  createExchangeConfiguration,
  createExchangeScopeConfig,
  type CreateExchangeScopeConfigInput,
  type ExchangeConfiguration,
  type ExchangeScopeConfig,
} from './domain/exchange-scope-config';

export {
  createExchangeMetadata,
  createExchangeScopeMetadata,
  type CreateExchangeScopeMetadataInput,
  type ExchangeMetadata,
  type ExchangeScopeMetadata,
} from './domain/exchange-scope-metadata';

export {
  createExchangePolicyInputs,
  createExchangeRiskPolicy,
  publishNextExchangeRiskPolicy,
  type CreateExchangeRiskPolicyInput,
  type ExchangePolicyInputs,
  type ExchangeRiskPolicy,
  type ExchangeRiskPolicyLimits,
} from './domain/exchange-risk-policy';

export {
  createExchangeAccountBinding,
  createTradingAccountBinding,
  unbindExchangeAccount,
  unbindTradingAccount,
  TRADING_ACCOUNT_BINDING_STATUSES,
  type CreateTradingAccountBindingInput,
  type ExchangeAccountBinding,
  type TradingAccountBinding,
  type TradingAccountBindingStatus,
} from './domain/trading-account-binding';

export {
  createAdapterBindingContext,
  ADAPTER_BINDING_CONTEXT_STATUSES,
  type AdapterBindingContext,
  type AdapterBindingContextStatus,
  type CreateAdapterBindingContextInput,
} from './domain/adapter-binding-context';

export {
  createExchangeScope,
  publishNextExchangeScopeConfig,
  withExchangeScopeLifecycle,
  type CreateExchangeScopeInput,
  type ExchangeScope,
} from './domain/exchange-scope';

export { ExchangeScopeBoundaryService } from './exchange-scope-boundary.service';
export { ExchangeScopeLifecycleService } from './exchange-scope-lifecycle.service';
export { ExchangeScopeQueryService } from './exchange-scope-query.service';
export { ExchangeScopeConsumerReadService } from './exchange-scope-consumer-read.service';
export { ExchangeScopeModule } from './exchange-scope.module';
export { InMemoryExchangeScopeStore } from './adapters/in-memory-exchange-scope-store';
export { ExchangeScopeConsumerReadAdapter } from './adapters/exchange-scope-consumer-read.adapter';

export {
  deriveAdapterBindingContextId,
  deriveExchangeRiskPolicyId,
  deriveExchangeScopeId,
  deriveTradingAccountBindingId,
} from './application/derive-exchange-scope-ids';

export {
  EXCHANGE_POLICY_CONSUMER_FLAGS,
  EXCHANGE_SCOPE_CONSUMER_FLAGS,
  EXCHANGE_SCOPE_CONSUMER_INTENDED,
  type ExchangeRiskPolicyProjection,
  type ExchangeScopeActiveStatusProjection,
  type ExchangeScopeConfigProjection,
  type ExchangeScopeConsumerAudience,
  type ExchangeScopeLifecycleProjection,
  type ExchangeScopeMetadataProjection,
  type ExchangeScopeProjection,
  type ExchangeScopeWorkspaceAggregateProjection,
  type TradingAccountBindingProjection,
} from './domain/exchange-scope-consumer-read-model';

export {
  EXCHANGE_SCOPE_CONSUMER_READ_PORT,
  EXCHANGE_SCOPE_PORTS_ACTIVE,
  EXCHANGE_SCOPE_QUERY_PORT,
  EXCHANGE_SCOPE_SERVICE_PORT,
  type ActivateExchangeScope,
  type AdapterBindingContextResult,
  type ArchiveExchangeScope,
  type BindTradingAccount,
  type ExchangeRiskPolicyResult,
  type ExchangeScopeConsumerReadPort,
  type ExchangeScopeConsumerReadQuery,
  type ExchangeScopeQueryPort,
  type ExchangeScopeResult,
  type ExchangeScopeServicePort,
  type ExchangeScopeSummary,
  type ExchangeScopeView,
  type PublishExchangeRiskPolicy,
  type RegisterExchangeScope,
  type SetAdapterBindingContext,
  type SuspendExchangeScope,
  type TradingAccountBindingResult,
  type UnbindTradingAccount,
  type UpdateExchangeScopeConfig,
} from './ports/exchange-scope.port';

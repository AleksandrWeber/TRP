export { LiveMarketDataModule } from './live-market-data.module';

export type { MarketDataSourceId } from './domain/market-data-source';
export { toMarketDataSourceId } from './domain/market-data-source';

export { MarketStreamChannel, isMarketStreamChannel } from './domain/market-stream-channel';
export { MarketEventType, isMarketEventType } from './domain/market-event-type';

export type { MarketEventId } from './domain/market-event-id';
export { toMarketEventId } from './domain/market-event-id';

export type { MarketStreamId } from './domain/market-stream-id';
export { toMarketStreamId } from './domain/market-stream-id';

export type { MarketSubscriptionId } from './domain/market-subscription-id';
export { toMarketSubscriptionId } from './domain/market-subscription-id';

export type { MarketEventEnvelope } from './domain/market-event-envelope';

export type {
  MarketEventTimestamps,
  MarketEventTimestampInput,
} from './domain/market-event-timestamps';
export { resolveMarketEventTimestamps } from './domain/resolve-market-event-timestamps';

export type { MarketEventSemanticIdentity } from './domain/market-event-identity';
export {
  buildClosedCandleSemanticIdentity,
  buildMarkPriceSemanticIdentity,
  buildMarketStatusSemanticIdentity,
  buildMarketEventSemanticIdentity,
  eventIdFromSemanticIdentity,
} from './domain/market-event-identity';

export type { MarketStreamIdentityParts } from './domain/market-stream-identity';
export { buildMarketStreamId } from './domain/market-stream-identity';

export type { ClosedCandleEvent, ClosedCandleEventInput } from './domain/closed-candle-event';
export { createClosedCandleEvent } from './domain/closed-candle-event';

export type { MarkPriceEvent, MarkPriceEventInput } from './domain/mark-price-event';
export { createMarkPriceEvent } from './domain/mark-price-event';

export type { MarketStatusEvent, MarketStatusEventInput } from './domain/market-status';
export {
  MarketHealthStatus,
  isMarketHealthStatus,
  createMarketStatusEvent,
} from './domain/market-status';

export type { MarketEvent } from './domain/market-event';
export { isClosedCandleEvent, isMarkPriceEvent, isMarketStatusEvent } from './domain/market-event';

export type { MarketSubscription, MarketSubscriptionInput } from './domain/market-subscription';
export {
  MarketSubscriptionState,
  isMarketSubscriptionState,
  createMarketSubscription,
} from './domain/market-subscription';

export type { MarketCheckpoint, MarketCheckpointInput } from './domain/market-checkpoint';
export { createMarketCheckpoint } from './domain/market-checkpoint';

export {
  ConnectorConnectionState,
  isConnectorConnectionState,
} from './ports/connector-connection-state';
export type {
  LiveMarketConnector,
  LiveMarketConnectorCapabilities,
  LiveMarketConnectorHealth,
  LiveMarketSubscribeRequest,
  LiveMarketBackfillRequest,
  InstrumentPrecisionMetadata,
  ClosedCandleBackfillBar,
} from './ports/live-market-connector';
export { LiveMarketConnectorRegistry } from './ports/live-market-connector-registry';
export { LIVE_MARKET_CONNECTOR_REGISTRY } from './ports/live-market-connector-registry.token';
export {
  FakeLiveMarketConnector,
  type FakeLiveMarketConnectorOptions,
} from './ports/fake-live-market-connector';

export { BINANCE_SPOT_SOURCE_ID } from './connectors/binance/binance-spot.source';
export {
  BinanceRestAdapter,
  type BinanceRestAdapterOptions,
} from './connectors/binance/binance-rest.adapter';
export {
  BinanceWebSocketConnector,
  type BinanceWebSocketConnectorOptions,
  type TrackedSubscription,
  type SubscriptionAckStatus,
} from './connectors/binance/binance-websocket.connector';
export { FakeWebSocket, createFakeWebSocketFactory } from './connectors/binance/fake-websocket';
export {
  DEFAULT_CONNECTOR_RESILIENCE_POLICY,
  computeReconnectDelayMs,
  computeRateLimitDelayMs,
  type ConnectorResiliencePolicy,
} from './connectors/binance/connector-resilience-policy';

export type { ClosedCandleDraft } from './normalization/closed-candle-draft';
export {
  normalizeClosedCandle,
  closedCandlesAreSemanticallyEqual,
  type ClosedCandleNormalizationResult,
} from './normalization/normalize-closed-candle';

export type { MarkPriceDraft } from './normalization/mark-price-draft';
export { MarkPriceSourceKind } from './normalization/mark-price-draft';
export {
  normalizeMarkPrice,
  markPricesAreSemanticallyEqual,
  type MarkPriceNormalizationResult,
} from './normalization/normalize-mark-price';
export {
  DEFAULT_MARK_PRICE_PUBLICATION_POLICY,
  resolveMarkPricePublicationPolicy,
  shouldPublishMarkPrice,
  type MarkPricePublicationPolicy,
} from './normalization/mark-price-publication-policy';

export type { MarketDataQuarantineRecord } from './normalization/market-data-quarantine';
export { createMarketDataQuarantine } from './normalization/market-data-quarantine';
export {
  MarketDataValidator,
  type MarketValidationResult,
} from './normalization/market-data-validator';

export {
  MarketStreamIntegrityStatus,
  isMarketStreamIntegrityStatus,
  createInitialIntegrityState,
  emptyIntegrityMetrics,
  type MarketStreamIntegrityState,
  type MarketStreamIntegrityMetrics,
} from './integrity/market-stream-integrity-state';
export {
  MarketStreamIntegrityController,
  type MarketStreamAdmitResult,
} from './integrity/market-stream-integrity-controller';
export {
  detectClosedCandleGap,
  enumerateGapOpenTimes,
  markGapUnresolved,
  type ClosedCandleGap,
} from './integrity/closed-candle-gap';
export { timeframeDurationMs } from './integrity/timeframe-duration';
export { mapBackfillBarToClosedCandleDraft } from './integrity/map-backfill-bar-to-draft';
export {
  ClosedCandleGapRecoveryService,
  streamHealthAfterRecovery,
  type GapRecoveryRequest,
  type GapRecoveryResult,
  type GapRecoveryBackfill,
} from './integrity/gap-recovery-service';

export {
  MarketSubscriptionRegistry,
  subscriptionIdFor,
  type MarketSubscribeCommand,
} from './subscriptions/market-subscription-registry';

export {
  MARKET_CHECKPOINT_PERSISTENCE,
  type DurableMarketCheckpoint,
  type MarketCheckpointPersistence,
} from './checkpoints/market-checkpoint-persistence';
export { InMemoryMarketCheckpointPersistence } from './checkpoints/in-memory-market-checkpoint.persistence';
export { PrismaMarketCheckpointPersistence } from './checkpoints/prisma-market-checkpoint.persistence';
export {
  MarketCheckpointStore,
  type AdvanceMarketCheckpointInput,
} from './checkpoints/market-checkpoint-store';

export {
  MARKET_SUBSCRIPTION_PERSISTENCE,
  type MarketSubscriptionPersistence,
} from './subscriptions/market-subscription-persistence';
export { InMemoryMarketSubscriptionPersistence } from './subscriptions/in-memory-market-subscription.persistence';
export { PrismaMarketSubscriptionPersistence } from './subscriptions/prisma-market-subscription.persistence';

export { LiveEventBuffer } from './recovery/live-event-buffer';
export {
  StartupRecoveryService,
  type StartupRecoveryDeps,
  type StartupRecoveryResult,
  type StreamRecoveryReport,
} from './recovery/startup-recovery.service';

export {
  LATEST_MARKET_STATE_CONSUMER_ID,
  LATEST_MARKET_STATE_CONSUMER_VERSION,
  type LatestMarketState,
} from './projection/latest-market-state';
export { LatestMarketStateProjection } from './projection/latest-market-state-projection';

export {
  evaluateMarketHealth,
  isMarketStreamHealthy,
  isOperationallyFresh,
  DEFAULT_MARKET_STALENESS_POLICY,
  type MarketStalenessPolicy,
  type MarketHealthEvaluationInput,
} from './status/market-health-evaluator';
export {
  canTransitionMarketHealth,
  assertMarketHealthTransition,
} from './status/market-health-transitions';
export {
  MarketStatusService,
  type MarketStatusSnapshot,
  type ApplyMarketStatusInput,
} from './status/market-status.service';

export {
  LiveMarketMetricNames,
  LIVE_MARKET_ALLOWED_LABEL_KEYS,
  LiveMarketDataMetrics,
  assertBoundedLabels,
  type LiveMarketMetricLabels,
  type LiveMarketMetricsSnapshot,
} from './observability/live-market-data.metrics';
export {
  buildLiveMarketLog,
  sanitizeLogFields,
  type LiveMarketLogFields,
  type LiveMarketLogRecord,
} from './observability/live-market-log';
export {
  LiveMarketHealthProbes,
  type RequiredStreamRef,
  type LiveMarketProbeResult,
} from './observability/live-market-health-probes';

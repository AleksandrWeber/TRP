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

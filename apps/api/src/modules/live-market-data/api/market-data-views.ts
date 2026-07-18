/**
 * Canonical read DTOs for live market-data APIs (US146).
 * Provider-neutral — never include Binance raw fields.
 */

export type MarketSubscriptionView = Readonly<{
  id: string;
  workspaceId: string;
  sourceId: string;
  instrument: string;
  channel: string;
  streamId: string;
  timeframe?: string;
  state: string;
  updatedAt: string;
}>;

export type MarketStreamStatusView = Readonly<{
  workspaceId: string;
  sourceId: string;
  instrument: string;
  streamId: string;
  status: string;
  sequence: number;
  reason: string | null;
  updatedAt: string;
  lastOperationalMessageAt: string | null;
  /** Explicit: health is operational only and never authoritative for trading. */
  operationalOnly: true;
}>;

export type MarketClosedCandleView = Readonly<{
  eventId: string;
  instrument: string;
  timeframe: string;
  openTime: string;
  closeTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  exchangeOccurredAt: string;
  sequence: number;
}>;

export type MarketMarkPriceView = Readonly<{
  eventId: string;
  instrument: string;
  price: number;
  exchangeOccurredAt: string;
  sequence: number;
}>;

export type MarketCheckpointView = Readonly<{
  workspaceId: string;
  streamId: string;
  sourceId: string;
  instrument: string;
  channel: string;
  timeframe?: string;
  lastSequence: number;
  lastEventId: string | null;
  lastOccurredAt: string | null;
  health: string;
  heartbeatAt: string | null;
  updatedAt: string;
}>;

export type MarketLatestStateView = Readonly<{
  workspaceId: string;
  streamId: string;
  sourceId: string;
  instrument: string;
  channel: string;
  timeframe?: string;
  latestClosedCandle: MarketClosedCandleView | null;
  latestMarkPrice: MarketMarkPriceView | null;
  checkpoint: MarketCheckpointView | null;
  freshnessAt: string | null;
  projectionVersion: number;
  updatedAt: string;
  /** UI/local cache must never treat this as authoritative. */
  authoritative: false;
}>;

export type MarketStreamDetailView = Readonly<{
  workspaceId: string;
  streamId: string;
  subscription: MarketSubscriptionView | null;
  status: MarketStreamStatusView | null;
  latest: MarketLatestStateView | null;
  checkpoint: MarketCheckpointView | null;
}>;

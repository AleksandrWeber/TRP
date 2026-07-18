import type { Instrument } from '../../market-data/instrument';
import type { Timeframe } from '../../market-data/timeframe';
import type { MarketDataSourceId } from '../domain/market-data-source';
import type { MarketStreamChannel } from '../domain/market-stream-channel';
import type { ConnectorConnectionState } from './connector-connection-state';

/**
 * Public-stream connector capabilities (US131).
 * Credentials must not be required for M1 public market data.
 */
export type LiveMarketConnectorCapabilities = Readonly<{
  supportsClosedCandle: boolean;
  supportsMarkPrice: boolean;
  supportsBackfill: boolean;
  requiresCredentials: false;
}>;

export type LiveMarketConnectorHealth = Readonly<{
  state: ConnectorConnectionState;
  lastError: string | null;
  updatedAt: string;
}>;

export type LiveMarketSubscribeRequest = Readonly<{
  workspaceId: string;
  instrument: Instrument | string;
  channel: MarketStreamChannel;
  timeframe?: Timeframe;
}>;

/**
 * Bounded closed-candle backfill request (US131 / US132).
 * Explicit start/end required — open-ended backfill is rejected by adapters.
 */
export type LiveMarketBackfillRequest = Readonly<{
  workspaceId: string;
  instrument: Instrument | string;
  timeframe: Timeframe;
  /** Inclusive ISO-8601 lower bound. */
  from: string;
  /** Inclusive ISO-8601 upper bound. */
  to: string;
}>;

/**
 * Provider-neutral instrument precision metadata (US131 / US132).
 * No exchange payload fields.
 */
export type InstrumentPrecisionMetadata = Readonly<{
  sourceId: MarketDataSourceId;
  instrument: Instrument;
  baseAsset: string;
  quoteAsset: string;
  pricePrecision: number;
  quantityPrecision: number;
  tickSize: string;
  stepSize: string;
}>;

/**
 * Closed-candle backfill row before full MarketEvent enrichment (US131).
 * Adapter-owned; normalization to MarketClosedCandle is Epic E3.
 */
export type ClosedCandleBackfillBar = Readonly<{
  instrument: Instrument;
  timeframe: Timeframe;
  openTime: string;
  closeTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** Exchange open-time (domain). */
  exchangeOccurredAt: string;
}>;

/**
 * Live Market connector port (US131 / ADR-017).
 * No strategy, Risk, Order, Fill, Position, Ledger, or Portfolio behavior.
 * Public streams only — no private trading credentials.
 */
export interface LiveMarketConnector {
  readonly sourceId: MarketDataSourceId;

  capabilities(): LiveMarketConnectorCapabilities;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  subscribe(request: LiveMarketSubscribeRequest): Promise<void>;

  unsubscribe(request: LiveMarketSubscribeRequest): Promise<void>;

  /**
   * Optional metadata lookup. Unsupported connectors throw explicitly.
   */
  getInstrumentMetadata?(instrument: Instrument | string): Promise<InstrumentPrecisionMetadata>;

  backfill(request: LiveMarketBackfillRequest): Promise<ClosedCandleBackfillBar[]>;

  health(): LiveMarketConnectorHealth;

  supportsInstrument(instrument: Instrument | string): boolean;

  supportsChannel(channel: MarketStreamChannel, timeframe?: Timeframe): boolean;
}

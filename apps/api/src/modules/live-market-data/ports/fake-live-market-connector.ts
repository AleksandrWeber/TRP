import { toInstrument, type Instrument } from '../../market-data/instrument';
import type { Timeframe } from '../../market-data/timeframe';
import { toMarketDataSourceId } from '../domain/market-data-source';
import { MarketStreamChannel } from '../domain/market-stream-channel';
import { ConnectorConnectionState } from './connector-connection-state';
import type {
  ClosedCandleBackfillBar,
  InstrumentPrecisionMetadata,
  LiveMarketBackfillRequest,
  LiveMarketConnector,
  LiveMarketConnectorCapabilities,
  LiveMarketConnectorHealth,
  LiveMarketSubscribeRequest,
} from './live-market-connector';

export type FakeLiveMarketConnectorOptions = {
  sourceId?: string;
  instruments?: ReadonlyArray<string>;
  channels?: ReadonlyArray<MarketStreamChannel>;
  backfillBars?: ClosedCandleBackfillBar[];
  metadata?: InstrumentPrecisionMetadata[];
};

/**
 * In-memory LiveMarketConnector for tests (US131).
 * No network access.
 */
export class FakeLiveMarketConnector implements LiveMarketConnector {
  readonly sourceId;
  private state: ConnectorConnectionState = ConnectorConnectionState.DISCONNECTED;
  private lastError: string | null = null;
  private updatedAt = '1970-01-01T00:00:00.000Z';
  private readonly subscriptions = new Set<string>();
  private readonly instruments: Set<string>;
  private readonly channels: Set<MarketStreamChannel>;
  private readonly backfillBars: ClosedCandleBackfillBar[];
  private readonly metadataByInstrument: Map<string, InstrumentPrecisionMetadata>;

  constructor(options: FakeLiveMarketConnectorOptions = {}) {
    this.sourceId = toMarketDataSourceId(options.sourceId ?? 'fake_public');
    this.instruments = new Set(
      (options.instruments ?? ['BTCUSDT', 'ETHUSDT']).map((s) => s.trim().toUpperCase()),
    );
    this.channels = new Set(
      options.channels ?? [MarketStreamChannel.CLOSED_CANDLE, MarketStreamChannel.MARK_PRICE],
    );
    this.backfillBars = [...(options.backfillBars ?? [])];
    this.metadataByInstrument = new Map(
      (options.metadata ?? []).map((row) => [String(row.instrument).toUpperCase(), row]),
    );
  }

  capabilities(): LiveMarketConnectorCapabilities {
    return Object.freeze({
      supportsClosedCandle: this.channels.has(MarketStreamChannel.CLOSED_CANDLE),
      supportsMarkPrice: this.channels.has(MarketStreamChannel.MARK_PRICE),
      supportsBackfill: true,
      requiresCredentials: false,
    });
  }

  async connect(): Promise<void> {
    this.setState(ConnectorConnectionState.CONNECTING);
    this.setState(ConnectorConnectionState.CONNECTED);
    this.setState(ConnectorConnectionState.READY);
  }

  async disconnect(): Promise<void> {
    this.setState(ConnectorConnectionState.DISCONNECTING);
    this.subscriptions.clear();
    this.setState(ConnectorConnectionState.DISCONNECTED);
  }

  async subscribe(request: LiveMarketSubscribeRequest): Promise<void> {
    this.assertConnected();
    this.assertSupported(request.instrument, request.channel, request.timeframe);
    const key = subscriptionKey(request);
    this.subscriptions.add(key);
  }

  async unsubscribe(request: LiveMarketSubscribeRequest): Promise<void> {
    this.subscriptions.delete(subscriptionKey(request));
  }

  async getInstrumentMetadata(
    instrument: Instrument | string,
  ): Promise<InstrumentPrecisionMetadata> {
    const symbol = String(instrument).trim().toUpperCase();
    if (!this.supportsInstrument(symbol)) {
      throw new Error(`unsupported instrument: ${symbol}`);
    }
    const found = this.metadataByInstrument.get(symbol);
    if (!found) {
      throw new Error(`instrument metadata not found: ${symbol}`);
    }
    return found;
  }

  async backfill(request: LiveMarketBackfillRequest): Promise<ClosedCandleBackfillBar[]> {
    this.assertSupported(request.instrument, MarketStreamChannel.CLOSED_CANDLE, request.timeframe);
    if (!request.from || !request.to) {
      throw new Error('backfill requires explicit from and to bounds');
    }
    if (request.from > request.to) {
      throw new Error('from must be less than or equal to to');
    }
    const instrument = toInstrument(String(request.instrument).trim().toUpperCase());
    return this.backfillBars.filter(
      (bar) =>
        bar.instrument === instrument &&
        bar.timeframe === request.timeframe &&
        bar.openTime >= request.from &&
        bar.closeTime <= request.to,
    );
  }

  health(): LiveMarketConnectorHealth {
    return Object.freeze({
      state: this.state,
      lastError: this.lastError,
      updatedAt: this.updatedAt,
    });
  }

  supportsInstrument(instrument: Instrument | string): boolean {
    return this.instruments.has(String(instrument).trim().toUpperCase());
  }

  supportsChannel(channel: MarketStreamChannel, timeframe?: Timeframe): boolean {
    if (!this.channels.has(channel)) return false;
    if (channel === MarketStreamChannel.CLOSED_CANDLE && timeframe === undefined) {
      return false;
    }
    return true;
  }

  /** Test helper. */
  activeSubscriptions(): ReadonlyArray<string> {
    return Object.freeze([...this.subscriptions].sort());
  }

  private assertConnected(): void {
    if (
      this.state !== ConnectorConnectionState.CONNECTED &&
      this.state !== ConnectorConnectionState.READY &&
      this.state !== ConnectorConnectionState.SUBSCRIBING
    ) {
      throw new Error(`connector is not connected (state=${this.state})`);
    }
  }

  private assertSupported(
    instrument: Instrument | string,
    channel: MarketStreamChannel,
    timeframe?: Timeframe,
  ): void {
    const symbol = String(instrument).trim().toUpperCase();
    if (!this.supportsInstrument(symbol)) {
      throw new Error(`unsupported instrument: ${symbol}`);
    }
    if (!this.supportsChannel(channel, timeframe)) {
      throw new Error(
        `unsupported channel: ${channel}${timeframe !== undefined ? `/${timeframe}` : ''}`,
      );
    }
  }

  private setState(state: ConnectorConnectionState): void {
    this.state = state;
    this.updatedAt = new Date().toISOString();
    if (state !== ConnectorConnectionState.FAILED) {
      this.lastError = null;
    }
  }
}

function subscriptionKey(request: LiveMarketSubscribeRequest): string {
  const instrument = String(request.instrument).trim().toUpperCase();
  const tf = request.timeframe ?? '';
  return `${request.workspaceId}:${instrument}:${request.channel}:${tf}`;
}

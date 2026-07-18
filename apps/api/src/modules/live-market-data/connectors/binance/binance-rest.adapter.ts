import { toInstrument, type Instrument } from '../../../market-data/instrument';
import type { Timeframe } from '../../../market-data/timeframe';
import { MarketStreamChannel } from '../../domain/market-stream-channel';
import { ConnectorConnectionState } from '../../ports/connector-connection-state';
import type {
  ClosedCandleBackfillBar,
  InstrumentPrecisionMetadata,
  LiveMarketBackfillRequest,
  LiveMarketConnector,
  LiveMarketConnectorCapabilities,
  LiveMarketConnectorHealth,
  LiveMarketSubscribeRequest,
} from '../../ports/live-market-connector';
import { BINANCE_SPOT_SOURCE_ID } from './binance-spot.source';
import type { BinanceExchangeInfoResponse } from './binance-rest.types';
import { findBinanceSymbol, mapBinanceSymbolToMetadata } from './map-binance-exchange-info';
import { mapBinanceKlinesToClosedBars } from './map-binance-klines';
import { timeframeToBinanceInterval } from './binance-timeframe';
import {
  computeRateLimitDelayMs,
  DEFAULT_CONNECTOR_RESILIENCE_POLICY,
  type ConnectorResiliencePolicy,
} from './connector-resilience-policy';

const DEFAULT_REST_BASE = 'https://api.binance.com';
const MAX_KLINES_PER_REQUEST = 1000;

export type BinanceRestAdapterOptions = {
  /** Injected for tests — defaults to global fetch. */
  fetchImpl?: typeof fetch;
  restBaseUrl?: string;
  /** Clock for closed-candle filtering (tests). */
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  /** @deprecated Prefer policy.maxRateLimitRetries */
  maxRateLimitRetries?: number;
  policy?: Partial<ConnectorResiliencePolicy>;
};

/**
 * Binance Spot public REST adapter (US132).
 * Exchange payloads remain inside this connector — only canonical metadata/bars escape.
 * Does not accept private trading credentials.
 */
export class BinanceRestAdapter implements LiveMarketConnector {
  readonly sourceId = BINANCE_SPOT_SOURCE_ID;

  private readonly fetchImpl: typeof fetch;
  private readonly restBaseUrl: string;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly policy: ConnectorResiliencePolicy;
  private state: ConnectorConnectionState = ConnectorConnectionState.DISCONNECTED;
  private lastError: string | null = null;
  private updatedAt = '1970-01-01T00:00:00.000Z';
  private exchangeInfoCache: BinanceExchangeInfoResponse | null = null;

  constructor(options: BinanceRestAdapterOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
    this.restBaseUrl = (options.restBaseUrl ?? DEFAULT_REST_BASE).replace(/\/$/, '');
    this.now = options.now ?? (() => Date.now());
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.policy = Object.freeze({
      ...DEFAULT_CONNECTOR_RESILIENCE_POLICY,
      ...options.policy,
      ...(options.maxRateLimitRetries !== undefined
        ? { maxRateLimitRetries: options.maxRateLimitRetries }
        : {}),
    });
  }

  capabilities(): LiveMarketConnectorCapabilities {
    return Object.freeze({
      supportsClosedCandle: true,
      supportsMarkPrice: false,
      supportsBackfill: true,
      requiresCredentials: false,
    });
  }

  async connect(): Promise<void> {
    this.setState(ConnectorConnectionState.CONNECTING);
    try {
      await this.loadExchangeInfo();
      this.setState(ConnectorConnectionState.READY);
    } catch (error) {
      this.fail(error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.setState(ConnectorConnectionState.DISCONNECTING);
    this.exchangeInfoCache = null;
    this.setState(ConnectorConnectionState.DISCONNECTED);
  }

  async subscribe(_request: LiveMarketSubscribeRequest): Promise<void> {
    throw new Error(
      'BinanceRestAdapter does not support live subscribe; use the WebSocket connector (US133)',
    );
  }

  async unsubscribe(_request: LiveMarketSubscribeRequest): Promise<void> {
    // Idempotent no-op for REST-only adapter.
  }

  async getInstrumentMetadata(
    instrument: Instrument | string,
  ): Promise<InstrumentPrecisionMetadata> {
    const info = await this.loadExchangeInfo();
    const symbol = findBinanceSymbol(info, String(instrument));
    return mapBinanceSymbolToMetadata(symbol);
  }

  async backfill(request: LiveMarketBackfillRequest): Promise<ClosedCandleBackfillBar[]> {
    assertBackfillBounds(request);
    if (!this.supportsChannel(MarketStreamChannel.CLOSED_CANDLE, request.timeframe)) {
      throw new Error(`unsupported channel: closed_candle/${request.timeframe}`);
    }

    const instrument = toInstrument(String(request.instrument).trim().toUpperCase());
    // Ensure instrument exists via exchangeInfo
    await this.getInstrumentMetadata(instrument);

    const interval = timeframeToBinanceInterval(request.timeframe);
    const startTime = Date.parse(request.from);
    const endTime = Date.parse(request.to);
    const all: ClosedCandleBackfillBar[] = [];
    let cursor = startTime;

    while (cursor <= endTime) {
      const url = new URL(`${this.restBaseUrl}/api/v3/klines`);
      url.searchParams.set('symbol', instrument);
      url.searchParams.set('interval', interval);
      url.searchParams.set('startTime', String(cursor));
      url.searchParams.set('endTime', String(endTime));
      url.searchParams.set('limit', String(MAX_KLINES_PER_REQUEST));

      const payload = await this.fetchJson(url);
      const page = mapBinanceKlinesToClosedBars({
        klines: payload,
        instrument,
        timeframe: request.timeframe,
        fromIso: request.from,
        toIso: request.to,
        nowMs: this.now(),
      });

      if (!Array.isArray(payload) || payload.length === 0) {
        break;
      }

      all.push(...page);

      const last = payload[payload.length - 1] as unknown[];
      const lastOpen = Number(last?.[0]);
      if (!Number.isFinite(lastOpen) || lastOpen + 1 <= cursor) {
        throw new Error('Binance pagination cursor did not advance');
      }
      cursor = lastOpen + 1;
      if (payload.length < MAX_KLINES_PER_REQUEST) {
        break;
      }
    }

    // Deduplicate by openTime
    const byOpen = new Map<string, ClosedCandleBackfillBar>();
    for (const bar of all) {
      byOpen.set(bar.openTime, bar);
    }
    return [...byOpen.values()].sort((a, b) => a.openTime.localeCompare(b.openTime));
  }

  health(): LiveMarketConnectorHealth {
    return Object.freeze({
      state: this.state,
      lastError: this.lastError,
      updatedAt: this.updatedAt,
    });
  }

  supportsInstrument(instrument: Instrument | string): boolean {
    const wanted = String(instrument).trim().toUpperCase();
    if (!this.exchangeInfoCache?.symbols) return true; // deferred to metadata/backfill
    return this.exchangeInfoCache.symbols.some(
      (row) => String(row.symbol ?? '').toUpperCase() === wanted,
    );
  }

  supportsChannel(channel: MarketStreamChannel, timeframe?: Timeframe): boolean {
    if (channel !== MarketStreamChannel.CLOSED_CANDLE) return false;
    return timeframe !== undefined;
  }

  private async loadExchangeInfo(): Promise<BinanceExchangeInfoResponse> {
    if (this.exchangeInfoCache) return this.exchangeInfoCache;
    const url = new URL(`${this.restBaseUrl}/api/v3/exchangeInfo`);
    const payload = (await this.fetchJson(url)) as BinanceExchangeInfoResponse;
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.symbols)) {
      throw new Error('Binance exchangeInfo response is invalid or incomplete');
    }
    this.exchangeInfoCache = payload;
    return payload;
  }

  private async fetchJson(url: URL): Promise<unknown> {
    const response = await this.fetchWithRateLimitRetry(url);
    try {
      return await response.json();
    } catch {
      throw new Error('Binance response body is not valid JSON');
    }
  }

  private async fetchWithRateLimitRetry(url: URL): Promise<Response> {
    const maxRetries = this.policy.maxRateLimitRetries;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const response = await this.fetchImpl(url);
      if (response.status !== 418 && response.status !== 429) {
        if (!response.ok) {
          throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
        }
        return response;
      }
      if (attempt === maxRetries) {
        throw new Error(`Binance rate limit exceeded after ${maxRetries} retries`);
      }
      const waitMs = computeRateLimitDelayMs(
        this.policy,
        attempt + 1,
        response.headers.get('retry-after'),
      );
      await this.sleep(waitMs);
    }
    throw new Error('Binance request retry loop ended unexpectedly');
  }

  private setState(state: ConnectorConnectionState): void {
    this.state = state;
    this.updatedAt = new Date(this.now()).toISOString();
    if (state !== ConnectorConnectionState.FAILED) {
      this.lastError = null;
    }
  }

  private fail(error: unknown): void {
    this.state = ConnectorConnectionState.FAILED;
    this.lastError = error instanceof Error ? error.message : String(error);
    this.updatedAt = new Date(this.now()).toISOString();
  }
}

function assertBackfillBounds(request: LiveMarketBackfillRequest): void {
  if (!request.from?.trim() || !request.to?.trim()) {
    throw new Error('backfill requires explicit from and to bounds');
  }
  if (Number.isNaN(Date.parse(request.from)) || Number.isNaN(Date.parse(request.to))) {
    throw new Error('from and to must be valid ISO-8601 datetimes');
  }
  if (request.from > request.to) {
    throw new Error('from must be less than or equal to to');
  }
}

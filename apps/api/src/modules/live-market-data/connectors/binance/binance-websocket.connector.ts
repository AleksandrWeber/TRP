import { toInstrument, type Instrument } from '../../../market-data/instrument';
import type { Timeframe } from '../../../market-data/timeframe';
import { MarketStreamChannel } from '../../domain/market-stream-channel';
import { ConnectorConnectionState } from '../../ports/connector-connection-state';
import type {
  ClosedCandleBackfillBar,
  LiveMarketBackfillRequest,
  LiveMarketConnector,
  LiveMarketConnectorCapabilities,
  LiveMarketConnectorHealth,
  LiveMarketSubscribeRequest,
} from '../../ports/live-market-connector';
import { BINANCE_SPOT_SOURCE_ID } from './binance-spot.source';
import { subscriptionKey, toBinanceStreamName } from './binance-stream-name';
import { WS_OPEN, type WebSocketFactory, type WebSocketLike } from './websocket-like';

export type SubscriptionAckStatus = 'pending' | 'acked' | 'unsubscribed';

export type TrackedSubscription = Readonly<{
  key: string;
  streamName: string;
  requestId: number;
  status: SubscriptionAckStatus;
  request: LiveMarketSubscribeRequest;
}>;

export type BinanceWebSocketConnectorOptions = {
  webSocketFactory: WebSocketFactory;
  /** Public combined stream endpoint (no credentials). */
  streamUrl?: string;
  now?: () => number;
  /**
   * Rejected if present — public streams must not accept private credentials.
   */
  apiKey?: never;
  apiSecret?: never;
  secret?: never;
};

const DEFAULT_STREAM_URL = 'wss://stream.binance.com:9443/ws';

/**
 * Binance Spot public WebSocket connector lifecycle (US133).
 * Raw exchange messages are handled internally and never returned from the public API.
 * No private trading credentials.
 */
export class BinanceWebSocketConnector implements LiveMarketConnector {
  readonly sourceId = BINANCE_SPOT_SOURCE_ID;

  private readonly webSocketFactory: WebSocketFactory;
  private readonly streamUrl: string;
  private readonly now: () => number;
  private socket: WebSocketLike | null = null;
  private state: ConnectorConnectionState = ConnectorConnectionState.DISCONNECTED;
  private lastError: string | null = null;
  private updatedAt = '1970-01-01T00:00:00.000Z';
  private nextRequestId = 1;
  private readonly subscriptions = new Map<string, TrackedSubscription>();
  private readonly pendingByRequestId = new Map<number, string>();
  private readonly rawMessageCount = { value: 0 };
  private openHandler: ((event: unknown) => void) | null = null;
  private messageHandler: ((event: unknown) => void) | null = null;
  private closeHandler: ((event: unknown) => void) | null = null;
  private errorHandler: ((event: unknown) => void) | null = null;

  constructor(options: BinanceWebSocketConnectorOptions) {
    assertNoCredentials(options);
    this.webSocketFactory = options.webSocketFactory;
    this.streamUrl = options.streamUrl ?? DEFAULT_STREAM_URL;
    this.now = options.now ?? (() => Date.now());
  }

  capabilities(): LiveMarketConnectorCapabilities {
    return Object.freeze({
      supportsClosedCandle: true,
      supportsMarkPrice: true,
      supportsBackfill: false,
      requiresCredentials: false,
    });
  }

  async connect(): Promise<void> {
    if (
      this.state === ConnectorConnectionState.CONNECTED ||
      this.state === ConnectorConnectionState.READY ||
      this.state === ConnectorConnectionState.SUBSCRIBING
    ) {
      return;
    }

    this.setState(ConnectorConnectionState.CONNECTING);
    const socket = this.webSocketFactory(this.streamUrl);
    this.socket = socket;

    await new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        cleanup();
        this.setState(ConnectorConnectionState.CONNECTED);
        this.setState(ConnectorConnectionState.READY);
        resolve();
      };
      const onError = (event: unknown) => {
        cleanup();
        const message =
          event && typeof event === 'object' && 'message' in event
            ? String((event as { message: unknown }).message)
            : 'WebSocket connection failed';
        this.fail(message);
        reject(new Error(message));
      };
      const cleanup = () => {
        socket.removeEventListener('open', onOpen);
        socket.removeEventListener('error', onError);
      };
      this.openHandler = onOpen;
      this.errorHandler = onError;
      this.messageHandler = (event) => this.onMessage(event);
      this.closeHandler = () => this.onSocketClosed();
      socket.addEventListener('open', onOpen);
      socket.addEventListener('error', onError);
      socket.addEventListener('message', this.messageHandler);
      socket.addEventListener('close', this.closeHandler);

      // If factory returns an already-open socket (tests).
      if (socket.readyState === WS_OPEN) {
        onOpen();
      }
    });
  }

  async disconnect(): Promise<void> {
    this.setState(ConnectorConnectionState.DISCONNECTING);
    const socket = this.socket;
    this.socket = null;
    this.subscriptions.clear();
    this.pendingByRequestId.clear();
    if (socket) {
      this.detach(socket);
      if (socket.readyState === WS_OPEN || socket.readyState === 0) {
        socket.close(1000, 'shutdown');
      }
    }
    this.setState(ConnectorConnectionState.DISCONNECTED);
  }

  async subscribe(request: LiveMarketSubscribeRequest): Promise<void> {
    this.assertConnected();
    this.assertSupported(request);
    const key = subscriptionKey(request);
    const existing = this.subscriptions.get(key);
    if (existing && (existing.status === 'pending' || existing.status === 'acked')) {
      return; // idempotent
    }

    const streamName = toBinanceStreamName(request);
    const requestId = this.nextRequestId++;
    this.setState(ConnectorConnectionState.SUBSCRIBING);
    this.subscriptions.set(
      key,
      Object.freeze({
        key,
        streamName,
        requestId,
        status: 'pending',
        request: Object.freeze({ ...request }),
      }),
    );
    this.pendingByRequestId.set(requestId, key);
    this.send({
      method: 'SUBSCRIBE',
      params: [streamName],
      id: requestId,
    });
  }

  async unsubscribe(request: LiveMarketSubscribeRequest): Promise<void> {
    const key = subscriptionKey(request);
    const existing = this.subscriptions.get(key);
    if (!existing) {
      return; // idempotent
    }

    if (this.socket && this.socket.readyState === WS_OPEN) {
      const requestId = this.nextRequestId++;
      this.send({
        method: 'UNSUBSCRIBE',
        params: [existing.streamName],
        id: requestId,
      });
    }

    this.pendingByRequestId.delete(existing.requestId);
    this.subscriptions.set(
      key,
      Object.freeze({
        ...existing,
        status: 'unsubscribed',
      }),
    );
    this.subscriptions.delete(key);
  }

  async backfill(_request: LiveMarketBackfillRequest): Promise<ClosedCandleBackfillBar[]> {
    throw new Error(
      'BinanceWebSocketConnector does not support backfill; use BinanceRestAdapter (US132)',
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
    return String(instrument).trim() !== '';
  }

  supportsChannel(channel: MarketStreamChannel, timeframe?: Timeframe): boolean {
    if (channel === MarketStreamChannel.CLOSED_CANDLE) {
      return timeframe !== undefined;
    }
    if (channel === MarketStreamChannel.MARK_PRICE) {
      return true;
    }
    return false;
  }

  /** Observable subscription acknowledgements (US133). */
  listSubscriptions(): ReadonlyArray<TrackedSubscription> {
    return Object.freeze([...this.subscriptions.values()].map((row) => Object.freeze({ ...row })));
  }

  /** Test/observability helper — raw payload count only, never the payload. */
  getRawMessageCount(): number {
    return this.rawMessageCount.value;
  }

  private onMessage(event: unknown): void {
    this.rawMessageCount.value += 1;
    const data =
      event && typeof event === 'object' && 'data' in event
        ? (event as { data: unknown }).data
        : event;

    let parsed: unknown;
    try {
      parsed = typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
      // Malformed frames are swallowed at the adapter boundary.
      return;
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      'id' in parsed &&
      (parsed as { result?: unknown }).result === null
    ) {
      const id = Number((parsed as { id: unknown }).id);
      const key = this.pendingByRequestId.get(id);
      if (key) {
        const current = this.subscriptions.get(key);
        if (current) {
          this.subscriptions.set(
            key,
            Object.freeze({
              ...current,
              status: 'acked',
            }),
          );
          this.pendingByRequestId.delete(id);
          if (this.pendingByRequestId.size === 0) {
            this.setState(ConnectorConnectionState.READY);
          }
        }
      }
      return;
    }

    // Stream data stays inside the adapter for US133 (normalization is E3).
  }

  private onSocketClosed(): void {
    if (this.state === ConnectorConnectionState.DISCONNECTING) {
      return;
    }
    this.socket = null;
    this.setState(ConnectorConnectionState.DISCONNECTED);
  }

  private send(payload: Record<string, unknown>): void {
    if (!this.socket || this.socket.readyState !== WS_OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.socket.send(JSON.stringify(payload));
  }

  private detach(socket: WebSocketLike): void {
    if (this.openHandler) socket.removeEventListener('open', this.openHandler);
    if (this.messageHandler) socket.removeEventListener('message', this.messageHandler);
    if (this.closeHandler) socket.removeEventListener('close', this.closeHandler);
    if (this.errorHandler) socket.removeEventListener('error', this.errorHandler);
    this.openHandler = null;
    this.messageHandler = null;
    this.closeHandler = null;
    this.errorHandler = null;
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

  private assertSupported(request: LiveMarketSubscribeRequest): void {
    const instrument = toInstrument(String(request.instrument).trim().toUpperCase());
    if (!this.supportsInstrument(instrument)) {
      throw new Error(`unsupported instrument: ${instrument}`);
    }
    if (!this.supportsChannel(request.channel, request.timeframe)) {
      throw new Error(
        `unsupported channel: ${request.channel}${
          request.timeframe !== undefined ? `/${request.timeframe}` : ''
        }`,
      );
    }
  }

  private setState(state: ConnectorConnectionState): void {
    this.state = state;
    this.updatedAt = new Date(this.now()).toISOString();
    if (state !== ConnectorConnectionState.FAILED) {
      this.lastError = null;
    }
  }

  private fail(message: string): void {
    this.state = ConnectorConnectionState.FAILED;
    this.lastError = message;
    this.updatedAt = new Date(this.now()).toISOString();
  }
}

function assertNoCredentials(options: BinanceWebSocketConnectorOptions): void {
  const record = options as Record<string, unknown>;
  for (const key of ['apiKey', 'apiSecret', 'secret', 'privateKey']) {
    if (record[key] !== undefined) {
      throw new Error('BinanceWebSocketConnector does not accept private trading credentials');
    }
  }
}

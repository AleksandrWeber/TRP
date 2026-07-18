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
import {
  computeReconnectDelayMs,
  DEFAULT_CONNECTOR_RESILIENCE_POLICY,
  type ConnectorResiliencePolicy,
} from './connector-resilience-policy';
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
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  policy?: Partial<ConnectorResiliencePolicy>;
  /** When false, unexpected disconnect does not auto-reconnect (tests). */
  autoReconnect?: boolean;
  /**
   * Rejected if present — public streams must not accept private credentials.
   */
  apiKey?: never;
  apiSecret?: never;
  secret?: never;
};

const DEFAULT_STREAM_URL = 'wss://stream.binance.com:9443/ws';

/**
 * Binance Spot public WebSocket connector (US133 / US134).
 * Lifecycle + reconnect/backoff/heartbeat. Raw frames never escape the adapter.
 */
export class BinanceWebSocketConnector implements LiveMarketConnector {
  readonly sourceId = BINANCE_SPOT_SOURCE_ID;

  private readonly webSocketFactory: WebSocketFactory;
  private readonly streamUrl: string;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly random: () => number;
  private readonly policy: ConnectorResiliencePolicy;
  private readonly autoReconnect: boolean;

  private socket: WebSocketLike | null = null;
  private state: ConnectorConnectionState = ConnectorConnectionState.DISCONNECTED;
  private lastError: string | null = null;
  private updatedAt = '1970-01-01T00:00:00.000Z';
  private nextRequestId = 1;
  private readonly desiredSubscriptions = new Map<string, LiveMarketSubscribeRequest>();
  private readonly subscriptions = new Map<string, TrackedSubscription>();
  private readonly pendingByRequestId = new Map<number, string>();
  private readonly rawMessageCount = { value: 0 };
  private openHandler: ((event: unknown) => void) | null = null;
  private messageHandler: ((event: unknown) => void) | null = null;
  private closeHandler: ((event: unknown) => void) | null = null;
  private errorHandler: ((event: unknown) => void) | null = null;

  private shuttingDown = false;
  private reconnectAttempt = 0;
  private nextReconnectAt: string | null = null;
  private lastMessageAt: string | null = null;
  private awaitingGapRecovery = false;
  private heartbeatTimedOut = false;
  private reconnectInFlight: Promise<void> | null = null;

  constructor(options: BinanceWebSocketConnectorOptions) {
    assertNoCredentials(options);
    this.webSocketFactory = options.webSocketFactory;
    this.streamUrl = options.streamUrl ?? DEFAULT_STREAM_URL;
    this.now = options.now ?? (() => Date.now());
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.random = options.random ?? Math.random;
    this.policy = Object.freeze({
      ...DEFAULT_CONNECTOR_RESILIENCE_POLICY,
      ...options.policy,
    });
    this.autoReconnect = options.autoReconnect ?? true;
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
    this.shuttingDown = false;
    if (this.isLiveState(this.state)) {
      return;
    }

    this.setState(ConnectorConnectionState.CONNECTING);
    await this.openSocketAndAttach();
    this.reconnectAttempt = 0;
    this.nextReconnectAt = null;
    this.awaitingGapRecovery = false;
    this.heartbeatTimedOut = false;
    this.setState(ConnectorConnectionState.READY);
  }

  async disconnect(): Promise<void> {
    this.shuttingDown = true;
    this.setState(ConnectorConnectionState.DISCONNECTING);
    this.nextReconnectAt = null;
    this.reconnectAttempt = 0;
    this.awaitingGapRecovery = false;
    this.heartbeatTimedOut = false;
    const socket = this.socket;
    this.socket = null;
    this.desiredSubscriptions.clear();
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
    this.desiredSubscriptions.set(key, Object.freeze({ ...request }));

    const existing = this.subscriptions.get(key);
    if (existing && (existing.status === 'pending' || existing.status === 'acked')) {
      return; // idempotent — no duplicate wire subscribe
    }

    await this.armSubscription(request);
  }

  async unsubscribe(request: LiveMarketSubscribeRequest): Promise<void> {
    const key = subscriptionKey(request);
    this.desiredSubscriptions.delete(key);
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
      reconnectAttempt: this.reconnectAttempt,
      nextReconnectAt: this.nextReconnectAt,
      lastMessageAt: this.lastMessageAt,
      awaitingGapRecovery: this.awaitingGapRecovery,
      heartbeatTimedOut: this.heartbeatTimedOut,
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

  listSubscriptions(): ReadonlyArray<TrackedSubscription> {
    return Object.freeze([...this.subscriptions.values()].map((row) => Object.freeze({ ...row })));
  }

  getRawMessageCount(): number {
    return this.rawMessageCount.value;
  }

  /**
   * Gap recovery (US139) clears the post-reconnect recovering gate.
   * Until then, reconnect must not report READY.
   */
  markGapRecoveryComplete(): void {
    if (!this.awaitingGapRecovery) return;
    this.awaitingGapRecovery = false;
    if (this.state === ConnectorConnectionState.RECOVERING && this.pendingByRequestId.size === 0) {
      this.setState(ConnectorConnectionState.READY);
    }
  }

  /**
   * Heartbeat evaluation (US134). Call from a scheduler or tests.
   * Timeout forces an immediate unhealthy transition and reconnect.
   */
  async evaluateHeartbeat(nowMs = this.now()): Promise<void> {
    if (this.shuttingDown || !this.isLiveState(this.state)) return;
    if (this.lastMessageAt === null) {
      // No frames yet — use connection updatedAt as baseline after connect.
      this.lastMessageAt = this.updatedAt;
    }
    const last = Date.parse(this.lastMessageAt);
    if (!Number.isFinite(last)) return;
    if (nowMs - last < this.policy.heartbeatTimeoutMs) return;

    this.heartbeatTimedOut = true;
    this.lastError = 'heartbeat timeout';
    this.setState(ConnectorConnectionState.DISCONNECTED);
    await this.beginReconnect('heartbeat timeout');
  }

  /** Test helper — drive scheduled reconnect without waiting for close. */
  async forceReconnectForTest(): Promise<void> {
    await this.beginReconnect('forced');
  }

  private async openSocketAndAttach(): Promise<void> {
    const socket = this.webSocketFactory(this.streamUrl);
    this.socket = socket;

    await new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        cleanup();
        this.setState(ConnectorConnectionState.CONNECTED);
        this.lastMessageAt = new Date(this.now()).toISOString();
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
      this.closeHandler = () => {
        void this.onSocketClosed();
      };
      socket.addEventListener('open', onOpen);
      socket.addEventListener('error', onError);
      socket.addEventListener('message', this.messageHandler);
      socket.addEventListener('close', this.closeHandler);

      if (socket.readyState === WS_OPEN) {
        onOpen();
      }
    });
  }

  private async armSubscription(request: LiveMarketSubscribeRequest): Promise<void> {
    const key = subscriptionKey(request);
    const streamName = toBinanceStreamName(request);
    const requestId = this.nextRequestId++;
    if (
      this.state !== ConnectorConnectionState.RECOVERING &&
      this.state !== ConnectorConnectionState.RECONNECTING
    ) {
      this.setState(ConnectorConnectionState.SUBSCRIBING);
    }
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

  private async resubscribeDesired(): Promise<void> {
    this.subscriptions.clear();
    this.pendingByRequestId.clear();
    for (const request of this.desiredSubscriptions.values()) {
      await this.armSubscription(request);
    }
  }

  private onMessage(event: unknown): void {
    this.rawMessageCount.value += 1;
    this.lastMessageAt = new Date(this.now()).toISOString();
    this.heartbeatTimedOut = false;

    const data =
      event && typeof event === 'object' && 'data' in event
        ? (event as { data: unknown }).data
        : event;

    let parsed: unknown;
    try {
      parsed = typeof data === 'string' ? JSON.parse(data) : data;
    } catch {
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
            if (this.awaitingGapRecovery) {
              this.setState(ConnectorConnectionState.RECOVERING);
            } else {
              this.setState(ConnectorConnectionState.READY);
            }
          }
        }
      }
    }
  }

  private async onSocketClosed(): Promise<void> {
    if (this.shuttingDown || this.state === ConnectorConnectionState.DISCONNECTING) {
      return;
    }

    // Immediate health transition on disconnect (US134).
    this.socket = null;
    this.setState(ConnectorConnectionState.DISCONNECTED);
    this.lastError = this.lastError ?? 'socket closed';
    await this.beginReconnect('socket closed');
  }

  private async beginReconnect(reason: string): Promise<void> {
    if (this.shuttingDown || !this.autoReconnect) {
      return;
    }
    if (this.reconnectInFlight) {
      return this.reconnectInFlight;
    }

    this.reconnectInFlight = this.runReconnect(reason).finally(() => {
      this.reconnectInFlight = null;
    });
    return this.reconnectInFlight;
  }

  private async runReconnect(reason: string): Promise<void> {
    while (!this.shuttingDown && this.autoReconnect) {
      if (this.reconnectAttempt >= this.policy.maxReconnectAttempts) {
        this.fail(`reconnect exhausted after ${this.policy.maxReconnectAttempts} attempts`);
        this.nextReconnectAt = null;
        return;
      }

      this.reconnectAttempt += 1;
      const delayMs = computeReconnectDelayMs(this.policy, this.reconnectAttempt, this.random);
      this.nextReconnectAt = new Date(this.now() + delayMs).toISOString();
      this.lastError = reason;
      this.setState(ConnectorConnectionState.RECONNECTING);

      await this.sleep(delayMs);
      if (this.shuttingDown) return;

      try {
        await this.openSocketAndAttach();
        // Re-arm desired subscriptions without duplicating keys.
        await this.resubscribeDesired();
        this.nextReconnectAt = null;
        this.awaitingGapRecovery = true;
        // Reconnect alone must not claim READY/healthy (US134).
        this.setState(ConnectorConnectionState.RECOVERING);
        return;
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : String(error);
        // loop for next attempt
      }
    }
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

  private isLiveState(state: ConnectorConnectionState): boolean {
    return (
      state === ConnectorConnectionState.CONNECTED ||
      state === ConnectorConnectionState.READY ||
      state === ConnectorConnectionState.SUBSCRIBING ||
      state === ConnectorConnectionState.RECOVERING
    );
  }

  private assertConnected(): void {
    if (!this.isLiveState(this.state) && this.state !== ConnectorConnectionState.RECONNECTING) {
      throw new Error(`connector is not connected (state=${this.state})`);
    }
    if (this.state === ConnectorConnectionState.RECONNECTING) {
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
    if (
      state !== ConnectorConnectionState.FAILED &&
      state !== ConnectorConnectionState.RECONNECTING &&
      state !== ConnectorConnectionState.DISCONNECTED
    ) {
      // Keep lastError during reconnect diagnostics; clear on healthy paths.
      if (
        state === ConnectorConnectionState.READY ||
        state === ConnectorConnectionState.RECOVERING
      ) {
        if (!this.heartbeatTimedOut) {
          this.lastError = null;
        }
      }
    }
  }

  private fail(message: string): void {
    this.state = ConnectorConnectionState.FAILED;
    this.lastError = message;
    this.updatedAt = new Date(this.now()).toISOString();
    this.nextReconnectAt = null;
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

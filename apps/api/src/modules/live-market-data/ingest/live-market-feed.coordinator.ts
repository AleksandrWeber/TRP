import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { isTimeframe } from '../../market-data/timeframe';
import { BINANCE_SPOT_SOURCE_ID } from '../connectors/binance/binance-spot.source';
import { BinanceWebSocketConnector } from '../connectors/binance/binance-websocket.connector';
import { MarketStreamChannel } from '../domain/market-stream-channel';
import { ClosedCandleIngestService } from '../ingest/closed-candle-ingest.service';
import { LIVE_MARKET_CONNECTOR_REGISTRY } from '../ports/live-market-connector-registry.token';
import { LiveMarketConnectorRegistry } from '../ports/live-market-connector-registry';
import { MarketSubscriptionRegistry } from '../subscriptions/market-subscription-registry';

/**
 * Optional public-stream boot for paper market data.
 * Disabled unless LIVE_MARKET_WS_ENABLED=true. Tests inject candles via ingest.
 * Does not poll strategies. Connector frames are event-driven.
 */
@Injectable()
export class LiveMarketFeedCoordinator implements OnModuleInit {
  private readonly logger = new Logger(LiveMarketFeedCoordinator.name);

  constructor(
    @Inject(MarketSubscriptionRegistry)
    private readonly subscriptions: MarketSubscriptionRegistry,
    @Inject(LIVE_MARKET_CONNECTOR_REGISTRY)
    private readonly connectors: LiveMarketConnectorRegistry,
    @Inject(ClosedCandleIngestService)
    private readonly ingest: ClosedCandleIngestService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.subscriptions.hydrate();
    if (process.env.LIVE_MARKET_WS_ENABLED !== 'true') {
      return;
    }
    const webSocketFactory = resolvePublicWebSocketFactory();
    if (!webSocketFactory) {
      this.logger.warn(
        'LIVE_MARKET_WS_ENABLED is true but no public WebSocket factory is available',
      );
      return;
    }
    if (this.connectors.has(BINANCE_SPOT_SOURCE_ID)) {
      return;
    }
    const connector = new BinanceWebSocketConnector({
      webSocketFactory,
      onKlineFrame: (frame) => {
        const timeframe = frame.timeframe;
        if (!timeframe || !isTimeframe(String(timeframe))) return;
        void this.ingest.ingestKline({
          workspaceId: frame.workspaceId,
          timeframe,
          message: frame.message,
          receivedAt: frame.receivedAt,
          nowMs: Date.parse(frame.receivedAt),
        });
      },
    });
    this.connectors.register(connector);
    try {
      await connector.connect();
      for (const desired of this.subscriptions.desiredFor(BINANCE_SPOT_SOURCE_ID)) {
        if (desired.channel !== MarketStreamChannel.CLOSED_CANDLE) continue;
        await connector.subscribe({
          workspaceId: desired.workspaceId,
          instrument: desired.instrument,
          channel: desired.channel,
          ...(desired.timeframe !== undefined ? { timeframe: desired.timeframe } : {}),
        });
      }
    } catch (error) {
      this.logger.warn(
        `public market connector did not start: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

function resolvePublicWebSocketFactory(): ((url: string) => WebSocket) | null {
  const ctor = (globalThis as { WebSocket?: new (url: string) => WebSocket }).WebSocket;
  if (!ctor) return null;
  return (url: string) => new ctor(url);
}

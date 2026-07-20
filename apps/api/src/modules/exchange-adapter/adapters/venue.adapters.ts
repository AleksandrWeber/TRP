import {
  createExchangeCapabilities,
  type ExchangeCapabilities,
} from '../domain/exchange-capabilities';
import type { ExchangeId } from '../domain/exchange-id';
import type { ExchangeBalance, ExchangePosition, ExchangeTicker } from '../domain/exchange-market';
import type {
  ExchangeCancelRequest,
  ExchangeOrderRequest,
  ExchangeOrderResponse,
  ExchangeOrderSnapshot,
} from '../domain/exchange-order';
import {
  ExchangeConnectionFailedError,
  ExchangeNotConnectedError,
  ExchangeAdapterInternalError,
} from '../exchange-adapter-errors';
import type {
  ExchangeAdapter,
  ExecutionUpdateHandler,
  ExchangeSubscription,
  OrderUpdateHandler,
  TickerHandler,
} from '../exchange-adapter.port';

/**
 * Base for venue adapters that declare capabilities and support connection
 * lifecycle without live trading orchestration (US209 / out of scope: US210).
 * Live REST/WS I/O is intentionally stubbed until credentials are configured.
 */
export abstract class VenueExchangeAdapter implements ExchangeAdapter {
  abstract readonly exchangeId: ExchangeId;
  protected abstract readonly declaredCapabilities: ExchangeCapabilities;
  protected abstract readonly defaultMarkets: readonly string[];

  private connected = false;

  capabilities(): ExchangeCapabilities {
    return this.declaredCapabilities;
  }

  isConnected(): boolean {
    return this.connected;
  }

  supportedMarkets(): readonly string[] {
    return this.defaultMarkets;
  }

  apiPermissions(): readonly string[] {
    return Object.freeze(['spot.read', 'spot.trade']);
  }

  async connect(): Promise<void> {
    // Simulated connect — no live network until live trading orchestration (US210).
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async ping(): Promise<number> {
    this.ensureConnected();
    return 5;
  }

  async submitOrder(_order: ExchangeOrderRequest): Promise<ExchangeOrderResponse> {
    this.ensureConnected();
    throw new ExchangeAdapterInternalError(
      `${this.exchangeId} live order submission requires live trading orchestration (US210)`,
    );
  }

  async cancelOrder(_request: ExchangeCancelRequest): Promise<ExchangeOrderResponse> {
    this.ensureConnected();
    throw new ExchangeAdapterInternalError(
      `${this.exchangeId} live cancel requires live trading orchestration (US210)`,
    );
  }

  async getOrder(_exchangeOrderId: string): Promise<ExchangeOrderSnapshot | null> {
    this.ensureConnected();
    return null;
  }

  async getPositions(): Promise<readonly ExchangePosition[]> {
    this.ensureConnected();
    return Object.freeze([]);
  }

  async getBalances(): Promise<readonly ExchangeBalance[]> {
    this.ensureConnected();
    return Object.freeze([]);
  }

  async getMarketPrice(symbol: string): Promise<ExchangeTicker> {
    this.ensureConnected();
    return Object.freeze({
      symbol,
      bid: null,
      ask: null,
      last: '0',
      timestamp: new Date().toISOString(),
    });
  }

  subscribeTicker(_symbol: string, _handler: TickerHandler): ExchangeSubscription {
    return noopSubscription();
  }

  subscribeOrderUpdates(_handler: OrderUpdateHandler): ExchangeSubscription {
    return noopSubscription();
  }

  subscribeExecutionUpdates(_handler: ExecutionUpdateHandler): ExchangeSubscription {
    return noopSubscription();
  }

  protected ensureConnected(): void {
    if (!this.connected) {
      throw new ExchangeNotConnectedError(`${this.exchangeId} is not connected`);
    }
  }

  protected failConnect(cause?: unknown): never {
    throw new ExchangeConnectionFailedError(`failed to connect to ${this.exchangeId}`, cause);
  }
}

function noopSubscription(): ExchangeSubscription {
  return Object.freeze({ unsubscribe: () => undefined });
}

export class BinanceExchangeAdapter extends VenueExchangeAdapter {
  readonly exchangeId: ExchangeId = 'BINANCE';
  protected readonly declaredCapabilities = createExchangeCapabilities({
    supportsSpot: true,
    supportsMargin: true,
    supportsFutures: true,
    supportsWebSocket: true,
    supportsMarketOrders: true,
    supportsLimitOrders: true,
    supportsOCO: true,
    supportsReduceOnly: true,
  });
  protected readonly defaultMarkets = Object.freeze(['spot', 'margin', 'futures']);
}

export class BybitExchangeAdapter extends VenueExchangeAdapter {
  readonly exchangeId: ExchangeId = 'BYBIT';
  protected readonly declaredCapabilities = createExchangeCapabilities({
    supportsSpot: true,
    supportsMargin: false,
    supportsFutures: true,
    supportsWebSocket: true,
    supportsMarketOrders: true,
    supportsLimitOrders: true,
    supportsOCO: false,
    supportsReduceOnly: true,
  });
  protected readonly defaultMarkets = Object.freeze(['spot', 'futures']);
}

export class OkxExchangeAdapter extends VenueExchangeAdapter {
  readonly exchangeId: ExchangeId = 'OKX';
  protected readonly declaredCapabilities = createExchangeCapabilities({
    supportsSpot: true,
    supportsMargin: true,
    supportsFutures: true,
    supportsWebSocket: true,
    supportsMarketOrders: true,
    supportsLimitOrders: true,
    supportsOCO: false,
    supportsReduceOnly: true,
  });
  protected readonly defaultMarkets = Object.freeze(['spot', 'margin', 'futures', 'swap']);
}

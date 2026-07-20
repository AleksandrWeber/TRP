import type { ExchangeCapabilities } from './domain/exchange-capabilities';
import type { ExchangeId } from './domain/exchange-id';
import type {
  ExchangeBalance,
  ExchangeExecution,
  ExchangePosition,
  ExchangeTicker,
} from './domain/exchange-market';
import type {
  ExchangeCancelRequest,
  ExchangeOrderRequest,
  ExchangeOrderResponse,
  ExchangeOrderSnapshot,
} from './domain/exchange-order';

export type ExchangeSubscription = Readonly<{
  unsubscribe(): void;
}>;

export type TickerHandler = (ticker: ExchangeTicker) => void;
export type OrderUpdateHandler = (order: ExchangeOrderSnapshot) => void;
export type ExecutionUpdateHandler = (execution: ExchangeExecution) => void;

/**
 * Exchange Adapter port (US209).
 * Translates external exchange APIs into internal commands/events.
 * MUST NOT contain trading business logic or mutate Trading Core aggregates.
 */
export interface ExchangeAdapter {
  readonly exchangeId: ExchangeId;

  capabilities(): ExchangeCapabilities;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  isConnected(): boolean;

  submitOrder(order: ExchangeOrderRequest): Promise<ExchangeOrderResponse>;

  cancelOrder(request: ExchangeCancelRequest): Promise<ExchangeOrderResponse>;

  getOrder(exchangeOrderId: string): Promise<ExchangeOrderSnapshot | null>;

  getPositions(): Promise<readonly ExchangePosition[]>;

  getBalances(): Promise<readonly ExchangeBalance[]>;

  getMarketPrice(symbol: string): Promise<ExchangeTicker>;

  subscribeTicker(symbol: string, handler: TickerHandler): ExchangeSubscription;

  subscribeOrderUpdates(handler: OrderUpdateHandler): ExchangeSubscription;

  subscribeExecutionUpdates(handler: ExecutionUpdateHandler): ExchangeSubscription;

  /** Optional heartbeat probe used by connection management. */
  ping?(): Promise<number>;
}

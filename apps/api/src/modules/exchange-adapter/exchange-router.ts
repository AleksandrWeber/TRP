import { Injectable } from '@nestjs/common';
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
import { ExchangeNotConnectedError } from './exchange-adapter-errors';
import type { ExchangeAdapter } from './exchange-adapter.port';
import { ExchangeRegistry } from './exchange-registry';

/**
 * Exchange Router (US209): routes adapter commands to the connected venue instance.
 */
@Injectable()
export class ExchangeRouter {
  constructor(private readonly registry: ExchangeRegistry) {}

  resolve(exchangeId: ExchangeId): ExchangeAdapter {
    const adapter = this.registry.get(exchangeId);
    if (!adapter.isConnected()) {
      throw new ExchangeNotConnectedError(`${exchangeId} is not connected`);
    }
    return adapter;
  }

  async submitOrder(
    exchangeId: ExchangeId,
    order: ExchangeOrderRequest,
  ): Promise<ExchangeOrderResponse> {
    return this.resolve(exchangeId).submitOrder(order);
  }

  async cancelOrder(
    exchangeId: ExchangeId,
    request: ExchangeCancelRequest,
  ): Promise<ExchangeOrderResponse> {
    return this.resolve(exchangeId).cancelOrder(request);
  }

  async getOrder(
    exchangeId: ExchangeId,
    exchangeOrderId: string,
  ): Promise<ExchangeOrderSnapshot | null> {
    return this.resolve(exchangeId).getOrder(exchangeOrderId);
  }

  async getPositions(exchangeId: ExchangeId): Promise<readonly ExchangePosition[]> {
    return this.resolve(exchangeId).getPositions();
  }

  async getBalances(exchangeId: ExchangeId): Promise<readonly ExchangeBalance[]> {
    return this.resolve(exchangeId).getBalances();
  }

  async getMarketPrice(exchangeId: ExchangeId, symbol: string): Promise<ExchangeTicker> {
    return this.resolve(exchangeId).getMarketPrice(symbol);
  }

  async synchronizeExecutions(exchangeId: ExchangeId): Promise<readonly ExchangeExecution[]> {
    // Mock (and future venues) expose executions via subscription buffer / query.
    const adapter = this.resolve(exchangeId);
    if (adapter.exchangeId === 'MOCK' && 'listExecutions' in adapter) {
      return (adapter as { listExecutions(): readonly ExchangeExecution[] }).listExecutions();
    }
    return Object.freeze([]);
  }
}

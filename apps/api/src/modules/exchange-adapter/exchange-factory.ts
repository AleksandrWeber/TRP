import { Injectable } from '@nestjs/common';
import { MockExchangeAdapter } from './adapters/mock.adapter';
import {
  BinanceExchangeAdapter,
  BybitExchangeAdapter,
  OkxExchangeAdapter,
} from './adapters/venue.adapters';
import { assertExchangeId, type ExchangeId } from './domain/exchange-id';
import { ExchangeValidationError } from './exchange-adapter-errors';
import type { ExchangeAdapter } from './exchange-adapter.port';
import { ExchangeRegistry } from './exchange-registry';

/**
 * Exchange Factory (US209): creates and registers adapter instances by venue id.
 */
@Injectable()
export class ExchangeFactory {
  constructor(private readonly registry: ExchangeRegistry) {}

  create(exchangeId: string): ExchangeAdapter {
    const id = assertExchangeId(exchangeId);
    const existing = this.registry.tryGet(id);
    if (existing) return existing;

    const adapter = this.instantiate(id);
    this.registry.register(adapter);
    return adapter;
  }

  ensureAllRegistered(): readonly ExchangeAdapter[] {
    const ids: ExchangeId[] = ['MOCK', 'BINANCE', 'BYBIT', 'OKX'];
    return Object.freeze(ids.map((id) => this.create(id)));
  }

  private instantiate(exchangeId: ExchangeId): ExchangeAdapter {
    switch (exchangeId) {
      case 'MOCK':
        return new MockExchangeAdapter();
      case 'BINANCE':
        return new BinanceExchangeAdapter();
      case 'BYBIT':
        return new BybitExchangeAdapter();
      case 'OKX':
        return new OkxExchangeAdapter();
      default: {
        const _exhaustive: never = exchangeId;
        throw new ExchangeValidationError(`cannot instantiate ${_exhaustive}`);
      }
    }
  }
}

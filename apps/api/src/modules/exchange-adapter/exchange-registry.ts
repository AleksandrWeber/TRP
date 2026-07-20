import { Injectable } from '@nestjs/common';
import type { ExchangeCapabilities } from './domain/exchange-capabilities';
import type { ExchangeId } from './domain/exchange-id';
import { ExchangeNotFoundError } from './exchange-adapter-errors';
import type { ExchangeAdapter } from './exchange-adapter.port';

export type RegisteredAdapter = Readonly<{
  exchangeId: ExchangeId;
  adapter: ExchangeAdapter;
  capabilities: ExchangeCapabilities;
}>;

/**
 * Exchange Registry (US209): registration, discovery, lifecycle hooks, capability lookup.
 */
@Injectable()
export class ExchangeRegistry {
  private readonly adapters = new Map<ExchangeId, ExchangeAdapter>();

  register(adapter: ExchangeAdapter): void {
    this.adapters.set(adapter.exchangeId, adapter);
  }

  unregister(exchangeId: ExchangeId): void {
    this.adapters.delete(exchangeId);
  }

  has(exchangeId: ExchangeId): boolean {
    return this.adapters.has(exchangeId);
  }

  get(exchangeId: ExchangeId): ExchangeAdapter {
    const adapter = this.adapters.get(exchangeId);
    if (!adapter) {
      throw new ExchangeNotFoundError(`exchange adapter not registered: ${exchangeId}`);
    }
    return adapter;
  }

  tryGet(exchangeId: ExchangeId): ExchangeAdapter | null {
    return this.adapters.get(exchangeId) ?? null;
  }

  list(): readonly RegisteredAdapter[] {
    return Object.freeze(
      [...this.adapters.values()].map((adapter) =>
        Object.freeze({
          exchangeId: adapter.exchangeId,
          adapter,
          capabilities: adapter.capabilities(),
        }),
      ),
    );
  }

  listExchangeIds(): readonly ExchangeId[] {
    return Object.freeze([...this.adapters.keys()]);
  }

  getCapabilities(exchangeId: ExchangeId): ExchangeCapabilities {
    return this.get(exchangeId).capabilities();
  }

  clear(): void {
    this.adapters.clear();
  }
}

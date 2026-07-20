import { Injectable } from '@nestjs/common';
import type { MarketDataProvider } from './market-data-provider';

/**
 * Registry of live MarketDataProvider implementations (US006).
 * Exactly one provider is active at a time; consumers resolve the active
 * provider through the registry and never reference an implementation.
 */
@Injectable()
export class MarketDataProviderRegistry {
  private readonly providers = new Map<string, MarketDataProvider>();
  private activeId: string | null = null;

  register(provider: MarketDataProvider): void {
    const id = provider.id.trim();
    if (id === '') {
      throw new Error('MarketDataProvider id must not be empty');
    }
    if (this.providers.has(id)) {
      throw new Error(`MarketDataProvider already registered: ${id}`);
    }
    this.providers.set(id, provider);
    // First registration becomes active — single-provider default.
    if (this.activeId === null) {
      this.activeId = id;
    }
  }

  setActive(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`No MarketDataProvider registered for id: ${id}`);
    }
    this.activeId = id;
  }

  getActive(): MarketDataProvider {
    if (this.activeId === null) {
      throw new Error('No active MarketDataProvider registered');
    }
    const provider = this.providers.get(this.activeId);
    if (!provider) {
      throw new Error(`Active MarketDataProvider not found: ${this.activeId}`);
    }
    return provider;
  }

  list(): ReadonlyArray<string> {
    return Object.freeze([...this.providers.keys()]);
  }
}

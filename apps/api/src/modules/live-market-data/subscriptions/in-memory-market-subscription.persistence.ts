import type { MarketSubscription } from '../domain/market-subscription';
import type { MarketSubscriptionPersistence } from './market-subscription-persistence';

/**
 * In-memory MarketSubscriptionPersistence for tests (US142).
 * `clone()` / shared map simulates durable restart.
 */
export class InMemoryMarketSubscriptionPersistence implements MarketSubscriptionPersistence {
  constructor(private readonly rows = new Map<string, MarketSubscription>()) {}

  async loadAll(): Promise<MarketSubscription[]> {
    return [...this.rows.values()];
  }

  async loadByWorkspace(workspaceId: string): Promise<MarketSubscription[]> {
    return [...this.rows.values()].filter((row) => row.workspaceId === workspaceId);
  }

  async save(subscription: MarketSubscription): Promise<void> {
    this.rows.set(String(subscription.id), subscription);
  }

  clone(): InMemoryMarketSubscriptionPersistence {
    return new InMemoryMarketSubscriptionPersistence(this.rows);
  }
}

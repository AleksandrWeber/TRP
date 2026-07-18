import type { MarketSubscription } from '../domain/market-subscription';

/**
 * Persistence port for durable desired subscriptions (US142 / ADR-014).
 * Startup must load from this store — never from process memory alone.
 */
export interface MarketSubscriptionPersistence {
  loadAll(): Promise<MarketSubscription[]>;
  loadByWorkspace(workspaceId: string): Promise<MarketSubscription[]>;
  save(subscription: MarketSubscription): Promise<void>;
}

export const MARKET_SUBSCRIPTION_PERSISTENCE = Symbol('MARKET_SUBSCRIPTION_PERSISTENCE');

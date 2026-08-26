/**
 * W3-O01-b — Durable Market State projection store on the existing owner.
 * Write-through snapshot to AnalyticalOwnerStoreSnapshot. Not a new SoT.
 */

import type { PrismaClient } from '@prisma/client';
import { persistOwnerStoreSnapshot } from '../../../persistence/analytical-owner-store-snapshot';
import { loadRecoverableOwnerSnapshot } from '../../../persistence/analytical-restart-recovery';
import type { MarketState } from '../domain/market-state';
import {
  MarketStateProjectionStore,
  type MarketStateProjectionDurableState,
} from '../domain/market-state-projection.store';

export class DurableMarketStateProjectionStore extends MarketStateProjectionStore {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async hydrate(): Promise<void> {
    const payload = await loadRecoverableOwnerSnapshot(this.prisma, 'market-state');
    if (payload) {
      this.importDurableState(payload as MarketStateProjectionDurableState);
    }
  }

  override clear(): void {
    super.clear();
    this.persist();
  }

  override seed(state: MarketState, prior?: MarketState | null): MarketState {
    const result = super.seed(state, prior);
    this.persist();
    return result;
  }

  private persist(): void {
    persistOwnerStoreSnapshot(this.prisma, 'market-state', this.exportDurableState());
  }
}

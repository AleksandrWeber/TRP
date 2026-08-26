/**
 * W3-O01-b — Durable Market Profile store on the existing owner.
 * Write-through snapshot to AnalyticalOwnerStoreSnapshot. Not a new SoT.
 */

import type { PrismaClient } from '@prisma/client';
import {
  loadOwnerStoreSnapshot,
  persistOwnerStoreSnapshot,
} from '../../../persistence/analytical-owner-store-snapshot';
import type { MarketProfile } from '../domain/market-profile';
import {
  InMemoryMarketProfileStore,
  type MarketProfileStoreDurableState,
} from './in-memory-market-profile-store';

export class DurableMarketProfileStore extends InMemoryMarketProfileStore {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async hydrate(): Promise<void> {
    const payload = await loadOwnerStoreSnapshot(this.prisma, 'market-profile');
    if (payload && typeof payload === 'object') {
      this.importDurableState(payload as MarketProfileStoreDurableState);
    }
  }

  override clear(): void {
    super.clear();
    this.persist();
  }

  override putProfile(profile: MarketProfile): void {
    super.putProfile(profile);
    this.persist();
  }

  private persist(): void {
    persistOwnerStoreSnapshot(this.prisma, 'market-profile', this.exportDurableState());
  }
}

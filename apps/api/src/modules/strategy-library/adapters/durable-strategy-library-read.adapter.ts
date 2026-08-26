/**
 * W3-O01-b — Durable Strategy Library read adapter (membership SoT buffer).
 * Merges the `read` section of the shared strategy-library owner snapshot.
 */

import type { PrismaClient } from '@prisma/client';
import {
  loadOwnerStoreSnapshot,
  saveOwnerStoreSnapshot,
} from '../../../persistence/analytical-owner-store-snapshot';
import { loadRecoverableOwnerSnapshot } from '../../../persistence/analytical-restart-recovery';
import type { Strategy } from '../domain/strategy';
import type { StrategyCertification } from '../domain/strategy-certification';
import type { StrategyEligibility } from '../domain/strategy-eligibility';
import type { StrategyVersion } from '../domain/strategy-version';
import type { StrategyVersionRecord } from '../ports/strategy-library-lookup.port';
import {
  InMemoryStrategyLibraryReadAdapter,
  type StrategyLibraryReadDurableState,
} from './in-memory-strategy-library-read.adapter';
import { asStrategyLibraryOwnerSnapshot } from './strategy-library-owner-snapshot';

export class DurableStrategyLibraryReadAdapter extends InMemoryStrategyLibraryReadAdapter {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async hydrate(): Promise<void> {
    const payload = await loadRecoverableOwnerSnapshot(this.prisma, 'strategy-library');
    const snapshot = asStrategyLibraryOwnerSnapshot(payload);
    if (snapshot.read && typeof snapshot.read === 'object') {
      this.importDurableState(snapshot.read as StrategyLibraryReadDurableState);
    }
  }

  override clear(): void {
    super.clear();
    this.persist();
  }

  override seedEntry(input: {
    strategy: Strategy;
    version: StrategyVersion;
    certification?: StrategyCertification | null;
    eligibility?: StrategyEligibility | null;
  }): StrategyVersionRecord {
    const result = super.seedEntry(input);
    this.persist();
    return result;
  }

  private persist(): void {
    void (async () => {
      const current = asStrategyLibraryOwnerSnapshot(
        await loadOwnerStoreSnapshot(this.prisma, 'strategy-library'),
      );
      await saveOwnerStoreSnapshot(this.prisma, 'strategy-library', {
        ...current,
        read: this.exportDurableState(),
      });
    })().catch(() => undefined);
  }
}

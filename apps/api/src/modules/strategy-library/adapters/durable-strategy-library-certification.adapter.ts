/**
 * W3-O01-b — Durable Strategy Library certification attempts.
 * Merges the `certification` section of the shared strategy-library owner snapshot.
 */

import type { PrismaClient } from '@prisma/client';
import {
  loadOwnerStoreSnapshot,
  saveOwnerStoreSnapshot,
} from '../../../persistence/analytical-owner-store-snapshot';
import type {
  CertifyResult,
  CertifyStrategyVersionCommand,
} from '../ports/strategy-library-certification.port';
import {
  InMemoryStrategyLibraryCertificationAdapter,
  type StrategyLibraryCertificationDurableState,
} from './in-memory-strategy-library-certification.adapter';
import type { InMemoryStrategyLibraryReadAdapter } from './in-memory-strategy-library-read.adapter';
import { asStrategyLibraryOwnerSnapshot } from './strategy-library-owner-snapshot';

export class DurableStrategyLibraryCertificationAdapter extends InMemoryStrategyLibraryCertificationAdapter {
  constructor(
    private readonly prisma: PrismaClient,
    library: InMemoryStrategyLibraryReadAdapter,
  ) {
    super(library);
  }

  async hydrate(): Promise<void> {
    const payload = await loadOwnerStoreSnapshot(this.prisma, 'strategy-library');
    const snapshot = asStrategyLibraryOwnerSnapshot(payload);
    if (snapshot.certification && typeof snapshot.certification === 'object') {
      this.importDurableState(snapshot.certification as StrategyLibraryCertificationDurableState);
    }
  }

  override clear(): void {
    super.clear();
    this.persist();
  }

  override certify(cmd: CertifyStrategyVersionCommand): CertifyResult {
    const result = super.certify(cmd);
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
        certification: this.exportDurableState(),
      });
    })().catch(() => undefined);
  }
}

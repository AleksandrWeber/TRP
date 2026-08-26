/**
 * W3-O01-b — Durable Runtime Validation history on the Runtime Enforcement owner.
 * Write-through snapshot to AnalyticalOwnerStoreSnapshot. Not a new SoT / Gate redesign.
 */

import type { PrismaClient } from '@prisma/client';
import {
  loadOwnerStoreSnapshot,
  persistOwnerStoreSnapshot,
} from '../../persistence/analytical-owner-store-snapshot';
import type { RuntimeValidationRecord } from './runtime-validation.record';
import {
  InMemoryRuntimeValidationStore,
  type RuntimeValidationStoreDurableState,
} from './in-memory-runtime-validation.store';

export class DurableRuntimeValidationStore extends InMemoryRuntimeValidationStore {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async hydrate(): Promise<void> {
    const payload = await loadOwnerStoreSnapshot(this.prisma, 'runtime-enforcement');
    if (payload && typeof payload === 'object') {
      this.importDurableState(payload as RuntimeValidationStoreDurableState);
    }
  }

  override clear(): void {
    super.clear();
    this.persist();
  }

  override append(record: RuntimeValidationRecord): RuntimeValidationRecord {
    const result = super.append(record);
    this.persist();
    return result;
  }

  private persist(): void {
    persistOwnerStoreSnapshot(this.prisma, 'runtime-enforcement', this.exportDurableState());
  }
}

/**
 * W3-O01-b — Durable Knowledge Lake ingestion buffer on the existing owner.
 * Write-through snapshot to AnalyticalOwnerStoreSnapshot. Not a new SoT / warehouse.
 */

import type { PrismaClient } from '@prisma/client';
import {
  loadOwnerStoreSnapshot,
  persistOwnerStoreSnapshot,
} from '../../../persistence/analytical-owner-store-snapshot';
import type { AdmitResult, AnalyticalFactAdmission } from '../domain/analytical-fact-admission';
import {
  InMemoryKnowledgeLakeIngestionAdapter,
  type KnowledgeLakeIngestionDurableState,
} from './in-memory-knowledge-lake-ingestion.adapter';

export class DurableKnowledgeLakeIngestionAdapter extends InMemoryKnowledgeLakeIngestionAdapter {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async hydrate(): Promise<void> {
    const payload = await loadOwnerStoreSnapshot(this.prisma, 'knowledge-lake');
    if (payload && typeof payload === 'object') {
      this.importDurableState(payload as KnowledgeLakeIngestionDurableState);
    }
  }

  override admit(fact: AnalyticalFactAdmission): AdmitResult {
    const result = super.admit(fact);
    if (result.outcome === 'admitted') {
      this.persist();
    }
    return result;
  }

  private persist(): void {
    persistOwnerStoreSnapshot(this.prisma, 'knowledge-lake', this.exportDurableState());
  }
}

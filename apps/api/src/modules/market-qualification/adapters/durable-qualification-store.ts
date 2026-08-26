/**
 * W3-O01-b — Durable Qualification store on the existing Market Qualification owner.
 * Write-through snapshot to AnalyticalOwnerStoreSnapshot. Not a new SoT.
 */

import type { PrismaClient } from '@prisma/client';
import {
  loadOwnerStoreSnapshot,
  persistOwnerStoreSnapshot,
} from '../../../persistence/analytical-owner-store-snapshot';
import type { MarketConfidence } from '../domain/market-confidence';
import type { MarketHealth } from '../domain/market-health';
import type { QualificationRun } from '../domain/qualification-run';
import type { QualificationState } from '../domain/qualification-state';
import type { QualificationTarget } from '../domain/qualification-target';
import {
  InMemoryQualificationStore,
  type QualificationStoreDurableState,
} from './in-memory-qualification-store';

export class DurableQualificationStore extends InMemoryQualificationStore {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async hydrate(): Promise<void> {
    const payload = await loadOwnerStoreSnapshot(this.prisma, 'market-qualification');
    if (payload && typeof payload === 'object') {
      this.importDurableState(payload as QualificationStoreDurableState);
    }
  }

  override clear(): void {
    super.clear();
    this.persist();
  }

  override putTarget(target: QualificationTarget): void {
    super.putTarget(target);
    this.persist();
  }

  override putState(state: QualificationState): void {
    super.putState(state);
    this.persist();
  }

  override putRun(run: QualificationRun): void {
    super.putRun(run);
    this.persist();
  }

  override putConfidence(confidence: MarketConfidence): void {
    super.putConfidence(confidence);
    this.persist();
  }

  override putHealth(health: MarketHealth): void {
    super.putHealth(health);
    this.persist();
  }

  private persist(): void {
    persistOwnerStoreSnapshot(this.prisma, 'market-qualification', this.exportDurableState());
  }
}

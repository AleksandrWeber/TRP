/**
 * W3-O01-b — Durable Reporting store on the existing Reporting owner.
 * Write-through snapshot to AnalyticalOwnerStoreSnapshot. Not a new SoT.
 */

import type { PrismaClient } from '@prisma/client';
import {
  loadOwnerStoreSnapshot,
  persistOwnerStoreSnapshot,
} from '../../../persistence/analytical-owner-store-snapshot';
import type { AggregationSlice } from '../domain/aggregation-slice';
import type { ReportDefinition } from '../domain/report-definition';
import type { ReportRun } from '../domain/report-run';
import {
  InMemoryReportingStore,
  type ReportingStoreDurableState,
} from './in-memory-reporting-store';

export class DurableReportingStore extends InMemoryReportingStore {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async hydrate(): Promise<void> {
    const payload = await loadOwnerStoreSnapshot(this.prisma, 'reporting');
    if (payload && typeof payload === 'object') {
      this.importDurableState(payload as ReportingStoreDurableState);
    }
  }

  override putDefinition(definition: ReportDefinition): void {
    super.putDefinition(definition);
    this.persist();
  }

  override putRun(run: ReportRun, slices: readonly AggregationSlice[]): void {
    super.putRun(run, slices);
    this.persist();
  }

  override clear(): void {
    super.clear();
    this.persist();
  }

  private persist(): void {
    persistOwnerStoreSnapshot(this.prisma, 'reporting', this.exportDurableState());
  }
}

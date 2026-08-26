/**
 * W3-O01-b — Durable OrchestrationCoordinationStore on the Trading Orchestrator owner.
 * Write-through snapshot to AnalyticalOwnerStoreSnapshot. Not a new SoT.
 * Does not durable-persist InMemoryOrchestratorMarketStateAdapter (EPHEMERAL).
 */

import type { PrismaClient } from '@prisma/client';
import {
  loadOwnerStoreSnapshot,
  persistOwnerStoreSnapshot,
} from '../../../persistence/analytical-owner-store-snapshot';
import {
  OrchestrationCoordinationStore,
  type OrchestrationStoreDurableState,
} from '../application/orchestration-coordination.store';
import type { OrchestrationPlan } from '../domain/orchestration-plan';
import type { OrchestrationRun } from '../domain/orchestration-run';
import type { SelectionDecision } from '../domain/selection-decision';
import type { SessionHandoffIntent } from '../domain/session-handoff-intent';

export class DurableOrchestrationCoordinationStore extends OrchestrationCoordinationStore {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async hydrate(): Promise<void> {
    const payload = await loadOwnerStoreSnapshot(this.prisma, 'trading-orchestrator');
    if (payload && typeof payload === 'object') {
      this.importDurableState(payload as OrchestrationStoreDurableState);
    }
  }

  override clear(): void {
    super.clear();
    this.persist();
  }

  override nextId(prefix: string): string {
    const id = super.nextId(prefix);
    this.persist();
    return id;
  }

  override putRun(run: OrchestrationRun): void {
    super.putRun(run);
    this.persist();
  }

  override putSelection(selection: SelectionDecision): void {
    super.putSelection(selection);
    this.persist();
  }

  override putHandoff(intent: SessionHandoffIntent): void {
    super.putHandoff(intent);
    this.persist();
  }

  override putPlan(plan: OrchestrationPlan): void {
    super.putPlan(plan);
    this.persist();
  }

  override linkRunToPlan(orchestrationRunId: string, orchestrationPlanId: string): void {
    super.linkRunToPlan(orchestrationRunId, orchestrationPlanId);
    this.persist();
  }

  private persist(): void {
    persistOwnerStoreSnapshot(this.prisma, 'trading-orchestrator', this.exportDurableState());
  }
}

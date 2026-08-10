/**
 * RC-26 Epic 5 — In-memory Market State consumer for Orchestrator.
 *
 * Seedable process-local buffer of current-condition views.
 * Does not classify. Does not own Market State module algorithms.
 * When MARKET_STATE_QUERY_PORT activates, this can alias to it.
 */

import { Injectable } from '@nestjs/common';
import type {
  GetCurrentMarketStateQuery,
  OrchestratorMarketStateConsumerPort,
  OrchestratorMarketStateView,
} from '../ports/trading-orchestrator.port';

@Injectable()
export class InMemoryOrchestratorMarketStateAdapter implements OrchestratorMarketStateConsumerPort {
  private readonly byId = new Map<string, OrchestratorMarketStateView>();
  private readonly currentByTarget = new Map<string, string>();

  seedCurrent(view: OrchestratorMarketStateView): OrchestratorMarketStateView {
    const frozen = Object.freeze({
      ...view,
      forcesTrade: false as const,
      isQualification: false as const,
      isProfile: false as const,
      authorityClass: 'market_state_artifact' as const,
    });
    this.byId.set(frozen.marketStateId, frozen);
    this.currentByTarget.set(targetKey(frozen), frozen.marketStateId);
    return frozen;
  }

  clear(): void {
    this.byId.clear();
    this.currentByTarget.clear();
  }

  getCurrentMarketState(query: GetCurrentMarketStateQuery): OrchestratorMarketStateView | null {
    if (query.marketStateId !== undefined && query.marketStateId.trim() !== '') {
      const byId = this.byId.get(query.marketStateId.trim());
      if (!byId) return null;
      if (
        byId.workspaceId !== query.workspaceId ||
        byId.exchangeScopeId !== query.exchangeScopeId ||
        byId.marketSymbol !== query.marketSymbol
      ) {
        return null;
      }
      return byId;
    }
    const id = this.currentByTarget.get(
      `${query.workspaceId}|${query.exchangeScopeId}|${query.marketSymbol}`,
    );
    return id ? (this.byId.get(id) ?? null) : null;
  }
}

function targetKey(view: OrchestratorMarketStateView): string {
  return `${view.workspaceId}|${view.exchangeScopeId}|${view.marketSymbol}`;
}

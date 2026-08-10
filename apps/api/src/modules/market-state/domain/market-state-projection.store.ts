/**
 * RC-26 Epic 6 — Process-local Market State projection store.
 *
 * Seedable buffer of immutable MarketState domain versions for consumer reads.
 * Not a persistence / REST / DB product.
 */

import { Injectable } from '@nestjs/common';
import type { MarketState } from './market-state';

export type MarketStateTransitionRecord = Readonly<{
  marketStateId: string;
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
  fromVersion: number | null;
  toVersion: number;
  fromLifecycle?: string;
  toLifecycle: string;
  transitionedAt: string;
}>;

@Injectable()
export class MarketStateProjectionStore {
  private readonly byId = new Map<string, MarketState>();
  private readonly currentByTarget = new Map<string, string>();
  private readonly transitions: MarketStateTransitionRecord[] = [];

  clear(): void {
    this.byId.clear();
    this.currentByTarget.clear();
    this.transitions.length = 0;
  }

  seed(state: MarketState, prior?: MarketState | null): MarketState {
    this.byId.set(state.marketStateId, state);
    const key = targetKey(state);
    const previousId = this.currentByTarget.get(key);
    const previous = prior ?? (previousId ? this.byId.get(previousId) : undefined);
    this.currentByTarget.set(key, state.marketStateId);
    this.transitions.push(
      Object.freeze({
        marketStateId: state.marketStateId,
        workspaceId: state.workspaceId,
        exchangeScopeId: state.exchangeScopeId,
        marketSymbol: state.marketSymbol,
        fromVersion: previous?.version.version ?? null,
        toVersion: state.version.version,
        ...(previous ? { fromLifecycle: previous.lifecycle.status } : {}),
        toLifecycle: state.lifecycle.status,
        transitionedAt: state.lifecycle.updatedAt,
      }),
    );
    return state;
  }

  getCurrent(query: {
    workspaceId: string;
    exchangeScopeId: string;
    marketSymbol: string;
    marketStateId?: string;
  }): MarketState | null {
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

  listTransitions(query: {
    workspaceId: string;
    exchangeScopeId: string;
    marketSymbol: string;
    limit?: number;
  }): readonly MarketStateTransitionRecord[] {
    const rows = this.transitions.filter(
      (row) =>
        row.workspaceId === query.workspaceId &&
        row.exchangeScopeId === query.exchangeScopeId &&
        row.marketSymbol === query.marketSymbol,
    );
    const limit = query.limit ?? 50;
    return Object.freeze(rows.slice(-limit));
  }
}

function targetKey(state: MarketState): string {
  return `${state.workspaceId}|${state.exchangeScopeId}|${state.marketSymbol}`;
}

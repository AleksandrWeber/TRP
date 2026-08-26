/**
 * RC-26 Epic 6 — Process-local Market State projection store.
 *
 * Seedable buffer of immutable MarketState domain versions for consumer reads.
 * W3-O01-b: snapshot export/import enables durable persistence on this owner
 * via DurableMarketStateProjectionStore. Not a persistence / REST / DB product.
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

export type MarketStateProjectionDurableState = Readonly<{
  states: MarketState[];
  currentByTarget: Array<readonly [string, string]>;
  transitions: MarketStateTransitionRecord[];
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
    if (prior) this.byId.set(prior.marketStateId, prior);
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

  /** Additive read of versions already in the process-local store. */
  listWorkspace(workspaceId: string): readonly MarketState[] {
    return Object.freeze(
      [...this.byId.values()]
        .filter((row) => row.workspaceId === workspaceId)
        .sort(byVersionThenPublished),
    );
  }

  /** Additive read of current states already in the process-local store. */
  listCurrent(workspaceId: string): readonly MarketState[] {
    const rows: MarketState[] = [];
    for (const [key, id] of this.currentByTarget.entries()) {
      if (!key.startsWith(`${workspaceId}|`)) continue;
      const parsed = parseTargetKey(key);
      if (parsed.workspaceId !== workspaceId) continue;
      const state = this.byId.get(id);
      if (state) rows.push(state);
    }
    return Object.freeze(rows.sort(byPublishedDesc));
  }

  /** Additive read of version history already in the process-local store. */
  listHistory(query: {
    workspaceId: string;
    exchangeScopeId?: string;
    marketSymbol?: string;
  }): readonly MarketState[] {
    return Object.freeze(
      [...this.byId.values()]
        .filter((row) => matchesTarget(row, query))
        .sort(byVersionThenPublished),
    );
  }

  getByVersion(query: {
    workspaceId: string;
    exchangeScopeId: string;
    marketSymbol: string;
    version: number;
  }): MarketState | null {
    return (
      [...this.byId.values()].find(
        (row) => matchesTarget(row, query) && row.version.version === query.version,
      ) ?? null
    );
  }

  getTransition(query: {
    workspaceId: string;
    exchangeScopeId: string;
    marketSymbol: string;
    marketStateId?: string;
    toVersion?: number;
  }): MarketStateTransitionRecord | null {
    const rows = this.listTransitions(query);
    const marketStateId = query.marketStateId?.trim();
    if (marketStateId) {
      return rows.find((row) => row.marketStateId === marketStateId) ?? null;
    }
    if (query.toVersion !== undefined) {
      return rows.find((row) => row.toVersion === query.toVersion) ?? null;
    }
    return rows.at(-1) ?? null;
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

  exportDurableState(): MarketStateProjectionDurableState {
    return Object.freeze({
      states: [...this.byId.values()],
      currentByTarget: [...this.currentByTarget.entries()].map(([k, v]) =>
        Object.freeze([k, v] as const),
      ),
      transitions: [...this.transitions],
    });
  }

  importDurableState(state: MarketStateProjectionDurableState): void {
    this.byId.clear();
    this.currentByTarget.clear();
    this.transitions.length = 0;
    for (const row of state.states ?? []) {
      this.byId.set(row.marketStateId, row);
    }
    for (const [key, id] of state.currentByTarget ?? []) {
      this.currentByTarget.set(key, id);
    }
    for (const transition of state.transitions ?? []) {
      this.transitions.push(transition);
    }
  }
}

function targetKey(state: MarketState): string {
  return `${state.workspaceId}|${state.exchangeScopeId}|${state.marketSymbol}`;
}

function parseTargetKey(key: string): {
  workspaceId: string;
  exchangeScopeId: string;
  marketSymbol: string;
} {
  const [workspaceId = '', exchangeScopeId = '', ...symbolParts] = key.split('|');
  return {
    workspaceId,
    exchangeScopeId,
    marketSymbol: symbolParts.join('|'),
  };
}

function matchesTarget(
  row: MarketState,
  query: {
    workspaceId: string;
    exchangeScopeId?: string;
    marketSymbol?: string;
  },
): boolean {
  if (row.workspaceId !== query.workspaceId) return false;
  if (query.exchangeScopeId !== undefined && row.exchangeScopeId !== query.exchangeScopeId) {
    return false;
  }
  if (query.marketSymbol !== undefined && row.marketSymbol !== query.marketSymbol) {
    return false;
  }
  return true;
}

function byVersionThenPublished(left: MarketState, right: MarketState): number {
  if (left.version.version !== right.version.version) {
    return left.version.version - right.version.version;
  }
  return left.version.publishedAt.localeCompare(right.version.publishedAt);
}

function byPublishedDesc(left: MarketState, right: MarketState): number {
  return right.version.publishedAt.localeCompare(left.version.publishedAt);
}

/**
 * RC-27 Epic 3 — Process-local Exchange Scope artifact store.
 *
 * Not a persistence product / DB schema.
 * W3-O01-b: snapshot export/import enables durable persistence on this owner
 * via DurableExchangeScopeStore.
 */

import { Injectable } from '@nestjs/common';
import type { AdapterBindingContext } from '../domain/adapter-binding-context';
import type { ExchangeScope } from '../domain/exchange-scope';
import type { ExchangeRiskPolicy } from '../domain/exchange-risk-policy';
import type { TradingAccountBinding } from '../domain/trading-account-binding';

export type ExchangeScopeStoreDurableState = Readonly<{
  latest: ExchangeScope[];
  history: Array<readonly [string, ExchangeScope[]]>;
  policies: Array<readonly [string, ExchangeRiskPolicy[]]>;
  bindings: TradingAccountBinding[];
  adapters: AdapterBindingContext[];
}>;

@Injectable()
export class InMemoryExchangeScopeStore {
  private readonly latestById = new Map<string, ExchangeScope>();
  private readonly historyById = new Map<string, ExchangeScope[]>();
  private readonly policiesByScope = new Map<string, ExchangeRiskPolicy[]>();
  private readonly bindingsById = new Map<string, TradingAccountBinding>();
  private readonly adapterByScope = new Map<string, AdapterBindingContext>();

  clear(): void {
    this.latestById.clear();
    this.historyById.clear();
    this.policiesByScope.clear();
    this.bindingsById.clear();
    this.adapterByScope.clear();
  }

  putScope(scope: ExchangeScope, history: readonly ExchangeScope[]): void {
    this.latestById.set(scope.exchangeScopeId, scope);
    this.historyById.set(scope.exchangeScopeId, [...history]);
  }

  getScope(exchangeScopeId: string): ExchangeScope | null {
    return this.latestById.get(exchangeScopeId) ?? null;
  }

  getHistory(exchangeScopeId: string): readonly ExchangeScope[] {
    return this.historyById.get(exchangeScopeId) ?? [];
  }

  findByVenue(workspaceId: string, venueCode: string): ExchangeScope | null {
    const normalized = venueCode.trim().toLowerCase();
    for (const scope of this.latestById.values()) {
      if (
        scope.workspaceId === workspaceId &&
        String(scope.venueCode).toLowerCase() === normalized
      ) {
        return scope;
      }
    }
    return null;
  }

  listByWorkspace(workspaceId: string): ExchangeScope[] {
    return [...this.latestById.values()]
      .filter((scope) => scope.workspaceId === workspaceId)
      .sort((a, b) =>
        a.exchangeScopeId < b.exchangeScopeId ? -1 : a.exchangeScopeId > b.exchangeScopeId ? 1 : 0,
      );
  }

  findActiveDuplicateVenue(
    workspaceId: string,
    venueCode: string,
    exceptScopeId?: string,
  ): ExchangeScope | null {
    const normalized = venueCode.trim().toLowerCase();
    for (const scope of this.latestById.values()) {
      if (exceptScopeId && scope.exchangeScopeId === exceptScopeId) continue;
      if (
        scope.workspaceId === workspaceId &&
        String(scope.venueCode).toLowerCase() === normalized &&
        scope.lifecycle.status === 'active'
      ) {
        return scope;
      }
    }
    return null;
  }

  putPolicyHistory(exchangeScopeId: string, history: readonly ExchangeRiskPolicy[]): void {
    this.policiesByScope.set(exchangeScopeId, [...history]);
  }

  getPolicyHistory(exchangeScopeId: string): readonly ExchangeRiskPolicy[] {
    return this.policiesByScope.get(exchangeScopeId) ?? [];
  }

  getLatestPolicy(exchangeScopeId: string): ExchangeRiskPolicy | null {
    const history = this.getPolicyHistory(exchangeScopeId);
    return history.length === 0 ? null : history[history.length - 1]!;
  }

  getPolicy(exchangeScopeId: string, policyVersion: number): ExchangeRiskPolicy | null {
    return (
      this.getPolicyHistory(exchangeScopeId).find((row) => row.policyVersion === policyVersion) ??
      null
    );
  }

  putBinding(binding: TradingAccountBinding): void {
    this.bindingsById.set(binding.tradingAccountBindingId, binding);
  }

  getBinding(tradingAccountBindingId: string): TradingAccountBinding | null {
    return this.bindingsById.get(tradingAccountBindingId) ?? null;
  }

  listBindings(workspaceId: string, exchangeScopeId: string): TradingAccountBinding[] {
    return [...this.bindingsById.values()]
      .filter((row) => row.workspaceId === workspaceId && row.exchangeScopeId === exchangeScopeId)
      .sort((a, b) =>
        a.tradingAccountBindingId < b.tradingAccountBindingId
          ? -1
          : a.tradingAccountBindingId > b.tradingAccountBindingId
            ? 1
            : 0,
      );
  }

  putAdapterContext(context: AdapterBindingContext): void {
    this.adapterByScope.set(context.exchangeScopeId, context);
  }

  getAdapterContext(exchangeScopeId: string): AdapterBindingContext | null {
    return this.adapterByScope.get(exchangeScopeId) ?? null;
  }

  exportDurableState(): ExchangeScopeStoreDurableState {
    return Object.freeze({
      latest: [...this.latestById.values()],
      history: [...this.historyById.entries()].map(([id, rows]) =>
        Object.freeze([id, rows] as const),
      ),
      policies: [...this.policiesByScope.entries()].map(([id, rows]) =>
        Object.freeze([id, rows] as const),
      ),
      bindings: [...this.bindingsById.values()],
      adapters: [...this.adapterByScope.values()],
    });
  }

  importDurableState(state: ExchangeScopeStoreDurableState): void {
    this.latestById.clear();
    this.historyById.clear();
    this.policiesByScope.clear();
    this.bindingsById.clear();
    this.adapterByScope.clear();
    for (const scope of state.latest ?? []) {
      this.latestById.set(scope.exchangeScopeId, scope);
    }
    for (const [id, history] of state.history ?? []) {
      this.historyById.set(id, [...history]);
    }
    for (const [id, policies] of state.policies ?? []) {
      this.policiesByScope.set(id, [...policies]);
    }
    for (const binding of state.bindings ?? []) {
      this.bindingsById.set(binding.tradingAccountBindingId, binding);
    }
    for (const adapter of state.adapters ?? []) {
      this.adapterByScope.set(adapter.exchangeScopeId, adapter);
    }
  }
}

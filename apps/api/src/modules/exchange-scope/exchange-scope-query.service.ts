/**
 * RC-27 Epic 3 — Exchange Scope query service.
 *
 * Read-only views of isolation artifacts.
 * Never routes trades, owns Sessions, or becomes Execution / Risk.
 */

import { Inject, Injectable } from '@nestjs/common';
import { InMemoryExchangeScopeStore } from './adapters/in-memory-exchange-scope-store';
import {
  EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
  EXCHANGE_POLICY_INPUT_AUTHORITY_CLASS,
} from './domain/exchange-scope-domain-shared';
import type {
  AdapterBindingContextView,
  ExchangeRiskPolicyView,
  ExchangeScopeConfigView,
  ExchangeScopeQueryPort,
  ExchangeScopeSummary,
  ExchangeScopeView,
  GetAdapterBindingContext,
  GetExchangeRiskPolicy,
  GetExchangeScope,
  GetExchangeScopeConfig,
  ListExchangeRiskPolicies,
  ListExchangeScopeHistory,
  ListExchangeScopes,
  ListTradingAccountBindings,
  TradingAccountBindingView,
} from './ports/exchange-scope.port';

const SCOPE_FLAGS = Object.freeze({
  authorityClass: EXCHANGE_SCOPE_DOMAIN_AUTHORITY_CLASS,
  isRiskEngine: false as const,
  isExecutionEngine: false as const,
  isStrategyLibrary: false as const,
  isRuntime: false as const,
  approvesRisk: false as const,
  submitsOrders: false as const,
  mutable: false as const,
});

@Injectable()
export class ExchangeScopeQueryService implements ExchangeScopeQueryPort {
  constructor(
    @Inject(InMemoryExchangeScopeStore)
    private readonly store: InMemoryExchangeScopeStore,
  ) {}

  getExchangeScope(query: GetExchangeScope): ExchangeScopeView | null {
    if (!query.workspaceId?.trim()) return null;
    const scope = this.resolveScope(query);
    if (!scope) return null;
    return Object.freeze({ ...scope, ...SCOPE_FLAGS });
  }

  listExchangeScopes(query: ListExchangeScopes): readonly ExchangeScopeSummary[] {
    if (!query.workspaceId?.trim()) return Object.freeze([]);
    return Object.freeze(
      this.store
        .listByWorkspace(query.workspaceId)
        .filter((scope) =>
          query.lifecycleStatus ? scope.lifecycle.status === query.lifecycleStatus : true,
        )
        .map((scope) =>
          Object.freeze({
            exchangeScopeId: scope.exchangeScopeId,
            workspaceId: scope.workspaceId,
            venueCode: String(scope.venueCode),
            displayName: scope.displayName,
            lifecycleStatus: scope.lifecycle.status,
            version: scope.version.version,
            maxActiveSessions: scope.config.maxActiveSessions,
            modeContext: scope.config.modeContext,
            blocksNewSessionCapacity: scope.lifecycle.blocksNewSessionCapacity,
            ...SCOPE_FLAGS,
          }),
        ),
    );
  }

  getExchangeScopeConfig(query: GetExchangeScopeConfig): ExchangeScopeConfigView | null {
    if (!query.workspaceId?.trim() || !query.exchangeScopeId?.trim()) return null;
    const scope = this.store.getScope(query.exchangeScopeId);
    if (!scope || scope.workspaceId !== query.workspaceId) return null;
    return Object.freeze({ ...scope.config, ...SCOPE_FLAGS });
  }

  getExchangeRiskPolicy(query: GetExchangeRiskPolicy): ExchangeRiskPolicyView | null {
    if (!query.workspaceId?.trim() || !query.exchangeScopeId?.trim()) return null;
    const scope = this.store.getScope(query.exchangeScopeId);
    if (!scope || scope.workspaceId !== query.workspaceId) return null;

    const policy =
      query.policyVersion !== undefined
        ? this.store.getPolicy(query.exchangeScopeId, query.policyVersion)
        : this.store.getLatestPolicy(query.exchangeScopeId);
    if (!policy) return null;

    return Object.freeze({
      ...policy,
      authorityClass: EXCHANGE_POLICY_INPUT_AUTHORITY_CLASS,
      isRiskDecision: false as const,
      approvesRisk: false as const,
      isRuntime: false as const,
      isExecutionEngine: false as const,
      isStrategyLibrary: false as const,
      submitsOrders: false as const,
      mutable: false as const,
    });
  }

  listTradingAccountBindings(
    query: ListTradingAccountBindings,
  ): readonly TradingAccountBindingView[] {
    if (!query.workspaceId?.trim() || !query.exchangeScopeId?.trim()) {
      return Object.freeze([]);
    }
    return Object.freeze(
      this.store
        .listBindings(query.workspaceId, query.exchangeScopeId)
        .filter((row) => (query.status ? row.status === query.status : true))
        .map((row) => Object.freeze({ ...row, ...SCOPE_FLAGS })),
    );
  }

  getAdapterBindingContext(query: GetAdapterBindingContext): AdapterBindingContextView | null {
    if (!query.workspaceId?.trim() || !query.exchangeScopeId?.trim()) return null;
    const scope = this.store.getScope(query.exchangeScopeId);
    if (!scope || scope.workspaceId !== query.workspaceId) return null;
    const context = this.store.getAdapterContext(query.exchangeScopeId);
    if (!context) return null;
    return Object.freeze({
      ...context,
      isRiskEngine: false as const,
      isStrategyLibrary: false as const,
      isRuntime: false as const,
      approvesRisk: false as const,
    });
  }

  listExchangeScopeHistory(query: ListExchangeScopeHistory): readonly ExchangeScopeView[] {
    if (!query.workspaceId?.trim() || !query.exchangeScopeId?.trim()) {
      return Object.freeze([]);
    }
    const scope = this.store.getScope(query.exchangeScopeId);
    if (!scope || scope.workspaceId !== query.workspaceId) return Object.freeze([]);
    return Object.freeze(
      this.store
        .getHistory(query.exchangeScopeId)
        .map((row) => Object.freeze({ ...row, ...SCOPE_FLAGS })),
    );
  }

  listExchangeRiskPolicies(query: ListExchangeRiskPolicies): readonly ExchangeRiskPolicyView[] {
    if (!query.workspaceId?.trim() || !query.exchangeScopeId?.trim()) {
      return Object.freeze([]);
    }
    const scope = this.store.getScope(query.exchangeScopeId);
    if (!scope || scope.workspaceId !== query.workspaceId) return Object.freeze([]);
    return Object.freeze(
      this.store.getPolicyHistory(query.exchangeScopeId).map((policy) =>
        Object.freeze({
          ...policy,
          authorityClass: EXCHANGE_POLICY_INPUT_AUTHORITY_CLASS,
          isRiskDecision: false as const,
          approvesRisk: false as const,
          isRuntime: false as const,
          isExecutionEngine: false as const,
          isStrategyLibrary: false as const,
          submitsOrders: false as const,
          mutable: false as const,
        }),
      ),
    );
  }

  private resolveScope(query: GetExchangeScope) {
    if (query.exchangeScopeId?.trim()) {
      const scope = this.store.getScope(query.exchangeScopeId);
      if (!scope || scope.workspaceId !== query.workspaceId) return null;
      return scope;
    }
    if (query.venueCode?.trim()) {
      return this.store.findByVenue(query.workspaceId, query.venueCode);
    }
    return null;
  }
}

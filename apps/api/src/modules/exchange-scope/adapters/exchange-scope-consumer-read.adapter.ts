/**
 * RC-27 Epic 5 — Exchange Scope consumer read query adapter.
 *
 * Maps in-memory Scope store → immutable consumer projections.
 * Read-only. No commands. No callbacks. No trading-path behaviour.
 */

import { Inject, Injectable } from '@nestjs/common';
import { InMemoryExchangeScopeStore } from './in-memory-exchange-scope-store';
import type { ExchangeScope } from '../domain/exchange-scope';
import {
  EXCHANGE_POLICY_CONSUMER_FLAGS,
  EXCHANGE_SCOPE_CONSUMER_FLAGS,
  type ExchangeRiskPolicyProjection,
  type ExchangeScopeActiveStatusProjection,
  type ExchangeScopeConfigProjection,
  type ExchangeScopeLifecycleProjection,
  type ExchangeScopeMetadataProjection,
  type ExchangeScopeProjection,
  type ExchangeScopeWorkspaceAggregateProjection,
  type TradingAccountBindingProjection,
} from '../domain/exchange-scope-consumer-read-model';
import type { ExchangeScopeConsumerReadQuery } from '../ports/exchange-scope.port';

@Injectable()
export class ExchangeScopeConsumerReadAdapter {
  constructor(
    @Inject(InMemoryExchangeScopeStore)
    private readonly store: InMemoryExchangeScopeStore,
  ) {}

  listScopeProjections(query: ExchangeScopeConsumerReadQuery): readonly ExchangeScopeProjection[] {
    if (!query.workspaceId?.trim()) return Object.freeze([]);
    return Object.freeze(
      this.store.listByWorkspace(query.workspaceId).map((scope) => this.toScopeProjection(scope)),
    );
  }

  getScopeProjection(query: ExchangeScopeConsumerReadQuery): ExchangeScopeProjection | null {
    const scope = this.resolveScope(query);
    return scope ? this.toScopeProjection(scope) : null;
  }

  getLifecycleProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeLifecycleProjection | null {
    const scope = this.resolveScope(query);
    if (!scope) return null;
    const status = scope.lifecycle.status;
    return Object.freeze({
      exchangeScopeId: scope.exchangeScopeId,
      workspaceId: scope.workspaceId,
      status,
      isActive: status === 'active',
      updatedAt: scope.lifecycle.updatedAt,
      updatedBy: scope.lifecycle.updatedBy,
      reason: scope.lifecycle.reason,
      blocksNewSessionCapacity: scope.lifecycle.blocksNewSessionCapacity,
      authorizesRuntime: false as const,
      executesActions: false as const,
      ...EXCHANGE_SCOPE_CONSUMER_FLAGS,
    });
  }

  getConfigSummaryProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeConfigProjection | null {
    const scope = this.resolveScope(query);
    if (!scope) return null;
    return Object.freeze({
      exchangeScopeId: scope.exchangeScopeId,
      workspaceId: scope.workspaceId,
      version: scope.version.version,
      maxActiveSessions: scope.config.maxActiveSessions,
      symbolAllowlistCount: scope.config.symbolAllowlist.length,
      strategyAllowlistCount: scope.config.strategyAllowlist.length,
      modeContext: scope.config.modeContext,
      updatedAt: scope.config.updatedAt,
      updatedBy: scope.config.updatedBy,
      ...EXCHANGE_SCOPE_CONSUMER_FLAGS,
    });
  }

  getPolicyInputProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeRiskPolicyProjection | null {
    const scope = this.resolveScope(query);
    if (!scope) return null;
    const policy = this.store.getLatestPolicy(scope.exchangeScopeId);
    if (!policy) return null;
    return Object.freeze({
      exchangeRiskPolicyId: policy.exchangeRiskPolicyId,
      exchangeScopeId: policy.exchangeScopeId,
      workspaceId: policy.workspaceId,
      policyVersion: policy.policyVersion,
      maxExposureLabel: policy.limits.maxExposureLabel,
      maxOrderNotionalLabel: policy.limits.maxOrderNotionalLabel,
      publishedAt: policy.publishedAt,
      publishedBy: policy.publishedBy,
      ...EXCHANGE_POLICY_CONSUMER_FLAGS,
    });
  }

  listAccountBindingProjections(
    query: ExchangeScopeConsumerReadQuery,
  ): readonly TradingAccountBindingProjection[] {
    const scope = this.resolveScope(query);
    if (!scope) return Object.freeze([]);
    return Object.freeze(
      this.store.listBindings(scope.workspaceId, scope.exchangeScopeId).map((row) =>
        Object.freeze({
          tradingAccountBindingId: row.tradingAccountBindingId,
          exchangeScopeId: row.exchangeScopeId,
          workspaceId: row.workspaceId,
          tradingAccountId: row.tradingAccountId,
          status: row.status,
          boundAt: row.boundAt,
          boundBy: row.boundBy,
          ownsLedger: false as const,
          movesBalances: false as const,
          ...EXCHANGE_SCOPE_CONSUMER_FLAGS,
        }),
      ),
    );
  }

  getMetadataProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeMetadataProjection | null {
    const scope = this.resolveScope(query);
    if (!scope) return null;
    return Object.freeze({
      exchangeScopeId: scope.exchangeScopeId,
      workspaceId: scope.workspaceId,
      asOf: scope.metadata.asOf,
      inputSummary: scope.metadata.inputSummary,
      adapterContextRef: scope.metadata.adapterContextRef,
      policyRef: scope.metadata.policyRef,
      ownsStrategyLibrary: false as const,
      ownsRuntimeEnforcement: false as const,
      ownsTradingSession: false as const,
      ownsRiskDecisions: false as const,
      ownsOrders: false as const,
      ownsExecution: false as const,
      ownsAccounting: false as const,
      ...EXCHANGE_SCOPE_CONSUMER_FLAGS,
    });
  }

  getActiveStatusProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeActiveStatusProjection | null {
    const scope = this.resolveScope(query);
    if (!scope) return null;
    const lifecycleStatus = scope.lifecycle.status;
    return Object.freeze({
      exchangeScopeId: scope.exchangeScopeId,
      workspaceId: scope.workspaceId,
      venueCode: String(scope.venueCode),
      lifecycleStatus,
      isActive: lifecycleStatus === 'active',
      blocksNewSessionCapacity: scope.lifecycle.blocksNewSessionCapacity,
      ...EXCHANGE_SCOPE_CONSUMER_FLAGS,
    });
  }

  getWorkspaceAggregateProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeWorkspaceAggregateProjection | null {
    if (!query.workspaceId?.trim()) return null;
    const scopes = this.listScopeProjections({ workspaceId: query.workspaceId });
    const counts = {
      active: 0,
      suspended: 0,
      created: 0,
      archived: 0,
    };
    for (const scope of scopes) {
      if (scope.lifecycleStatus === 'active') counts.active += 1;
      else if (scope.lifecycleStatus === 'suspended') counts.suspended += 1;
      else if (scope.lifecycleStatus === 'created') counts.created += 1;
      else if (scope.lifecycleStatus === 'archived') counts.archived += 1;
    }
    return Object.freeze({
      workspaceId: query.workspaceId.trim(),
      scopeCount: scopes.length,
      activeCount: counts.active,
      suspendedCount: counts.suspended,
      createdCount: counts.created,
      archivedCount: counts.archived,
      scopes,
      inventsBalances: false as const,
      inventsFills: false as const,
      inventsRiskApprovals: false as const,
      inventsOrders: false as const,
      ...EXCHANGE_SCOPE_CONSUMER_FLAGS,
    });
  }

  resolveScope(query: ExchangeScopeConsumerReadQuery): ExchangeScope | null {
    if (!query.workspaceId?.trim()) return null;
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

  toScopeProjection(scope: ExchangeScope): ExchangeScopeProjection {
    const lifecycleStatus = scope.lifecycle.status;
    return Object.freeze({
      exchangeScopeId: scope.exchangeScopeId,
      workspaceId: scope.workspaceId,
      venueCode: String(scope.venueCode),
      displayName: scope.displayName,
      lifecycleStatus,
      isActive: lifecycleStatus === 'active',
      version: scope.version.version,
      maxActiveSessions: scope.config.maxActiveSessions,
      modeContext: scope.config.modeContext,
      blocksNewSessionCapacity: scope.lifecycle.blocksNewSessionCapacity,
      publishedAt: scope.version.publishedAt,
      publishedBy: scope.version.publishedBy,
      metadataSummary: scope.metadata.inputSummary,
      ...EXCHANGE_SCOPE_CONSUMER_FLAGS,
    });
  }
}

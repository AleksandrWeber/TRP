/**
 * PC-12 — product adapter over existing Exchange Scope ports.
 *
 * Delegates commands and queries. Does not own isolation artifacts.
 * Does not call venue APIs, redesign Runtime, Session, or Deployment.
 */

import { Inject, Injectable } from '@nestjs/common';
import {
  EXCHANGE_SCOPE_CONSUMER_READ_PORT,
  EXCHANGE_SCOPE_QUERY_PORT,
  EXCHANGE_SCOPE_SERVICE_PORT,
  type ActivateExchangeScope,
  type ArchiveExchangeScope,
  type BindTradingAccount,
  type ExchangeScopeConsumerReadPort,
  type ExchangeScopeQueryPort,
  type ExchangeScopeServicePort,
  type PublishExchangeRiskPolicy,
  type RegisterExchangeScope,
  type SetAdapterBindingContext,
  type SuspendExchangeScope,
  type UnbindTradingAccount,
  type UpdateExchangeScopeConfig,
} from '../exchange-scope/ports/exchange-scope.port';
import {
  toDetailView,
  toPageView,
  toVenueCatalog,
  toWorkspaceView,
  type ExchangeScopeCommandView,
  type ExchangeScopeDetailView,
  type ExchangeScopePageView,
  type ExchangeScopeWorkspaceView,
  type ExchangeVenueCatalogView,
  EXCHANGE_SCOPE_PRODUCT_FLAGS,
} from './exchange-scope.view';

@Injectable()
export class ExchangeScopeProductService {
  constructor(
    @Inject(EXCHANGE_SCOPE_SERVICE_PORT)
    private readonly commands: ExchangeScopeServicePort,
    @Inject(EXCHANGE_SCOPE_QUERY_PORT)
    private readonly query: ExchangeScopeQueryPort,
    @Inject(EXCHANGE_SCOPE_CONSUMER_READ_PORT)
    private readonly consumer: ExchangeScopeConsumerReadPort,
  ) {}

  listVenues(): ExchangeVenueCatalogView {
    return toVenueCatalog();
  }

  listScopes(workspaceId: string, lifecycleStatus?: string): ExchangeScopePageView {
    return toPageView(
      this.query.listExchangeScopes({
        workspaceId,
        ...(lifecycleStatus ? { lifecycleStatus } : {}),
      }),
    );
  }

  getWorkspace(workspaceId: string): ExchangeScopeWorkspaceView {
    const aggregate = this.consumer.getWorkspaceAggregateProjection({ workspaceId }) ?? {
      workspaceId,
      scopeCount: 0,
      activeCount: 0,
      suspendedCount: 0,
      createdCount: 0,
      archivedCount: 0,
      scopes: [],
      inventsBalances: false as const,
      inventsFills: false as const,
      inventsRiskApprovals: false as const,
      inventsOrders: false as const,
      authorityClass: 'exchange_scope_artifact' as const,
      isRiskEngine: false as const,
      isExecutionEngine: false as const,
      isStrategyLibrary: false as const,
      isRuntime: false as const,
      isTradingSession: false as const,
      isLedger: false as const,
      approvesRisk: false as const,
      submitsOrders: false as const,
      forcesTrade: false as const,
      mutable: false as const,
      consumerWritable: false as const,
    };
    return toWorkspaceView(aggregate, this.query.listExchangeScopes({ workspaceId }));
  }

  getScope(workspaceId: string, exchangeScopeId: string): ExchangeScopeDetailView | null {
    const scope = this.query.getExchangeScope({ workspaceId, exchangeScopeId });
    if (!scope) return null;
    const summaries = this.query.listExchangeScopes({ workspaceId });
    const summary = summaries.find((item) => item.exchangeScopeId === exchangeScopeId);
    if (!summary) return null;

    const versions = this.query.listExchangeScopeHistory({ workspaceId, exchangeScopeId });
    const policies = this.query.listExchangeRiskPolicies({ workspaceId, exchangeScopeId });
    const bindings = this.query.listTradingAccountBindings({ workspaceId, exchangeScopeId });
    const readQuery = { workspaceId, exchangeScopeId };

    return toDetailView({
      scope,
      summary,
      config: this.query.getExchangeScopeConfig({ workspaceId, exchangeScopeId }),
      versions,
      policies,
      bindings,
      adapterContext: this.query.getAdapterBindingContext({ workspaceId, exchangeScopeId }),
      lifecycle: this.consumer.getLifecycleProjection(readQuery),
      metadata: this.consumer.getMetadataProjection(readQuery),
      activeStatus: this.consumer.getActiveStatusProjection(readQuery),
    });
  }

  register(cmd: RegisterExchangeScope): ExchangeScopeCommandView {
    const result = this.commands.registerExchangeScope(cmd);
    return this.toCommandView(cmd.workspaceId, result);
  }

  activate(cmd: ActivateExchangeScope): ExchangeScopeCommandView {
    return this.toCommandView(cmd.workspaceId, this.commands.activateExchangeScope(cmd));
  }

  suspend(cmd: SuspendExchangeScope): ExchangeScopeCommandView {
    return this.toCommandView(cmd.workspaceId, this.commands.suspendExchangeScope(cmd));
  }

  archive(cmd: ArchiveExchangeScope): ExchangeScopeCommandView {
    return this.toCommandView(cmd.workspaceId, this.commands.archiveExchangeScope(cmd));
  }

  rename(
    cmd: Readonly<{
      workspaceId: string;
      exchangeScopeId: string;
      displayName: string;
      updatedBy: string;
      asOf?: string;
    }>,
  ): ExchangeScopeCommandView {
    return this.updateConfig({
      workspaceId: cmd.workspaceId,
      exchangeScopeId: cmd.exchangeScopeId,
      updatedBy: cmd.updatedBy,
      displayName: cmd.displayName,
      asOf: cmd.asOf,
    });
  }

  updateConfig(cmd: UpdateExchangeScopeConfig): ExchangeScopeCommandView {
    return this.toCommandView(cmd.workspaceId, this.commands.updateExchangeScopeConfig(cmd));
  }

  publishPolicy(cmd: PublishExchangeRiskPolicy): ExchangeScopeCommandView {
    const result = this.commands.publishExchangeRiskPolicy(cmd);
    return {
      outcome: result.outcome,
      exchangeScopeId: result.exchangeScopeId,
      exchangeRiskPolicyId: result.exchangeRiskPolicyId,
      rejectionReasons: result.rejectionReasons ?? [],
      scope: this.getScope(cmd.workspaceId, result.exchangeScopeId),
      ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
    };
  }

  bindAccount(cmd: BindTradingAccount): ExchangeScopeCommandView {
    const result = this.commands.bindTradingAccount(cmd);
    return {
      outcome: result.outcome,
      exchangeScopeId: result.exchangeScopeId,
      tradingAccountBindingId: result.tradingAccountBindingId,
      rejectionReasons: result.rejectionReasons ?? [],
      scope: this.getScope(cmd.workspaceId, result.exchangeScopeId),
      ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
    };
  }

  unbindAccount(cmd: UnbindTradingAccount): ExchangeScopeCommandView {
    const result = this.commands.unbindTradingAccount(cmd);
    return {
      outcome: result.outcome,
      exchangeScopeId: result.exchangeScopeId,
      tradingAccountBindingId: result.tradingAccountBindingId,
      rejectionReasons: result.rejectionReasons ?? [],
      scope: this.getScope(cmd.workspaceId, result.exchangeScopeId),
      ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
    };
  }

  setAdapterContext(cmd: SetAdapterBindingContext): ExchangeScopeCommandView {
    const result = this.commands.setAdapterBindingContext(cmd);
    return {
      outcome: result.outcome,
      exchangeScopeId: result.exchangeScopeId,
      adapterBindingContextId: result.adapterBindingContextId,
      rejectionReasons: result.rejectionReasons ?? [],
      scope: this.getScope(cmd.workspaceId, result.exchangeScopeId),
      ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
    };
  }

  private toCommandView(
    workspaceId: string,
    result: {
      outcome: string;
      exchangeScopeId: string;
      rejectionReasons?: readonly string[];
    },
  ): ExchangeScopeCommandView {
    return {
      outcome: result.outcome,
      exchangeScopeId: result.exchangeScopeId,
      rejectionReasons: result.rejectionReasons ?? [],
      scope:
        result.exchangeScopeId && !result.rejectionReasons?.includes('scope_not_found')
          ? this.getScope(workspaceId, result.exchangeScopeId)
          : null,
      ...EXCHANGE_SCOPE_PRODUCT_FLAGS,
    };
  }
}

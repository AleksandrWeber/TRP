/**
 * RC-27 Epic 5 — Exchange Scope consumer read service.
 *
 * Nest façade for downstream consumers (Reporting / AI / Lake / CC / Notify / UI).
 * Implements ExchangeScopeConsumerReadPort over the query adapter.
 * Read-only. No commands. No trading-path / REST / persistence product.
 */

import { Inject, Injectable } from '@nestjs/common';
import { ExchangeScopeConsumerReadAdapter } from './adapters/exchange-scope-consumer-read.adapter';
import type {
  ExchangeRiskPolicyProjection,
  ExchangeScopeActiveStatusProjection,
  ExchangeScopeConfigProjection,
  ExchangeScopeLifecycleProjection,
  ExchangeScopeMetadataProjection,
  ExchangeScopeProjection,
  ExchangeScopeWorkspaceAggregateProjection,
  TradingAccountBindingProjection,
} from './domain/exchange-scope-consumer-read-model';
import type {
  ExchangeScopeConsumerReadPort,
  ExchangeScopeConsumerReadQuery,
} from './ports/exchange-scope.port';

@Injectable()
export class ExchangeScopeConsumerReadService implements ExchangeScopeConsumerReadPort {
  constructor(
    @Inject(ExchangeScopeConsumerReadAdapter)
    private readonly adapter: ExchangeScopeConsumerReadAdapter,
  ) {}

  listScopeProjections(query: ExchangeScopeConsumerReadQuery): readonly ExchangeScopeProjection[] {
    return this.adapter.listScopeProjections(query);
  }

  getScopeProjection(query: ExchangeScopeConsumerReadQuery): ExchangeScopeProjection | null {
    return this.adapter.getScopeProjection(query);
  }

  getLifecycleProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeLifecycleProjection | null {
    return this.adapter.getLifecycleProjection(query);
  }

  getConfigSummaryProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeConfigProjection | null {
    return this.adapter.getConfigSummaryProjection(query);
  }

  getPolicyInputProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeRiskPolicyProjection | null {
    return this.adapter.getPolicyInputProjection(query);
  }

  listAccountBindingProjections(
    query: ExchangeScopeConsumerReadQuery,
  ): readonly TradingAccountBindingProjection[] {
    return this.adapter.listAccountBindingProjections(query);
  }

  getMetadataProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeMetadataProjection | null {
    return this.adapter.getMetadataProjection(query);
  }

  getActiveStatusProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeActiveStatusProjection | null {
    return this.adapter.getActiveStatusProjection(query);
  }

  getWorkspaceAggregateProjection(
    query: ExchangeScopeConsumerReadQuery,
  ): ExchangeScopeWorkspaceAggregateProjection | null {
    return this.adapter.getWorkspaceAggregateProjection(query);
  }
}

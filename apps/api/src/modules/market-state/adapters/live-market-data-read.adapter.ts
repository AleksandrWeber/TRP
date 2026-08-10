/**
 * RC-26 Epic 2 — Live Market Data read adapter (Market State consumer).
 *
 * Maps MarketDataQueryService views → Market State input read models.
 * No classification. No scoring. No Session / Orders coupling.
 */

import { Inject, Injectable } from '@nestjs/common';
import { MarketDataQueryService } from '../../live-market-data/api/market-data-query.service';
import {
  toExchangeMetadataInputs,
  toMarketSnapshotInputs,
  toSymbolStateBundle,
  type ExchangeMetadataInput,
  type MarketSnapshotInput,
  type MarketStateLiveMarketDataReadQuery,
  type SymbolStateBundle,
} from '../domain/market-state-input-read-model';
import type { MarketStateLiveMarketDataReadPort } from '../ports/market-state.port';

@Injectable()
export class MarketStateLiveMarketDataReadAdapter implements MarketStateLiveMarketDataReadPort {
  constructor(
    @Inject(MarketDataQueryService)
    private readonly marketDataQuery: MarketDataQueryService,
  ) {}

  getCurrentMarketSnapshots(
    query: MarketStateLiveMarketDataReadQuery,
  ): readonly MarketSnapshotInput[] {
    if (!query.workspaceId) {
      return Object.freeze([]);
    }
    const latest = this.marketDataQuery.listLatest(query.workspaceId);
    return toMarketSnapshotInputs(
      query.workspaceId,
      latest,
      query.exchangeScopeId,
      query.instrument,
      query.streamId,
    );
  }

  getExchangeMetadata(query: MarketStateLiveMarketDataReadQuery): readonly ExchangeMetadataInput[] {
    if (!query.workspaceId) {
      return Object.freeze([]);
    }
    const subscriptions = this.marketDataQuery.listSubscriptions(query.workspaceId);
    return toExchangeMetadataInputs(
      query.workspaceId,
      subscriptions,
      query.exchangeScopeId,
      query.instrument,
    );
  }

  getSymbolState(query: MarketStateLiveMarketDataReadQuery): SymbolStateBundle {
    if (!query.workspaceId) {
      return toSymbolStateBundle(
        query.workspaceId ?? '',
        [],
        query.exchangeScopeId,
        query.streamIds,
      );
    }
    const statuses = this.marketDataQuery.listStatuses(query.workspaceId);
    return toSymbolStateBundle(query.workspaceId, statuses, query.exchangeScopeId, query.streamIds);
  }
}

/**
 * RC-25 Epic 2 — Live Market Data read adapter (Qualification consumer).
 *
 * Maps MarketDataQueryService views → observational read models.
 * No evaluation. No scoring. No Session / Orders coupling.
 */

import { Inject, Injectable } from '@nestjs/common';
import { MarketDataQueryService } from '../../live-market-data/api/market-data-query.service';
import {
  toConnectivityHealthView,
  toExchangeMetadataSlices,
  toHistoricalCharacteristicSlices,
  toMarketObservationSlices,
  type ConnectivityHealthView,
  type ExchangeMetadataSlice,
  type HistoricalCharacteristicSlice,
  type LiveMarketDataReadQuery,
  type MarketObservationSlice,
} from '../domain/market-qualification-observational-read-model';
import type { LiveMarketDataReadPort } from '../ports/market-qualification.port';

@Injectable()
export class LiveMarketDataReadAdapter implements LiveMarketDataReadPort {
  constructor(
    @Inject(MarketDataQueryService)
    private readonly marketDataQuery: MarketDataQueryService,
  ) {}

  getConnectivityHealth(query: LiveMarketDataReadQuery): ConnectivityHealthView {
    const statuses = this.marketDataQuery.listStatuses(query.workspaceId);
    return toConnectivityHealthView(
      query.workspaceId,
      statuses,
      query.exchangeScopeId,
      query.streamIds,
    );
  }

  getMarketObservations(query: LiveMarketDataReadQuery): readonly MarketObservationSlice[] {
    const latest = this.marketDataQuery.listLatest(query.workspaceId);
    return toMarketObservationSlices(
      query.workspaceId,
      latest,
      query.exchangeScopeId,
      query.instrument,
      query.streamId,
    );
  }

  getExchangeMetadata(query: LiveMarketDataReadQuery): readonly ExchangeMetadataSlice[] {
    const subscriptions = this.marketDataQuery.listSubscriptions(query.workspaceId);
    return toExchangeMetadataSlices(
      query.workspaceId,
      subscriptions,
      query.exchangeScopeId,
      query.instrument,
    );
  }

  getHistoricalCharacteristics(
    query: LiveMarketDataReadQuery,
  ): readonly HistoricalCharacteristicSlice[] {
    const observations = this.getMarketObservations(query);
    return toHistoricalCharacteristicSlices(observations);
  }
}

/**
 * RC-25 Epic 2 — Market Qualification observational read facade.
 *
 * Thin read-only surface over Live Market Data + Research consumers.
 * No qualification runs. No confidence scoring. No profile publish.
 */

import { Inject, Injectable } from '@nestjs/common';
import type {
  ConnectivityHealthView,
  ExchangeMetadataSlice,
  HistoricalCharacteristicSlice,
  LiveMarketDataReadQuery,
  MarketObservationSlice,
  ResearchOutputReadQuery,
  ResearchOutputRef,
} from './domain/market-qualification-observational-read-model';
import {
  LIVE_MARKET_DATA_READ_CONSUMER,
  RESEARCH_OUTPUT_READ_CONSUMER,
  type LiveMarketDataReadPort,
  type ResearchOutputReadPort,
} from './ports/market-qualification.port';

@Injectable()
export class MarketQualificationObservationalReadService {
  constructor(
    @Inject(LIVE_MARKET_DATA_READ_CONSUMER)
    private readonly liveMarketData: LiveMarketDataReadPort,
    @Inject(RESEARCH_OUTPUT_READ_CONSUMER)
    private readonly researchOutputs: ResearchOutputReadPort,
  ) {}

  getConnectivityHealth(query: LiveMarketDataReadQuery): ConnectivityHealthView {
    return this.liveMarketData.getConnectivityHealth(query);
  }

  getMarketObservations(query: LiveMarketDataReadQuery): readonly MarketObservationSlice[] {
    return this.liveMarketData.getMarketObservations(query);
  }

  getExchangeMetadata(query: LiveMarketDataReadQuery): readonly ExchangeMetadataSlice[] {
    return this.liveMarketData.getExchangeMetadata(query);
  }

  getHistoricalCharacteristics(
    query: LiveMarketDataReadQuery,
  ): readonly HistoricalCharacteristicSlice[] {
    return this.liveMarketData.getHistoricalCharacteristics(query);
  }

  getApprovedResearchOutputs(query: ResearchOutputReadQuery): readonly ResearchOutputRef[] {
    return this.researchOutputs.getApprovedResearchOutputs(query);
  }
}

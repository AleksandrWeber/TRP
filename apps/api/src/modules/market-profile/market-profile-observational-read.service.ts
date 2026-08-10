/**
 * RC-25 Epic 2 — Market Profile observational input read facade.
 *
 * Consumes Live Market Data + Research through Market Qualification exports.
 * No profile calculation. No scoring. No publish.
 *
 * Dependency direction: Qualification → Profile (one-way).
 */

import { Inject, Injectable } from '@nestjs/common';
import type {
  LiveMarketDataReadQuery,
  ResearchOutputReadQuery,
  ResearchOutputRef,
} from '../market-qualification/domain/market-qualification-observational-read-model';
import {
  LIVE_MARKET_DATA_READ_CONSUMER,
  RESEARCH_OUTPUT_READ_CONSUMER,
  type LiveMarketDataReadPort,
  type ResearchOutputReadPort,
} from '../market-qualification/ports/market-qualification.port';
import {
  toHistoryInputs,
  toLiquidityInputs,
  toStructureInputs,
  toTrendInputs,
  toVolatilityInputs,
  type MarketProfileInputReadQuery,
  type ProfileDimensionInputSlice,
} from './domain/market-profile-input-read-model';

@Injectable()
export class MarketProfileObservationalReadService {
  constructor(
    @Inject(LIVE_MARKET_DATA_READ_CONSUMER)
    private readonly liveMarketData: LiveMarketDataReadPort,
    @Inject(RESEARCH_OUTPUT_READ_CONSUMER)
    private readonly researchOutputs: ResearchOutputReadPort,
  ) {}

  getMarketHistoryInputs(
    query: MarketProfileInputReadQuery,
  ): readonly ProfileDimensionInputSlice[] {
    const characteristics = this.liveMarketData.getHistoricalCharacteristics(toLiveQuery(query));
    return toHistoryInputs(characteristics);
  }

  getVolatilityInputs(query: MarketProfileInputReadQuery): readonly ProfileDimensionInputSlice[] {
    return toVolatilityInputs(this.liveMarketData.getMarketObservations(toLiveQuery(query)));
  }

  getLiquidityInputs(query: MarketProfileInputReadQuery): readonly ProfileDimensionInputSlice[] {
    return toLiquidityInputs(this.liveMarketData.getMarketObservations(toLiveQuery(query)));
  }

  getTrendInputs(query: MarketProfileInputReadQuery): readonly ProfileDimensionInputSlice[] {
    return toTrendInputs(this.liveMarketData.getMarketObservations(toLiveQuery(query)));
  }

  getStructureInputs(query: MarketProfileInputReadQuery): readonly ProfileDimensionInputSlice[] {
    return toStructureInputs(this.liveMarketData.getMarketObservations(toLiveQuery(query)));
  }

  getApprovedResearchOutputs(query: ResearchOutputReadQuery): readonly ResearchOutputRef[] {
    return this.researchOutputs.getApprovedResearchOutputs(query);
  }
}

function toLiveQuery(query: MarketProfileInputReadQuery): LiveMarketDataReadQuery {
  return {
    workspaceId: query.workspaceId,
    exchangeScopeId: query.exchangeScopeId,
    instrument: query.instrument,
    streamId: query.streamId,
  };
}

/**
 * RC-26 Epic 2 — Market State observational read façade.
 *
 * Thin pass-through over LMD / Qualification / Profile consumer adapters.
 * No classification. No scoring. No Session / Orchestrator commands.
 */

import { Inject, Injectable } from '@nestjs/common';
import type {
  ExchangeMetadataInput,
  MarketSnapshotInput,
  MarketStateLiveMarketDataReadQuery,
  MarketStateProfileVersionReadQuery,
  MarketStateTargetReadQuery,
  ProfileLatestInput,
  ProfileVersionMetadataInput,
  QualificationConfidenceInput,
  QualificationHealthInput,
  QualificationLifecycleInput,
  QualificationSummaryInput,
  SymbolStateBundle,
} from './domain/market-state-input-read-model';
import {
  MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER,
  MARKET_STATE_PROFILE_CONSUMER,
  MARKET_STATE_QUALIFICATION_CONSUMER,
  type MarketStateLiveMarketDataReadPort,
  type MarketStateProfileConsumerPort,
  type MarketStateQualificationConsumerPort,
} from './ports/market-state.port';

@Injectable()
export class MarketStateObservationalReadService {
  constructor(
    @Inject(MARKET_STATE_LIVE_MARKET_DATA_READ_CONSUMER)
    private readonly liveMarketData: MarketStateLiveMarketDataReadPort,
    @Inject(MARKET_STATE_QUALIFICATION_CONSUMER)
    private readonly qualification: MarketStateQualificationConsumerPort,
    @Inject(MARKET_STATE_PROFILE_CONSUMER)
    private readonly profile: MarketStateProfileConsumerPort,
  ) {}

  getCurrentMarketSnapshots(
    query: MarketStateLiveMarketDataReadQuery,
  ): readonly MarketSnapshotInput[] {
    return this.liveMarketData.getCurrentMarketSnapshots(query);
  }

  getExchangeMetadata(query: MarketStateLiveMarketDataReadQuery): readonly ExchangeMetadataInput[] {
    return this.liveMarketData.getExchangeMetadata(query);
  }

  getSymbolState(query: MarketStateLiveMarketDataReadQuery): SymbolStateBundle {
    return this.liveMarketData.getSymbolState(query);
  }

  getQualificationLifecycle(query: MarketStateTargetReadQuery): QualificationLifecycleInput | null {
    return this.qualification.getLifecycleStatus(query);
  }

  getQualificationConfidence(
    query: MarketStateTargetReadQuery,
  ): QualificationConfidenceInput | null {
    return this.qualification.getConfidence(query);
  }

  getQualificationHealth(query: MarketStateTargetReadQuery): QualificationHealthInput | null {
    return this.qualification.getHealth(query);
  }

  getQualificationSummary(query: MarketStateTargetReadQuery): QualificationSummaryInput | null {
    return this.qualification.getQualificationSummary(query);
  }

  getLatestProfile(query: MarketStateTargetReadQuery): ProfileLatestInput | null {
    return this.profile.getLatestProfile(query);
  }

  getProfileHistory(query: MarketStateTargetReadQuery): readonly ProfileVersionMetadataInput[] {
    return this.profile.getProfileHistory(query);
  }

  getProfileVersionMetadata(
    query: MarketStateProfileVersionReadQuery,
  ): ProfileVersionMetadataInput | null {
    return this.profile.getProfileVersionMetadata(query);
  }
}

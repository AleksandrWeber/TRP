import { Injectable } from '@nestjs/common';
import { MarketDataDomainService } from '../market-data/market-data-domain.service';
import type { HistoricalDataRequest } from './historical-data-request';
import type { HistoricalDataResponse } from './historical-data-response';
import type { MarketDataProvider } from './market-data-provider';
import { MarketDataSource } from './market-data-source';

/**
 * Reads historical bars from MarketDataDomainService (US117).
 * No external API calls.
 */
@Injectable()
export class LocalRepositoryProvider implements MarketDataProvider {
  constructor(private readonly marketData: MarketDataDomainService) {}

  supports(source: string): boolean {
    return source === MarketDataSource.Local;
  }

  async fetchHistorical(request: HistoricalDataRequest): Promise<HistoricalDataResponse> {
    const bars = this.marketData.getRange({
      workspaceId: request.workspaceId,
      instrument: request.instrument,
      timeframe: request.timeframe,
      from: request.from,
      to: request.to,
    });

    return {
      bars,
      source: MarketDataSource.Local,
      fetchedAt: new Date().toISOString(),
    };
  }
}

import { Inject, Injectable, Optional } from '@nestjs/common';
import type { HistoricalDataRequest } from './historical-data-request';
import type { HistoricalDataResponse } from './historical-data-response';
import type { MarketDataProvider } from './market-data-provider';
import { MARKET_DATA_PROVIDERS } from './market-data-providers.token';

/**
 * Registry for MarketDataProvider strategies (US117).
 * register / resolve / fetchHistorical — Domain is untouched when providers are added.
 */
@Injectable()
export class ProviderRegistry {
  private readonly providers: MarketDataProvider[] = [];

  constructor(
    @Optional()
    @Inject(MARKET_DATA_PROVIDERS)
    initialProviders: MarketDataProvider[] | null = null,
  ) {
    for (const provider of initialProviders ?? []) {
      this.register(provider);
    }
  }

  register(provider: MarketDataProvider): void {
    this.providers.push(provider);
  }

  resolve(source: string): MarketDataProvider {
    const normalized = source.trim();
    if (normalized === '') {
      throw new Error('source must not be empty');
    }

    const provider = this.providers.find((item) => item.supports(normalized));
    if (!provider) {
      throw new Error(`No MarketDataProvider registered for source: ${normalized}`);
    }
    return provider;
  }

  async fetchHistorical(
    source: string,
    request: HistoricalDataRequest,
  ): Promise<HistoricalDataResponse> {
    return this.resolve(source).fetchHistorical(request);
  }
}

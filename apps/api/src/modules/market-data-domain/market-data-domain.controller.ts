import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  MarketDataCacheService,
  type MarketCacheStatsView,
} from '../market-data-cache/market-data-cache.service';
import { MarketCandlesQueryDto, MarketSymbolParamDto } from '../../validation';
import type { Candle } from './domain/candle';
import type { Ticker } from './domain/ticker';
import type { Timeframe } from './domain/timeframe';
import type { MarketDataProviderHealthStatus } from './ports/market-data-provider';
import { MarketDataProviderRegistry } from './ports/market-data-provider-registry';

export const DEFAULT_CANDLES_LIMIT = 100;

export type MarketHealthView = {
  providerId: string;
  status: MarketDataProviderHealthStatus;
  detail: string;
  registeredProviders: ReadonlyArray<string>;
  checkedAt: string;
};

/**
 * Market Data Domain HTTP API (US006 / US008).
 * Read-only current-market endpoints. Ticker and candle reads go through the
 * MarketDataCacheService (US008); on a miss the cache invokes the loader,
 * which resolves the active provider behind the MarketDataProvider port.
 * No workspace scoping — market data is global.
 */
@Controller({ path: 'market', version: '1' })
export class MarketDataDomainController {
  constructor(
    private readonly registry: MarketDataProviderRegistry,
    private readonly cache: MarketDataCacheService,
  ) {}

  @Get('health')
  async health(): Promise<MarketHealthView> {
    const health = await this.registry.getActive().health();
    return {
      providerId: health.providerId,
      status: health.status,
      detail: health.detail,
      registeredProviders: this.registry.list(),
      checkedAt: new Date().toISOString(),
    };
  }

  @Get('cache')
  cacheStats(): MarketCacheStatsView {
    return this.cache.stats();
  }

  @Get('ticker/:symbol')
  async ticker(@Param() params: MarketSymbolParamDto): Promise<Ticker> {
    return this.cache.getTicker(params.symbol, () =>
      this.registry.getActive().getTicker(params.symbol),
    );
  }

  @Get('candles')
  async candles(@Query() query: MarketCandlesQueryDto): Promise<Candle[]> {
    const timeframe = query.timeframe as Timeframe;
    const limit = query.limit ?? DEFAULT_CANDLES_LIMIT;
    return this.cache.getCandles(query.symbol, timeframe, limit, () =>
      this.registry.getActive().getCandles(query.symbol, timeframe, limit),
    );
  }
}

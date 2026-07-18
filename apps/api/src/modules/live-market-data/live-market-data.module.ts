import { Module } from '@nestjs/common';
import { MarketDataValidator } from './normalization/market-data-validator';
import { LiveMarketConnectorRegistry } from './ports/live-market-connector-registry';
import { LIVE_MARKET_CONNECTOR_REGISTRY } from './ports/live-market-connector-registry.token';

/**
 * Live Market Data Nest module (US126–US137).
 * Domain contracts, connector port/registry, normalization/validation.
 * No strategy / Orders / accounting.
 */
@Module({
  providers: [
    LiveMarketConnectorRegistry,
    {
      provide: LIVE_MARKET_CONNECTOR_REGISTRY,
      useExisting: LiveMarketConnectorRegistry,
    },
    MarketDataValidator,
  ],
  exports: [LiveMarketConnectorRegistry, LIVE_MARKET_CONNECTOR_REGISTRY, MarketDataValidator],
})
export class LiveMarketDataModule {}

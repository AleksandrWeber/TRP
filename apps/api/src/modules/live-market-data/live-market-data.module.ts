import { Module } from '@nestjs/common';
import { LiveMarketConnectorRegistry } from './ports/live-market-connector-registry';
import { LIVE_MARKET_CONNECTOR_REGISTRY } from './ports/live-market-connector-registry.token';

/**
 * Live Market Data Nest module (US126–US131).
 * Domain contracts + connector port/registry. No strategy / Orders / accounting.
 */
@Module({
  providers: [
    LiveMarketConnectorRegistry,
    {
      provide: LIVE_MARKET_CONNECTOR_REGISTRY,
      useExisting: LiveMarketConnectorRegistry,
    },
  ],
  exports: [LiveMarketConnectorRegistry, LIVE_MARKET_CONNECTOR_REGISTRY],
})
export class LiveMarketDataModule {}

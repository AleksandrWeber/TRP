import { Module } from '@nestjs/common';
import { MarketStreamIntegrityController } from './integrity/market-stream-integrity-controller';
import { MarketDataValidator } from './normalization/market-data-validator';
import { LiveMarketConnectorRegistry } from './ports/live-market-connector-registry';
import { LIVE_MARKET_CONNECTOR_REGISTRY } from './ports/live-market-connector-registry.token';

/**
 * Live Market Data Nest module (US126–US139).
 * Domain contracts, connector port/registry, normalization/validation,
 * and per-stream integrity/recovery primitives.
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
    MarketStreamIntegrityController,
  ],
  exports: [
    LiveMarketConnectorRegistry,
    LIVE_MARKET_CONNECTOR_REGISTRY,
    MarketDataValidator,
    MarketStreamIntegrityController,
  ],
})
export class LiveMarketDataModule {}

import { Module } from '@nestjs/common';
import { SecurityAuditModule } from '../security-audit';
import { WorkspaceModule } from '../workspace';
import { BinanceSymbolDiscoveryAdapter } from './binance-symbol.adapter';
import { MarketDataAdapterFactory } from './market-data-adapter.factory';
import { MarketDataAdapterRegistry } from './market-data-adapter.registry';
import { MarketDataSymbolsController } from './market-data-symbols.controller';
import { MarketSymbolCache } from './market-symbol.cache';
import { MarketSymbolDiscoveryAudit } from './market-symbol.audit';
import { MARKET_DATA_SYMBOL_DISCOVERY_ADAPTERS } from './market-symbol.discovery';
import {
  DEFAULT_SYMBOL_DISCOVERY_TIMEOUT_MS,
  FetchSymbolDiscoveryHttpClient,
  SYMBOL_DISCOVERY_HTTP_CLIENT,
  SYMBOL_DISCOVERY_TIMEOUT_MS,
} from './market-symbol.http';
import { MarketSymbolDiscoveryService } from './market-symbol.service';
import { PlannedSymbolDiscoveryAdapter } from './planned-symbol.adapter';

/**
 * Market Data Foundation module.
 *
 * W2-S03-a: provider identity, capability metadata, static availability,
 * adapter contract, registry, and factory/resolver.
 * W2-S03-b: exchange symbol discovery, normalization, validation, cache,
 * and projection. Ticker, candles, and order book remain later slices.
 */
@Module({
  imports: [WorkspaceModule, SecurityAuditModule],
  controllers: [MarketDataSymbolsController],
  providers: [
    {
      provide: MarketDataAdapterRegistry,
      useFactory: () => new MarketDataAdapterRegistry(),
    },
    {
      provide: MarketDataAdapterFactory,
      useFactory: (registry: MarketDataAdapterRegistry) => new MarketDataAdapterFactory(registry),
      inject: [MarketDataAdapterRegistry],
    },
    FetchSymbolDiscoveryHttpClient,
    {
      provide: SYMBOL_DISCOVERY_HTTP_CLIENT,
      useExisting: FetchSymbolDiscoveryHttpClient,
    },
    {
      provide: SYMBOL_DISCOVERY_TIMEOUT_MS,
      useValue: DEFAULT_SYMBOL_DISCOVERY_TIMEOUT_MS,
    },
    BinanceSymbolDiscoveryAdapter,
    {
      provide: MARKET_DATA_SYMBOL_DISCOVERY_ADAPTERS,
      useFactory: (binance: BinanceSymbolDiscoveryAdapter) => [
        binance,
        new PlannedSymbolDiscoveryAdapter('BYBIT'),
        new PlannedSymbolDiscoveryAdapter('OKX'),
      ],
      inject: [BinanceSymbolDiscoveryAdapter],
    },
    MarketSymbolCache,
    MarketSymbolDiscoveryAudit,
    MarketSymbolDiscoveryService,
  ],
  exports: [
    MarketDataAdapterRegistry,
    MarketDataAdapterFactory,
    MarketSymbolDiscoveryService,
    MarketSymbolCache,
  ],
})
export class MarketDataFoundationModule {}

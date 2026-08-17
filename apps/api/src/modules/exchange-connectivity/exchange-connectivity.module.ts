import { Module } from '@nestjs/common';
import { ExchangeProviderRegistry } from './exchange-provider-registry';

/**
 * W2-S02-a Exchange Connectivity Foundation module.
 *
 * Owns the provider catalog, capability model, registry, and connectivity
 * contract. It does not open network connections or own Connection Management.
 */
@Module({
  providers: [
    {
      provide: ExchangeProviderRegistry,
      useFactory: () => new ExchangeProviderRegistry(),
    },
  ],
  exports: [ExchangeProviderRegistry],
})
export class ExchangeConnectivityModule {}

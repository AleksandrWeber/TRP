import { Module } from '@nestjs/common';
import { SecretVaultModule } from '../secret-vault';
import { SecurityAuditModule } from '../security-audit';
import { BinanceCapabilityAdapter } from './binance-capability.adapter';
import { BinanceHandshakeAdapter } from './binance-handshake.adapter';
import { EXCHANGE_CAPABILITY_ADAPTERS } from './exchange-capability.adapter';
import { ExchangeCapabilityAudit } from './exchange-capability.audit';
import { ExchangeCapabilityCache } from './exchange-capability.cache';
import { ExchangeCapabilityService } from './exchange-capability.service';
import { ExchangeHandshakeAudit } from './exchange-handshake.audit';
import { FetchHandshakeHttpClient } from './exchange-handshake.http';
import { ExchangeHandshakeService } from './exchange-handshake.service';
import { ExchangeSessionAudit } from './exchange-session.audit';
import { ExchangeSessionService } from './exchange-session.service';
import {
  DEFAULT_HANDSHAKE_TIMEOUT_MS,
  HANDSHAKE_CLOCK,
  HANDSHAKE_HTTP_CLIENT,
  HANDSHAKE_TIMEOUT_MS,
  SYSTEM_HANDSHAKE_CLOCK,
} from './exchange-handshake.tokens';
import { ExchangeProviderRegistry } from './exchange-provider-registry';
import { EXCHANGE_PROVIDER_ADAPTERS } from './exchange-provider-adapter';
import { PlannedExchangeCapabilityAdapter } from './planned-capability.adapter';
import { PlannedExchangeHandshakeAdapter } from './planned-handshake.adapter';

/**
 * Exchange Connectivity Foundation module.
 *
 * W2-S02-a: provider catalog, capability model, registry, connectivity contract.
 * W2-S02-b: authenticated handshake service and provider adapters.
 * W2-S02-c: authenticated session lifecycle, health projection, reconnect eligibility.
 * W2-S02-d: capability verification, projection, and session-scoped cache.
 * Connection Management remains the operator facade. Vault remains the secret owner.
 */
@Module({
  imports: [SecretVaultModule, SecurityAuditModule],
  providers: [
    {
      provide: ExchangeProviderRegistry,
      useFactory: () => new ExchangeProviderRegistry(),
    },
    FetchHandshakeHttpClient,
    {
      provide: HANDSHAKE_HTTP_CLIENT,
      useExisting: FetchHandshakeHttpClient,
    },
    {
      provide: HANDSHAKE_CLOCK,
      useValue: SYSTEM_HANDSHAKE_CLOCK,
    },
    {
      provide: HANDSHAKE_TIMEOUT_MS,
      useValue: DEFAULT_HANDSHAKE_TIMEOUT_MS,
    },
    BinanceHandshakeAdapter,
    {
      provide: EXCHANGE_PROVIDER_ADAPTERS,
      useFactory: (binance: BinanceHandshakeAdapter) => [
        binance,
        new PlannedExchangeHandshakeAdapter('BYBIT'),
        new PlannedExchangeHandshakeAdapter('OKX'),
      ],
      inject: [BinanceHandshakeAdapter],
    },
    BinanceCapabilityAdapter,
    {
      provide: EXCHANGE_CAPABILITY_ADAPTERS,
      useFactory: (binance: BinanceCapabilityAdapter) => [
        binance,
        new PlannedExchangeCapabilityAdapter('BYBIT'),
        new PlannedExchangeCapabilityAdapter('OKX'),
      ],
      inject: [BinanceCapabilityAdapter],
    },
    ExchangeHandshakeAudit,
    ExchangeHandshakeService,
    ExchangeSessionAudit,
    ExchangeSessionService,
    ExchangeCapabilityAudit,
    ExchangeCapabilityCache,
    ExchangeCapabilityService,
  ],
  exports: [
    ExchangeProviderRegistry,
    ExchangeHandshakeService,
    ExchangeSessionService,
    ExchangeCapabilityService,
  ],
})
export class ExchangeConnectivityModule {}

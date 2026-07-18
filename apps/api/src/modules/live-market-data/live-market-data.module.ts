import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { MARKET_CHECKPOINT_PERSISTENCE } from './checkpoints/market-checkpoint-persistence';
import { MarketCheckpointStore } from './checkpoints/market-checkpoint-store';
import { PrismaMarketCheckpointPersistence } from './checkpoints/prisma-market-checkpoint.persistence';
import { MarketStreamIntegrityController } from './integrity/market-stream-integrity-controller';
import { MarketDataValidator } from './normalization/market-data-validator';
import { LiveMarketConnectorRegistry } from './ports/live-market-connector-registry';
import { LIVE_MARKET_CONNECTOR_REGISTRY } from './ports/live-market-connector-registry.token';
import { MarketSubscriptionRegistry } from './subscriptions/market-subscription-registry';

/**
 * Live Market Data Nest module (US126–US141).
 * Domain contracts, connector port/registry, normalization/validation,
 * per-stream integrity/recovery, subscription registry, and durable checkpoints.
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
    MarketSubscriptionRegistry,
    {
      provide: MARKET_CHECKPOINT_PERSISTENCE,
      useFactory: (prisma: PrismaService) => new PrismaMarketCheckpointPersistence(prisma),
      inject: [PrismaService],
    },
    MarketCheckpointStore,
  ],
  exports: [
    LiveMarketConnectorRegistry,
    LIVE_MARKET_CONNECTOR_REGISTRY,
    MarketDataValidator,
    MarketStreamIntegrityController,
    MarketSubscriptionRegistry,
    MarketCheckpointStore,
  ],
})
export class LiveMarketDataModule {}

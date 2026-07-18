import { Module } from '@nestjs/common';
import { EventProcessingModule } from '../event-processing/event-processing.module';
import type { InboxRepository } from '../event-processing/repositories/inbox.repository';
import type { ConsumerCheckpointRepository } from '../event-processing/repositories/consumer-checkpoint.repository';
import { INBOX_REPOSITORY } from '../event-processing/repositories/inbox.repository.token';
import { CONSUMER_CHECKPOINT_REPOSITORY } from '../event-processing/repositories/consumer-checkpoint.repository.token';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { MARKET_CHECKPOINT_PERSISTENCE } from './checkpoints/market-checkpoint-persistence';
import { MarketCheckpointStore } from './checkpoints/market-checkpoint-store';
import { PrismaMarketCheckpointPersistence } from './checkpoints/prisma-market-checkpoint.persistence';
import { MarketStreamIntegrityController } from './integrity/market-stream-integrity-controller';
import { MarketDataValidator } from './normalization/market-data-validator';
import { LiveMarketConnectorRegistry } from './ports/live-market-connector-registry';
import { LIVE_MARKET_CONNECTOR_REGISTRY } from './ports/live-market-connector-registry.token';
import { LatestMarketStateProjection } from './projection/latest-market-state-projection';
import { MARKET_SUBSCRIPTION_PERSISTENCE } from './subscriptions/market-subscription-persistence';
import { MarketSubscriptionRegistry } from './subscriptions/market-subscription-registry';
import { PrismaMarketSubscriptionPersistence } from './subscriptions/prisma-market-subscription.persistence';

/**
 * Live Market Data Nest module (US126–US143).
 * Domain contracts, connectors, normalization, integrity/recovery,
 * durable subscriptions/checkpoints, startup recovery primitives, and
 * latest-market-state projection. No strategy / Orders / accounting.
 */
@Module({
  imports: [EventProcessingModule],
  providers: [
    LiveMarketConnectorRegistry,
    {
      provide: LIVE_MARKET_CONNECTOR_REGISTRY,
      useExisting: LiveMarketConnectorRegistry,
    },
    MarketDataValidator,
    MarketStreamIntegrityController,
    {
      provide: MARKET_SUBSCRIPTION_PERSISTENCE,
      useFactory: (prisma: PrismaService) => new PrismaMarketSubscriptionPersistence(prisma),
      inject: [PrismaService],
    },
    MarketSubscriptionRegistry,
    {
      provide: MARKET_CHECKPOINT_PERSISTENCE,
      useFactory: (prisma: PrismaService) => new PrismaMarketCheckpointPersistence(prisma),
      inject: [PrismaService],
    },
    MarketCheckpointStore,
    {
      provide: LatestMarketStateProjection,
      useFactory: (
        inbox: InboxRepository,
        consumerCheckpoints: ConsumerCheckpointRepository,
        marketCheckpoints: MarketCheckpointStore,
      ) => new LatestMarketStateProjection(inbox, consumerCheckpoints, marketCheckpoints),
      inject: [INBOX_REPOSITORY, CONSUMER_CHECKPOINT_REPOSITORY, MarketCheckpointStore],
    },
  ],
  exports: [
    LiveMarketConnectorRegistry,
    LIVE_MARKET_CONNECTOR_REGISTRY,
    MarketDataValidator,
    MarketStreamIntegrityController,
    MarketSubscriptionRegistry,
    MarketCheckpointStore,
    LatestMarketStateProjection,
  ],
})
export class LiveMarketDataModule {}

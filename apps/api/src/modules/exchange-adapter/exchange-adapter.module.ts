import { Module } from '@nestjs/common';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { WorkspaceModule } from '../workspace';
import { ExchangeAdapterController } from './exchange-adapter.controller';
import { EXCHANGE_ADAPTER_REPOSITORY } from './exchange-adapter.repository';
import { ExchangeAdapterService } from './exchange-adapter.service';
import { ExchangeEventPublisher } from './exchange-event-publisher';
import { ExchangeFactory } from './exchange-factory';
import { ExchangeManager } from './exchange-manager';
import { ExchangeRegistry } from './exchange-registry';
import { ExchangeRouter } from './exchange-router';
import { PrismaExchangeAdapterRepository } from './prisma-exchange-adapter.repository';
import { ExchangeConnectivityPersistenceService } from './exchange-connectivity-persistence.service';
import { BybitExchangeConnectivityPersistenceService } from './bybit-exchange-connectivity-persistence.service';
import { OkxExchangeConnectivityPersistenceService } from './okx-exchange-connectivity-persistence.service';
import { OkxExchangeConnectivityRecoveryStore } from './okx-exchange-connectivity-recovery-store';
import { OkxExchangeConnectivityRestartRecoveryService } from './okx-exchange-connectivity-restart-recovery.service';
import { BybitExchangeConnectivityRecoveryStore } from './bybit-exchange-connectivity-recovery-store';
import { BybitExchangeConnectivityRestartRecoveryService } from './bybit-exchange-connectivity-restart-recovery.service';
import { ExchangeConnectivityRecoveryStore } from './exchange-connectivity-recovery-store';
import { ExchangeConnectivityRestartRecoveryService } from './exchange-connectivity-restart-recovery.service';
import { EXCHANGE_CONNECTIVITY_STATE_REPOSITORY } from './domain/exchange-connectivity-state.repository';
import { BYBIT_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY } from './domain/bybit-exchange-connectivity-state.repository';
import { OKX_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY } from './domain/okx-exchange-connectivity-state.repository';
import { PrismaExchangeConnectivityStateRepository } from './persistence/prisma-exchange-connectivity-state.repository';
import { PrismaBybitExchangeConnectivityStateRepository } from './persistence/prisma-bybit-exchange-connectivity-state.repository';
import { PrismaOkxExchangeConnectivityStateRepository } from './persistence/prisma-okx-exchange-connectivity-state.repository';

/**
 * US209 Exchange Adapter Layer — Nest module.
 * Infrastructure boundary between Trading Platform and external exchanges.
 * No trading business logic; does not mutate Portfolio / Position / Order / Risk.
 */
@Module({
  imports: [PrismaModule, WorkspaceModule],
  controllers: [ExchangeAdapterController],
  providers: [
    {
      provide: EXCHANGE_ADAPTER_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaExchangeAdapterRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaExchangeConnectivityStateRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: BYBIT_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaBybitExchangeConnectivityStateRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: OKX_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaOkxExchangeConnectivityStateRepository(prisma),
      inject: [PrismaService],
    },
    ExchangeConnectivityPersistenceService,
    BybitExchangeConnectivityPersistenceService,
    OkxExchangeConnectivityPersistenceService,
    OkxExchangeConnectivityRecoveryStore,
    OkxExchangeConnectivityRestartRecoveryService,
    BybitExchangeConnectivityRecoveryStore,
    BybitExchangeConnectivityRestartRecoveryService,
    ExchangeConnectivityRecoveryStore,
    ExchangeConnectivityRestartRecoveryService,
    ExchangeRegistry,
    ExchangeFactory,
    ExchangeRouter,
    ExchangeEventPublisher,
    ExchangeManager,
    ExchangeAdapterService,
  ],
  exports: [
    ExchangeAdapterService,
    ExchangeManager,
    ExchangeRegistry,
    ExchangeFactory,
    ExchangeRouter,
    EXCHANGE_ADAPTER_REPOSITORY,
    EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
    BYBIT_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
    OKX_EXCHANGE_CONNECTIVITY_STATE_REPOSITORY,
    ExchangeConnectivityPersistenceService,
    BybitExchangeConnectivityPersistenceService,
    OkxExchangeConnectivityPersistenceService,
    OkxExchangeConnectivityRecoveryStore,
    OkxExchangeConnectivityRestartRecoveryService,
    BybitExchangeConnectivityRecoveryStore,
    BybitExchangeConnectivityRestartRecoveryService,
    ExchangeConnectivityRecoveryStore,
    ExchangeConnectivityRestartRecoveryService,
  ],
})
export class ExchangeAdapterModule {}

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
  ],
})
export class ExchangeAdapterModule {}

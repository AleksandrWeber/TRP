import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { EventProcessingModule } from '../event-processing';
import { ExecutionAdapterModule } from '../execution-adapter';
import { M2_PAPER_FILL_CONFIGURATION } from '../execution-adapter/paper-fill-configuration';
import { OrdersModule } from '../orders';
import { TradingSessionModule } from '../trading-session';
import { ExecutionEngineService } from './execution-engine.service';
import { PAPER_FILL_CONFIGURATION } from './execution-engine.tokens';
import { FILL_REPOSITORY } from './persistence/fill.repository';
import { PrismaFillRepository } from './persistence/prisma-fill.repository';

@Module({
  imports: [EventProcessingModule, ExecutionAdapterModule, OrdersModule, TradingSessionModule],
  providers: [
    {
      provide: FILL_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaFillRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PAPER_FILL_CONFIGURATION,
      useValue: M2_PAPER_FILL_CONFIGURATION,
    },
    ExecutionEngineService,
  ],
  exports: [ExecutionEngineService],
})
export class ExecutionEngineModule {}

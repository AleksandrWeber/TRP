import { Module } from '@nestjs/common';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { PortfolioEngineModule } from '../portfolio-engine';
import { WorkspaceModule } from '../workspace';
import { PositionController } from './position.controller';
import { PositionEventPublisher } from './position-event-publisher';
import { PositionHistoryService } from './position-history.service';
import { POSITION_REPOSITORY } from './position.repository';
import { PositionService } from './position.service';
import { PrismaPositionRepository } from './prisma-position.repository';

/**
 * US205 Position Engine — Nest module.
 * Position lifecycle for trading accounts. No exchange / execution / paper trading.
 */
@Module({
  imports: [PrismaModule, WorkspaceModule, PortfolioEngineModule],
  controllers: [PositionController],
  providers: [
    {
      provide: POSITION_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPositionRepository(prisma),
      inject: [PrismaService],
    },
    PositionEventPublisher,
    PositionHistoryService,
    PositionService,
  ],
  exports: [PositionService, PositionHistoryService, POSITION_REPOSITORY],
})
export class PositionEngineModule {}

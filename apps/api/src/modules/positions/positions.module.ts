import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { EventProcessingModule } from '../event-processing';
import { M2_PAPER_FILL_CONFIGURATION } from '../execution-adapter';
import { LedgerModule } from '../ledger';
import { PaperAccountModule } from '../paper-account';
import { PositionAccountingConsumer } from './position-accounting.consumer';
import { PositionAccountingOutboxConsumer } from './position-accounting-outbox.consumer';
import { POSITION_REPOSITORY } from './persistence/position.repository';
import { PrismaPositionRepository } from './persistence/prisma-position.repository';
import { POSITION_FILL_CONFIGURATION } from './positions.tokens';

@Module({
  imports: [EventProcessingModule, LedgerModule, PaperAccountModule],
  providers: [
    {
      provide: POSITION_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPositionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: POSITION_FILL_CONFIGURATION,
      useValue: M2_PAPER_FILL_CONFIGURATION,
    },
    PositionAccountingConsumer,
    PositionAccountingOutboxConsumer,
  ],
  exports: [PositionAccountingConsumer],
})
export class PositionsModule {}

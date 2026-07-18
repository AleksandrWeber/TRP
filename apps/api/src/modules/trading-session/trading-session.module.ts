import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { EventProcessingModule } from '../event-processing';
import { PaperAccountModule } from '../paper-account';
import { TRADING_SESSION_REPOSITORY } from './persistence/trading-session.repository';
import { PrismaTradingSessionRepository } from './persistence/prisma-trading-session.repository';
import { TradingSessionService } from './trading-session.service';

@Module({
  imports: [EventProcessingModule, PaperAccountModule],
  providers: [
    {
      provide: TRADING_SESSION_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaTradingSessionRepository(prisma),
      inject: [PrismaService],
    },
    TradingSessionService,
  ],
  exports: [TRADING_SESSION_REPOSITORY, TradingSessionService],
})
export class TradingSessionModule {}

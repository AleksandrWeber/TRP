import { Module } from '@nestjs/common';
import { EventProcessingModule } from '../event-processing';
import { PrismaModule } from '../../storage/prisma/prisma.module';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { PaperAccountModule } from '../paper-account';
import { PrismaCashReservationAdapter } from './adapters/prisma-cash-reservation.adapter';
import { CASH_RESERVATION_PORT } from './ports/cash-reservation.port';
import { LedgerService } from './ledger.service';
import { LEDGER_REPOSITORY } from './persistence/ledger.repository';
import { PrismaLedgerRepository } from './persistence/prisma-ledger.repository';

@Module({
  imports: [PrismaModule, EventProcessingModule, PaperAccountModule],
  providers: [
    {
      provide: LEDGER_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaLedgerRepository(prisma),
      inject: [PrismaService],
    },
    LedgerService,
    PrismaCashReservationAdapter,
    {
      provide: CASH_RESERVATION_PORT,
      useExisting: PrismaCashReservationAdapter,
    },
  ],
  exports: [CASH_RESERVATION_PORT, LedgerService],
})
export class LedgerModule {}

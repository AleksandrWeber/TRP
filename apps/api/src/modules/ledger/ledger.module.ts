import { Module } from '@nestjs/common';
import { EventProcessingModule } from '../event-processing';
import { PrismaModule } from '../../storage/prisma/prisma.module';
import { PrismaCashReservationAdapter } from './adapters/prisma-cash-reservation.adapter';
import { CASH_RESERVATION_PORT } from './ports/cash-reservation.port';

@Module({
  imports: [PrismaModule, EventProcessingModule],
  providers: [
    PrismaCashReservationAdapter,
    {
      provide: CASH_RESERVATION_PORT,
      useExisting: PrismaCashReservationAdapter,
    },
  ],
  exports: [CASH_RESERVATION_PORT],
})
export class LedgerModule {}

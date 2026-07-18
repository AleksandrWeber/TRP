import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { EventProcessingModule } from '../event-processing';
import { PaperAccountModule } from '../paper-account';
import { TradingSessionModule } from '../trading-session';
import { OrderService } from './order.service';
import { ORDER_REPOSITORY } from './persistence/order.repository';
import { PrismaOrderRepository } from './persistence/prisma-order.repository';

@Module({
  imports: [EventProcessingModule, PaperAccountModule, TradingSessionModule],
  providers: [
    {
      provide: ORDER_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaOrderRepository(prisma),
      inject: [PrismaService],
    },
    OrderService,
  ],
  // Repository is deliberately private: Orders is the sole lifecycle owner.
  exports: [OrderService],
})
export class OrdersModule {}

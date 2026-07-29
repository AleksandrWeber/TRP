import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { EventProcessingModule } from '../event-processing';
import { PaperAccountModule } from '../paper-account';
import { TradingSessionModule } from '../trading-session';
import { LedgerModule } from '../ledger';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceModule } from '../workspace';
import { OrderService } from './order.service';
import { OrdersController } from './orders.controller';
import { ORDER_REPOSITORY } from './persistence/order.repository';
import { PrismaOrderRepository } from './persistence/prisma-order.repository';
import { ORDER_PROPOSAL_PORT } from './ports/order-proposal.port';

@Module({
  imports: [
    EventProcessingModule,
    PaperAccountModule,
    TradingSessionModule,
    LedgerModule,
    AuthModule,
    WorkspaceModule,
  ],
  controllers: [OrdersController],
  providers: [
    {
      provide: ORDER_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaOrderRepository(prisma),
      inject: [PrismaService],
    },
    OrderService,
    {
      provide: ORDER_PROPOSAL_PORT,
      useExisting: OrderService,
    },
  ],
  // Repository is deliberately private: Orders is the sole lifecycle owner.
  // ORDER_PROPOSAL_PORT is the internal Signal Intent intake surface (US221).
  exports: [OrderService, ORDER_PROPOSAL_PORT],
})
export class OrdersModule {}

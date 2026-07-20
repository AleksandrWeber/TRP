import { Module } from '@nestjs/common';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { PortfolioEngineModule } from '../portfolio-engine';
import { PositionEngineModule } from '../position-engine';
import { RiskEngineModule } from '../risk-engine';
import { WorkspaceModule } from '../workspace';
import { OrderController } from './order.controller';
import { OrderEventPublisher } from './order-event-publisher';
import { OrderExecutionService } from './order-execution.service';
import { OrderFillService } from './order-fill.service';
import { OrderHistoryService } from './order-history.service';
import { ORDER_REPOSITORY } from './order.repository';
import { OrderService } from './order.service';
import { PrismaOrderRepository } from './prisma-order.repository';

/**
 * US206 Order Lifecycle Engine — Nest module.
 * Central orchestration for trading order lifecycle.
 * Risk Engine (US207) gates submit before execution.
 * No exchange / live trading / paper orchestration.
 */
@Module({
  imports: [
    PrismaModule,
    WorkspaceModule,
    PortfolioEngineModule,
    PositionEngineModule,
    RiskEngineModule,
  ],
  controllers: [OrderController],
  providers: [
    {
      provide: ORDER_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaOrderRepository(prisma),
      inject: [PrismaService],
    },
    OrderEventPublisher,
    OrderHistoryService,
    OrderFillService,
    OrderExecutionService,
    OrderService,
  ],
  exports: [OrderService, OrderExecutionService, OrderHistoryService, ORDER_REPOSITORY],
})
export class OrderEngineModule {}

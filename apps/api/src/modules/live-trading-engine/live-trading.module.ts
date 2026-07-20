import { Module } from '@nestjs/common';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { ExchangeAdapterModule } from '../exchange-adapter';
import { OrderEngineModule } from '../order-engine';
import { PortfolioEngineModule } from '../portfolio-engine';
import { PositionEngineModule } from '../position-engine';
import { RiskEngineModule } from '../risk-engine';
import { WorkspaceModule } from '../workspace';
import { ConnectionSupervisor } from './connection-supervisor';
import { HealthMonitor } from './health-monitor';
import { LiveEventPublisher } from './live-event-publisher';
import { LiveExecutionCoordinator } from './live-execution-coordinator';
import { LiveSessionManager } from './live-session-manager';
import { LiveTradingController } from './live-trading.controller';
import { LIVE_TRADING_REPOSITORY } from './live-trading.repository';
import { LiveTradingService } from './live-trading.service';
import { PrismaLiveTradingRepository } from './prisma-live-trading.repository';
import { RecoveryManager } from './recovery-manager';
import { EmergencyManager } from './emergency-manager';
import { SynchronizationManager } from './synchronization-manager';

/**
 * US210 Live Trading Workspace — Nest module.
 * Orchestrates Trading Core + Exchange Adapter for live sessions.
 * No duplicated portfolio / position / risk / exchange business logic.
 */
@Module({
  imports: [
    PrismaModule,
    WorkspaceModule,
    PortfolioEngineModule,
    PositionEngineModule,
    OrderEngineModule,
    RiskEngineModule,
    ExchangeAdapterModule,
  ],
  controllers: [LiveTradingController],
  providers: [
    {
      provide: LIVE_TRADING_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaLiveTradingRepository(prisma),
      inject: [PrismaService],
    },
    LiveEventPublisher,
    LiveSessionManager,
    ConnectionSupervisor,
    SynchronizationManager,
    RecoveryManager,
    EmergencyManager,
    HealthMonitor,
    LiveExecutionCoordinator,
    LiveTradingService,
  ],
  exports: [
    LiveTradingService,
    LiveSessionManager,
    ConnectionSupervisor,
    SynchronizationManager,
    RecoveryManager,
    EmergencyManager,
    HealthMonitor,
    LiveExecutionCoordinator,
    LIVE_TRADING_REPOSITORY,
  ],
})
export class LiveTradingEngineModule {}

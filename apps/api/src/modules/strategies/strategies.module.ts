import { Module } from '@nestjs/common';
import type { Metrics } from '../../metrics/metrics';
import { METRICS } from '../../metrics/metrics.token';
import { instrumentRepository } from '../../metrics/instrument-repository';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { WorkspaceModule } from '../workspace';
import { PrismaStrategyRepository } from './repositories/prisma-strategy.repository';
import { STRATEGY_REPOSITORY } from './repositories/strategy.repository.token';
import { StrategiesController } from './strategies.controller';
import { StrategyDomainService } from './strategy-domain.service';

/**
 * Strategy Domain Nest module (US004).
 * Workspace-owned Strategy CRUD — no trading logic, market integration,
 * or signal generation. Persistence via Prisma `strategy_records`.
 */
@Module({
  imports: [PrismaModule, WorkspaceModule],
  controllers: [StrategiesController],
  providers: [
    {
      provide: STRATEGY_REPOSITORY,
      useFactory: (prisma: PrismaService, metrics: Metrics) =>
        instrumentRepository(new PrismaStrategyRepository(prisma), metrics, 'strategy'),
      inject: [PrismaService, METRICS],
    },
    StrategyDomainService,
  ],
  exports: [StrategyDomainService],
})
export class StrategiesModule {}

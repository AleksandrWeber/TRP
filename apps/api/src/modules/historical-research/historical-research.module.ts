import { Module } from '@nestjs/common';
import { PrismaModule } from '../../storage/prisma/prisma.module';
import { DatasetsModule } from '../datasets/datasets.module';
import { SignalEngineModule } from '../signal-engine';
import { StrategiesModule } from '../strategies';
import { StrategyEvaluatorsModule } from '../strategy-evaluators';
import { WorkspaceModule } from '../workspace';
import { HistoricalReplayEngine } from './historical-replay.engine';
import { HistoricalResearchController } from './historical-research.controller';
import { HistoricalResearchService } from './historical-research.service';

@Module({
  imports: [
    PrismaModule,
    WorkspaceModule,
    DatasetsModule,
    StrategiesModule,
    SignalEngineModule,
    StrategyEvaluatorsModule,
  ],
  controllers: [HistoricalResearchController],
  providers: [HistoricalReplayEngine, HistoricalResearchService],
  exports: [HistoricalReplayEngine, HistoricalResearchService],
})
export class HistoricalResearchModule {}

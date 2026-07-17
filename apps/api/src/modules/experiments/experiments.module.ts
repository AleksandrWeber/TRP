import { Module } from '@nestjs/common';
import { DatasetsModule } from '../datasets/datasets.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ExperimentComparisonService } from './experiment-comparison.service';
import { ExperimentDomainService } from './experiment-domain.service';
import { ExperimentsController } from './experiments.controller';
import { ExperimentsService } from './experiments.service';

@Module({
  imports: [DatasetsModule, KnowledgeModule],
  controllers: [ExperimentsController],
  providers: [ExperimentsService, ExperimentDomainService, ExperimentComparisonService],
  exports: [ExperimentsService, ExperimentDomainService, ExperimentComparisonService],
})
export class ExperimentsModule {}

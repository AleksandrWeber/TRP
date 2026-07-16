import { Module } from '@nestjs/common';
import { ExperimentsController } from './experiments.controller';
import { ExperimentsService } from './experiments.service';
import { DatasetsModule } from '../datasets/datasets.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [DatasetsModule, KnowledgeModule],
  controllers: [ExperimentsController],
  providers: [ExperimentsService],
  exports: [ExperimentsService],
})
export class ExperimentsModule {}

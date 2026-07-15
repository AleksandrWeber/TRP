import { Module } from '@nestjs/common';
import { ExperimentsModule } from '../experiments/experiments.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [ExperimentsModule, KnowledgeModule],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}

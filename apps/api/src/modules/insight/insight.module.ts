import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { PipelineModule } from '../pipeline/pipeline.module';
import { PipelineRegistry } from '../pipeline/pipeline-registry';
import { registerInsightPipelineSteps } from '../pipeline/steps/insight/register-insight-steps';
import { InsightController } from './insight.controller';
import { InsightDomainService } from './insight-domain.service';

/**
 * Insight Nest module (US095–US096, US100).
 * Domain CRUD + Insight Pipeline registration / orchestration via PipelineExecutor.
 * Read-only REST via InsightController.
 * No Prisma / Repository / Jobs / Export / Import.
 */
@Module({
  imports: [PipelineModule],
  controllers: [InsightController],
  providers: [InsightDomainService],
  exports: [InsightDomainService],
})
export class InsightModule implements OnModuleInit {
  constructor(
    @Inject(PipelineRegistry)
    private readonly registry: PipelineRegistry,
    @Inject(InsightDomainService)
    private readonly insights: InsightDomainService,
  ) {}

  onModuleInit(): void {
    if (this.registry.get('insights.prepare')) return;

    registerInsightPipelineSteps(this.registry, {
      insights: this.insights,
    });
  }
}

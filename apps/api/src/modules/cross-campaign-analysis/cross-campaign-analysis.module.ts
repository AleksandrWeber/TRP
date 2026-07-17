import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { InsightModule } from '../insight/insight.module';
import { InsightDomainService } from '../insight/insight-domain.service';
import { PipelineModule } from '../pipeline/pipeline.module';
import { PipelineRegistry } from '../pipeline/pipeline-registry';
import { registerCrossAnalysisPipelineSteps } from '../pipeline/steps/cross-analysis/register-cross-analysis-steps';
import { WorkspaceModule } from '../workspace';
import { CrossCampaignAnalysisController } from './cross-campaign-analysis.controller';
import { CrossCampaignAnalysisService } from './cross-campaign-analysis.service';

/**
 * Cross-Campaign Analysis Nest module (US097, US100).
 * Orchestrates via PipelineExecutor; writes Insights through InsightDomainService.
 * Read-only REST via CrossCampaignAnalysisController.
 */
@Module({
  imports: [PipelineModule, InsightModule, WorkspaceModule],
  controllers: [CrossCampaignAnalysisController],
  providers: [CrossCampaignAnalysisService],
  exports: [CrossCampaignAnalysisService],
})
export class CrossCampaignAnalysisModule implements OnModuleInit {
  constructor(
    @Inject(PipelineRegistry)
    private readonly registry: PipelineRegistry,
    @Inject(InsightDomainService)
    private readonly insights: InsightDomainService,
  ) {}

  onModuleInit(): void {
    if (this.registry.get('cross-analysis.prepare')) return;

    registerCrossAnalysisPipelineSteps(this.registry, {
      insights: this.insights,
    });
  }
}

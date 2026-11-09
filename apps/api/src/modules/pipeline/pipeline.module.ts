import { Module } from '@nestjs/common';
import { PipelineDomainService } from './pipeline-domain.service';
import { PipelineExecutor } from './pipeline-executor';
import { PipelineHookRegistry, pipelineHookRegistry } from './pipeline-hook-registry';
import { PipelineRegistry, pipelineRegistry } from './pipeline-registry';
import { PipelineTemplateService } from './pipeline-template.service';

/**
 * Generic Research Pipeline Nest module (US081–US097).
 * Domain + step registry + executor + hooks + templates.
 * Campaign / Replay / Knowledge / Insight / Cross-Campaign Analysis orchestrators execute via PipelineExecutor.
 * Knowledge imports this module one way. Campaign step registration lives in
 * PipelineStepRegistrationModule so this module does not import Experiments (TD-009).
 */
@Module({
  providers: [
    PipelineDomainService,
    PipelineTemplateService,
    {
      provide: PipelineRegistry,
      useValue: pipelineRegistry,
    },
    {
      provide: PipelineHookRegistry,
      useValue: pipelineHookRegistry,
    },
    PipelineExecutor,
  ],
  exports: [
    PipelineDomainService,
    PipelineTemplateService,
    PipelineRegistry,
    PipelineHookRegistry,
    PipelineExecutor,
  ],
})
export class PipelineModule {}

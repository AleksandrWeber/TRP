import { Module } from '@nestjs/common';
import { PipelineDomainService } from './pipeline-domain.service';
import { PipelineExecutor } from './pipeline-executor';
import { PipelineHookRegistry, pipelineHookRegistry } from './pipeline-hook-registry';
import { PipelineRegistry, pipelineRegistry } from './pipeline-registry';
import { PipelineTemplateService } from './pipeline-template.service';

/**
 * Generic Research Pipeline Nest module (US081–US085).
 * Domain + step registry + executor + hooks + templates — no HTTP yet.
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

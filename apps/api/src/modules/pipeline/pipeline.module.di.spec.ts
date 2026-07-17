import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { PipelineDomainService } from './pipeline-domain.service';
import { PipelineModule } from './pipeline.module';
import { PipelineTemplateService } from './pipeline-template.service';
import { PipelineExecutor } from './pipeline-executor';

describe('PipelineModule DI', () => {
  it('resolves template service and executor', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PipelineModule],
    }).compile();

    expect(moduleRef.get(PipelineDomainService)).toBeInstanceOf(PipelineDomainService);
    expect(moduleRef.get(PipelineTemplateService)).toBeInstanceOf(PipelineTemplateService);
    expect(moduleRef.get(PipelineExecutor)).toBeInstanceOf(PipelineExecutor);
  });
});

import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { LoggingModule } from '../../logging/logging.module';
import { MetricsModule } from '../../metrics/metrics.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../../storage/prisma/prisma.module';
import { PipelineDomainService } from './pipeline-domain.service';
import { PipelineModule } from './pipeline.module';
import { PipelineTemplateService } from './pipeline-template.service';
import { PipelineExecutor } from './pipeline-executor';

describe('PipelineModule DI', () => {
  it('resolves template service and executor', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggingModule, MetricsModule, PrismaModule, EventsModule, PipelineModule],
    }).compile();

    expect(moduleRef.get(PipelineDomainService)).toBeInstanceOf(PipelineDomainService);
    expect(moduleRef.get(PipelineTemplateService)).toBeInstanceOf(PipelineTemplateService);
    expect(moduleRef.get(PipelineExecutor)).toBeInstanceOf(PipelineExecutor);
  });
});

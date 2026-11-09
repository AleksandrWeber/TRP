import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { NoOpLogger } from '../../logging/noop.logger';
import { LoggingModule } from '../../logging/logging.module';
import { MetricsModule } from '../../metrics/metrics.module';
import { EventsModule } from '../events/events.module';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { CampaignSessionFactory } from '../campaign-session/campaign-session.factory';
import { ExperimentsModule } from '../experiments/experiments.module';
import type { ExperimentsService } from '../experiments/experiments.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { CampaignReportService } from '../research-campaign/campaign-report.service';
import type { CampaignPersistenceService } from '../campaign-persistence/campaign-persistence.service';
import { PipelineDomainService } from './pipeline-domain.service';
import { PipelineModule } from './pipeline.module';
import { PipelineRegistry } from './pipeline-registry';
import { PipelineTemplateService } from './pipeline-template.service';
import { PipelineExecutor } from './pipeline-executor';
import { registerPipelineCampaignSteps } from './pipeline-step-registration';
import { PipelineStepRegistrationModule } from './pipeline-step-registration.module';

const pipelineGraphImports = [
  LoggingModule,
  MetricsModule,
  PrismaModule,
  EventsModule,
  KnowledgeModule,
  PipelineModule,
  ExperimentsModule,
  PipelineStepRegistrationModule,
];

function disconnectedPrisma(): PrismaService {
  const client = new Proxy(function prismaCall() {}, {
    get(_target, prop) {
      if (prop === '$connect' || prop === '$disconnect') {
        return async () => undefined;
      }
      if (prop === 'then') return undefined;
      return client;
    },
    apply() {
      return Promise.resolve([]);
    },
  });
  return client as unknown as PrismaService;
}

function compilePipelineGraph() {
  return Test.createTestingModule({
    imports: pipelineGraphImports,
  })
    .overrideProvider(PrismaService)
    .useValue(disconnectedPrisma())
    .compile();
}

describe('PipelineModule DI', () => {
  it('resolves template service and executor', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggingModule, MetricsModule, PrismaModule, EventsModule, PipelineModule],
    }).compile();

    expect(moduleRef.get(PipelineDomainService)).toBeInstanceOf(PipelineDomainService);
    expect(moduleRef.get(PipelineTemplateService)).toBeInstanceOf(PipelineTemplateService);
    expect(moduleRef.get(PipelineExecutor)).toBeInstanceOf(PipelineExecutor);
    await moduleRef.close();
  });

  it('compiles Knowledge, Pipeline, and Experiments without a module cycle', async () => {
    const moduleRef = await compilePipelineGraph();
    await moduleRef.init();

    const registry = moduleRef.get(PipelineRegistry);
    const stepIds = registry.list().map((step) => step.getMetadata().stepId);
    expect(stepIds).toContain('knowledge.prepare');
    expect(stepIds).toContain('campaign.prepare');
    await moduleRef.close();

    const again = await compilePipelineGraph();
    await again.init();
    const secondIds = again
      .get(PipelineRegistry)
      .list()
      .map((step) => step.getMetadata().stepId);
    expect(secondIds).toEqual(stepIds);
    await again.close();
  });

  it('registers campaign steps once when campaign.prepare is already present', () => {
    const registry = new PipelineRegistry();
    const deps = {
      registry,
      experiments: {} as ExperimentsService,
      reports: new CampaignReportService(),
      sessionFactory: new CampaignSessionFactory(),
      persistence: {} as CampaignPersistenceService,
      logger: new NoOpLogger(),
    };

    registerPipelineCampaignSteps(deps);
    const registered = registry.list().map((step) => step.getMetadata().stepId);
    registerPipelineCampaignSteps(deps);

    expect(registered).toEqual([
      'campaign.prepare',
      'campaign.execute',
      'campaign.aggregate',
      'campaign.build-report',
      'campaign.persist',
    ]);
    expect(registry.list().map((step) => step.getMetadata().stepId)).toEqual(registered);
  });
});

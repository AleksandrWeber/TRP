import { beforeEach, describe, expect, it } from 'vitest';
import { BUILTIN_PIPELINE_TEMPLATE_IDS } from './builtin-pipeline-templates';
import { PipelineDomainService } from './pipeline-domain.service';
import { PipelineTemplateService } from './pipeline-template.service';

describe('PipelineTemplateService (US085)', () => {
  let pipelines: PipelineDomainService;
  let templates: PipelineTemplateService;

  beforeEach(() => {
    pipelines = new PipelineDomainService();
    templates = new PipelineTemplateService(pipelines);
  });

  it('creates a template', () => {
    const pipeline = pipelines.createPipeline({
      name: 'custom-blueprint',
      steps: [{ stepId: 's1', name: 'Step 1', description: 'one', order: 1 }],
      metadata: { author: 'tester' },
    });

    const template = templates.createTemplate({
      templateId: 'custom-template',
      name: 'Custom Template',
      description: 'A custom workflow',
      version: '2.0.0',
      pipelineId: pipeline.pipelineId,
      defaultMetadata: { author: 'tpl', version: 'tpl-meta' },
    });

    expect(template).toEqual({
      templateId: 'custom-template',
      name: 'Custom Template',
      description: 'A custom workflow',
      version: '2.0.0',
      pipelineId: pipeline.pipelineId,
      defaultMetadata: { author: 'tpl', version: 'tpl-meta' },
    });
  });

  it('lists templates', () => {
    const ids = templates
      .listTemplates()
      .map((t) => t.templateId)
      .sort();
    expect(ids).toEqual(
      [
        BUILTIN_PIPELINE_TEMPLATE_IDS.campaign,
        BUILTIN_PIPELINE_TEMPLATE_IDS.knowledge,
        BUILTIN_PIPELINE_TEMPLATE_IDS.replay,
      ].sort(),
    );
  });

  it('gets a template', () => {
    const campaign = templates.getTemplate(BUILTIN_PIPELINE_TEMPLATE_IDS.campaign);
    expect(campaign).not.toBeNull();
    expect(campaign!.name).toBe('Campaign Pipeline');
    expect(templates.getTemplate('missing')).toBeNull();
  });

  it('instantiates a pipeline from a template', () => {
    const template = templates.getTemplate(BUILTIN_PIPELINE_TEMPLATE_IDS.campaign)!;
    const pipeline = templates.createPipelineFromTemplate(BUILTIN_PIPELINE_TEMPLATE_IDS.campaign);

    expect(pipeline).not.toBeNull();
    expect(pipeline!.pipelineId).not.toBe(template.pipelineId);
    expect(pipeline!.name).toBe('Campaign Pipeline');
    expect(pipeline!.steps).toEqual([
      {
        stepId: 'campaign.prepare',
        name: 'Prepare Campaign',
        description: 'Initialize campaign id, timestamps, and slice identity',
        order: 1,
      },
      {
        stepId: 'campaign.execute',
        name: 'Execute Research',
        description: 'Run experiments for each parameter set',
        order: 2,
      },
      {
        stepId: 'campaign.aggregate',
        name: 'Aggregate Results',
        description: 'Build campaign summary from experiment outcomes',
        order: 3,
      },
      {
        stepId: 'campaign.build-report',
        name: 'Build Report',
        description: 'Build campaign report from summary and experiments',
        order: 4,
      },
      {
        stepId: 'campaign.persist',
        name: 'Persist Session',
        description: 'Persist campaign session when enabled',
        order: 5,
      },
    ]);
    expect(pipelines.getPipeline(pipeline!.pipelineId)).toBe(pipeline);
  });

  it('creates an independent pipeline copy', () => {
    const template = templates.getTemplate(BUILTIN_PIPELINE_TEMPLATE_IDS.replay)!;
    const blueprint = pipelines.getPipeline(template.pipelineId)!;
    const originalSteps = blueprint.steps.map((s) => ({ ...s }));

    const pipeline = templates.createPipelineFromTemplate(BUILTIN_PIPELINE_TEMPLATE_IDS.replay)!;

    pipeline.steps[0]!.name = 'MUTATED';
    pipeline.name = 'MUTATED PIPELINE';

    const blueprintAfter = pipelines.getPipeline(template.pipelineId)!;
    expect(blueprintAfter.steps).toEqual(originalSteps);
    expect(blueprintAfter.name).toBe('Replay Pipeline');

    const templateAfter = templates.getTemplate(BUILTIN_PIPELINE_TEMPLATE_IDS.replay)!;
    expect(templateAfter.name).toBe('Replay Pipeline');
    expect(templateAfter.pipelineId).toBe(template.pipelineId);
  });

  it('copies metadata from template defaults', () => {
    const pipeline = templates.createPipelineFromTemplate(BUILTIN_PIPELINE_TEMPLATE_IDS.knowledge)!;

    expect(pipeline.metadata.author).toBe('trp');
    expect(pipeline.metadata.version).toBe('knowledge-template');
    expect(pipeline.metadata.createdAt).toEqual(expect.any(String));
    expect(pipeline.metadata.updatedAt).toEqual(expect.any(String));
  });

  it('registers built-in templates', () => {
    for (const templateId of Object.values(BUILTIN_PIPELINE_TEMPLATE_IDS)) {
      const template = templates.getTemplate(templateId);
      expect(template).not.toBeNull();
      expect(template!.templateId).toBe(templateId);
      expect(pipelines.getPipeline(template!.pipelineId)).not.toBeNull();
      expect(pipelines.getPipeline(template!.pipelineId)!.steps.length).toBeGreaterThan(0);
    }
  });

  it('rejects duplicate template ids', () => {
    const pipeline = pipelines.createPipeline({ name: 'dup-source' });
    templates.createTemplate({
      templateId: 'dup',
      name: 'First',
      pipelineId: pipeline.pipelineId,
    });

    expect(() =>
      templates.createTemplate({
        templateId: 'dup',
        name: 'Second',
        pipelineId: pipeline.pipelineId,
      }),
    ).toThrow(/already registered: dup/);
  });

  it('returns null when instantiating an unknown template', () => {
    expect(templates.createPipelineFromTemplate('missing')).toBeNull();
  });

  it('rejects template creation for unknown pipeline', () => {
    expect(() =>
      templates.createTemplate({
        templateId: 'orphan',
        name: 'Orphan',
        pipelineId: 'missing-pipeline',
      }),
    ).toThrow(/Pipeline not found/);
  });
});

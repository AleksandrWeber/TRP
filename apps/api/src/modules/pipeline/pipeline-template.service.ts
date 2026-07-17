import { Inject, Injectable } from '@nestjs/common';
import { BUILTIN_PIPELINE_TEMPLATE_IDS } from './builtin-pipeline-templates';
import type { Pipeline } from './pipeline';
import { PipelineDomainService } from './pipeline-domain.service';
import type { PipelineMetadata } from './pipeline-metadata';
import type { PipelineStepMetadata } from './pipeline-step-metadata';
import type { PipelineTemplate, PipelineTemplateDefaultMetadata } from './pipeline-template';
import { CAMPAIGN_PIPELINE_STEPS } from './steps/campaign/campaign-step-metadata';
import { CROSS_ANALYSIS_PIPELINE_STEPS } from './steps/cross-analysis/cross-analysis-step-metadata';
import { INSIGHT_PIPELINE_STEPS } from './steps/insight/insight-step-metadata';
import { KNOWLEDGE_PIPELINE_STEPS } from './steps/knowledge/knowledge-step-metadata';
import { REPLAY_PIPELINE_STEPS } from './steps/replay/replay-step-metadata';

export type CreatePipelineTemplateInput = {
  templateId: string;
  name: string;
  description?: string;
  version?: string;
  pipelineId: string;
  defaultMetadata?: PipelineTemplateDefaultMetadata;
};

/**
 * In-memory Pipeline Template service (US085–US097).
 * create / get / list templates + instantiate independent Pipelines from templates.
 * Built-ins: Campaign / Replay / Knowledge / Insight / Cross-Campaign Analysis.
 */
@Injectable()
export class PipelineTemplateService {
  private readonly templates = new Map<string, PipelineTemplate>();

  constructor(
    @Inject(PipelineDomainService)
    private readonly pipelines: PipelineDomainService,
  ) {
    this.registerBuiltInTemplates();
  }

  createTemplate(input: CreatePipelineTemplateInput): PipelineTemplate {
    if (this.templates.has(input.templateId)) {
      throw new Error(`Pipeline template already registered: ${input.templateId}`);
    }

    const pipeline = this.pipelines.getPipeline(input.pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found for template: ${input.pipelineId}`);
    }

    const template: PipelineTemplate = {
      templateId: input.templateId,
      name: input.name,
      description: input.description ?? '',
      version: input.version ?? '1.0.0',
      pipelineId: input.pipelineId,
      defaultMetadata: cloneDefaultMetadata(input.defaultMetadata),
    };

    this.templates.set(template.templateId, template);
    return cloneTemplate(template);
  }

  getTemplate(templateId: string): PipelineTemplate | null {
    const template = this.templates.get(templateId);
    return template ? cloneTemplate(template) : null;
  }

  listTemplates(): PipelineTemplate[] {
    return Array.from(this.templates.values()).map(cloneTemplate);
  }

  /**
   * Instantiates a new independent Pipeline from a template.
   * Copies step metadata + applies template defaultMetadata. No execution.
   */
  createPipelineFromTemplate(templateId: string): Pipeline | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const source = this.pipelines.getPipeline(template.pipelineId);
    if (!source) return null;

    return this.pipelines.createPipeline({
      name: source.name,
      description: source.description,
      version: source.version,
      steps: cloneSteps(source.steps),
      metadata: {
        ...pickPipelineMetadata(source.metadata),
        ...cloneDefaultMetadata(template.defaultMetadata),
      },
    });
  }

  private registerBuiltInTemplates(): void {
    const campaign = this.pipelines.createPipeline({
      name: 'Campaign Pipeline',
      description:
        'Standard campaign research workflow (Campaign PipelineStep metadata; no executor wiring)',
      version: '1.0.0',
      steps: cloneSteps(CAMPAIGN_PIPELINE_STEPS),
      metadata: { author: 'trp', version: 'builtin' },
    });

    const replay = this.pipelines.createPipeline({
      name: 'Replay Pipeline',
      description:
        'Standard campaign replay workflow (Replay PipelineStep metadata; executor via CampaignReplayService)',
      version: '1.0.0',
      steps: cloneSteps(REPLAY_PIPELINE_STEPS),
      metadata: { author: 'trp', version: 'builtin' },
    });

    const knowledge = this.pipelines.createPipeline({
      name: 'Knowledge Pipeline',
      description:
        'Standard knowledge extraction workflow (Knowledge PipelineStep metadata; executor via KnowledgeDomainService)',
      version: '1.0.0',
      steps: cloneSteps(KNOWLEDGE_PIPELINE_STEPS),
      metadata: { author: 'trp', version: 'builtin' },
    });

    const insight = this.pipelines.createPipeline({
      name: 'Insight Pipeline',
      description:
        'Standard insight extraction workflow (Insight PipelineStep metadata; executor via InsightDomainService)',
      version: '1.0.0',
      steps: cloneSteps(INSIGHT_PIPELINE_STEPS),
      metadata: { author: 'trp', version: 'builtin' },
    });

    const crossCampaignAnalysis = this.pipelines.createPipeline({
      name: 'Cross-Campaign Analysis Pipeline',
      description:
        'Cross-campaign comparison workflow (Cross-Analysis PipelineStep metadata; executor via CrossCampaignAnalysisService)',
      version: '1.0.0',
      steps: cloneSteps(CROSS_ANALYSIS_PIPELINE_STEPS),
      metadata: { author: 'trp', version: 'builtin' },
    });

    this.createTemplate({
      templateId: BUILTIN_PIPELINE_TEMPLATE_IDS.campaign,
      name: 'Campaign Pipeline',
      description: 'Reusable campaign research pipeline template',
      version: '1.0.0',
      pipelineId: campaign.pipelineId,
      defaultMetadata: { author: 'trp', version: 'campaign-template' },
    });

    this.createTemplate({
      templateId: BUILTIN_PIPELINE_TEMPLATE_IDS.replay,
      name: 'Replay Pipeline',
      description: 'Reusable campaign replay pipeline template',
      version: '1.0.0',
      pipelineId: replay.pipelineId,
      defaultMetadata: { author: 'trp', version: 'replay-template' },
    });

    this.createTemplate({
      templateId: BUILTIN_PIPELINE_TEMPLATE_IDS.knowledge,
      name: 'Knowledge Pipeline',
      description: 'Reusable knowledge pipeline template',
      version: '1.0.0',
      pipelineId: knowledge.pipelineId,
      defaultMetadata: { author: 'trp', version: 'knowledge-template' },
    });

    this.createTemplate({
      templateId: BUILTIN_PIPELINE_TEMPLATE_IDS.insight,
      name: 'Insight Pipeline',
      description: 'Reusable insight extraction pipeline template',
      version: '1.0.0',
      pipelineId: insight.pipelineId,
      defaultMetadata: { author: 'trp', version: 'insight-template' },
    });

    this.createTemplate({
      templateId: BUILTIN_PIPELINE_TEMPLATE_IDS.crossCampaignAnalysis,
      name: 'Cross-Campaign Analysis Pipeline',
      description: 'Reusable cross-campaign analysis pipeline template',
      version: '1.0.0',
      pipelineId: crossCampaignAnalysis.pipelineId,
      defaultMetadata: { author: 'trp', version: 'cross-campaign-analysis-template' },
    });
  }
}

function cloneTemplate(template: PipelineTemplate): PipelineTemplate {
  return {
    templateId: template.templateId,
    name: template.name,
    description: template.description,
    version: template.version,
    pipelineId: template.pipelineId,
    defaultMetadata: cloneDefaultMetadata(template.defaultMetadata),
  };
}

function cloneDefaultMetadata(
  metadata?: PipelineTemplateDefaultMetadata,
): PipelineTemplateDefaultMetadata {
  if (!metadata) return {};
  return {
    ...(metadata.version !== undefined ? { version: metadata.version } : {}),
    ...(metadata.author !== undefined ? { author: metadata.author } : {}),
  };
}

function cloneSteps(steps: PipelineStepMetadata[]): PipelineStepMetadata[] {
  return steps.map((step) => ({
    stepId: step.stepId,
    name: step.name,
    description: step.description,
    order: step.order,
  }));
}

function pickPipelineMetadata(metadata: PipelineMetadata): PipelineTemplateDefaultMetadata {
  return {
    ...(metadata.version !== undefined ? { version: metadata.version } : {}),
    ...(metadata.author !== undefined ? { author: metadata.author } : {}),
  };
}

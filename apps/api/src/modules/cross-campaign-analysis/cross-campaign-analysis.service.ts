import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { Insight } from '../insight/insight';
import type { KnowledgeEntry } from '../knowledge/knowledge-entry';
import { BUILTIN_PIPELINE_TEMPLATE_IDS } from '../pipeline/builtin-pipeline-templates';
import type { PipelineContext } from '../pipeline/pipeline-context';
import { PipelineDomainService } from '../pipeline/pipeline-domain.service';
import { PipelineExecutor } from '../pipeline/pipeline-executor';
import { PipelineTemplateService } from '../pipeline/pipeline-template.service';
import { readCrossAnalysisResult } from '../pipeline/steps/cross-analysis/cross-analysis-pipeline-context';
import type {
  CrossCampaignAnalysisResult,
  CrossCampaignAnalysisResultPayload,
} from './cross-campaign-analysis-result';

export type CrossCampaignAnalysisInput = {
  sessions: CampaignSession[];
  knowledgeEntries?: KnowledgeEntry[];
  insights?: Insight[];
  experimentIds?: string[];
};

export type CrossCampaignAnalysisSearchFilters = {
  campaignSessionId?: string;
};

/**
 * Cross-campaign analysis orchestrator (US097) + in-memory result store (US100).
 * Reads Campaign / Knowledge / Insight inputs; writes Insights via pipeline persist step only.
 * Controllers are read-only: getById / search over stored analyze() results.
 */
@Injectable()
export class CrossCampaignAnalysisService {
  private readonly results = new Map<string, CrossCampaignAnalysisResult>();

  constructor(
    @Inject(PipelineExecutor)
    private readonly executor: PipelineExecutor,
    @Inject(PipelineTemplateService)
    private readonly templates: PipelineTemplateService,
    @Inject(PipelineDomainService)
    private readonly pipelines: PipelineDomainService,
  ) {}

  async analyze(input: CrossCampaignAnalysisInput): Promise<CrossCampaignAnalysisResult> {
    const pipeline = this.templates.createPipelineFromTemplate(
      BUILTIN_PIPELINE_TEMPLATE_IDS.crossCampaignAnalysis,
    );
    if (!pipeline) {
      throw new Error('Cross-campaign analysis pipeline template is not registered');
    }

    const run = this.pipelines.createRun({ pipelineId: pipeline.pipelineId });
    if (!run) {
      throw new Error(`Failed to create PipelineRun for ${pipeline.pipelineId}`);
    }

    const context: PipelineContext = {
      input: {
        sessions: input.sessions,
        knowledgeEntries: input.knowledgeEntries ?? [],
        insights: input.insights ?? [],
        ...(input.experimentIds !== undefined ? { experimentIds: input.experimentIds } : {}),
      },
      output: {},
      variables: {},
      metadata: {},
    };

    const pipelineResult = await this.executor.execute(pipeline, context, run);
    if (!pipelineResult.success) {
      throw new Error(pipelineResult.error ?? 'Cross-campaign analysis pipeline failed');
    }

    return this.store(readCrossAnalysisResult(pipelineResult.context));
  }

  /**
   * Store an analysis payload (US100). Used by analyze(); available for tests/seeding.
   */
  store(payload: CrossCampaignAnalysisResultPayload): CrossCampaignAnalysisResult {
    const result: CrossCampaignAnalysisResult = {
      ...payload,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.results.set(result.id, result);
    return result;
  }

  getById(id: string): CrossCampaignAnalysisResult | null {
    return this.results.get(id) ?? null;
  }

  search(filters: CrossCampaignAnalysisSearchFilters = {}): CrossCampaignAnalysisResult[] {
    let results = Array.from(this.results.values());

    if (hasValue(filters.campaignSessionId)) {
      const sessionId = filters.campaignSessionId!.trim();
      results = results.filter((item) => item.comparedCampaignIds.includes(sessionId));
    }

    return results;
  }
}

function hasValue(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== '';
}

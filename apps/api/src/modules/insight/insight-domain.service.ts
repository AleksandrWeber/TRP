import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { KnowledgeEntry } from '../knowledge/knowledge-entry';
import { BUILTIN_PIPELINE_TEMPLATE_IDS } from '../pipeline/builtin-pipeline-templates';
import type { PipelineContext } from '../pipeline/pipeline-context';
import { PipelineDomainService } from '../pipeline/pipeline-domain.service';
import { PipelineExecutor } from '../pipeline/pipeline-executor';
import { PipelineTemplateService } from '../pipeline/pipeline-template.service';
import { readPersistedInsights } from '../pipeline/steps/insight/insight-pipeline-context';
import type { Insight } from './insight';
import type { InsightMetadata } from './insight-metadata';
import type { InsightSource } from './insight-source';
import type { InsightType } from './insight-type';

export type CreateInsightInput = {
  campaignSessionId?: string;
  experimentId?: string;
  knowledgeEntryIds?: string[];
  type: InsightType;
  title: string;
  summary: string;
  confidence?: number;
  sources?: InsightSource[];
  metadata?: InsightMetadata;
  createdAt?: string;
};

export type UpdateInsightInput = {
  campaignSessionId?: string | null;
  experimentId?: string | null;
  knowledgeEntryIds?: string[];
  type?: InsightType;
  title?: string;
  summary?: string;
  confidence?: number;
  sources?: InsightSource[];
  metadata?: InsightMetadata;
};

export type InsightSearchFilters = {
  q?: string;
  type?: InsightType;
  source?: InsightSource;
  campaignSessionId?: string;
  experimentId?: string;
  knowledgeEntryId?: string;
};

export type ExtractInsightsInput = {
  campaignSessionId?: string;
  experimentIds?: string[];
  knowledgeEntries: KnowledgeEntry[];
  session?: CampaignSession;
};

/**
 * In-memory Insight domain service (US095–US096).
 * create / update / delete / getById / search remain direct store APIs.
 * extractFromKnowledge orchestrates via PipelineExecutor + Insight PipelineSteps.
 *
 * Insight references Knowledge via knowledgeEntryIds; it must not store KnowledgeEntry contents.
 */
@Injectable()
export class InsightDomainService {
  private readonly insights = new Map<string, Insight>();

  constructor(
    @Inject(PipelineExecutor)
    private readonly executor: PipelineExecutor,
    @Inject(PipelineTemplateService)
    private readonly templates: PipelineTemplateService,
    @Inject(PipelineDomainService)
    private readonly pipelines: PipelineDomainService,
  ) {}

  create(input: CreateInsightInput): Insight {
    const confidence = normalizeConfidence(input.confidence ?? 0);

    const insight: Insight = {
      id: randomUUID(),
      createdAt: input.createdAt ?? new Date().toISOString(),
      type: input.type,
      title: input.title,
      summary: input.summary,
      confidence,
      knowledgeEntryIds: cloneIds(input.knowledgeEntryIds),
      sources: cloneSources(input.sources),
      metadata: cloneMetadata(input.metadata),
    };

    if (input.campaignSessionId !== undefined) {
      insight.campaignSessionId = input.campaignSessionId;
    }
    if (input.experimentId !== undefined) {
      insight.experimentId = input.experimentId;
    }

    this.insights.set(insight.id, insight);
    return insight;
  }

  /**
   * Deterministic Insight extraction via Insight Pipeline (US096).
   * Prepare → Extract → Persist; InsightDomainService.create is the only write path.
   */
  async extractFromKnowledge(input: ExtractInsightsInput): Promise<Insight[]> {
    const pipeline = this.templates.createPipelineFromTemplate(
      BUILTIN_PIPELINE_TEMPLATE_IDS.insight,
    );
    if (!pipeline) {
      throw new Error('Insight pipeline template is not registered');
    }

    const run = this.pipelines.createRun({ pipelineId: pipeline.pipelineId });
    if (!run) {
      throw new Error(`Failed to create PipelineRun for ${pipeline.pipelineId}`);
    }

    const context: PipelineContext = {
      input: {
        knowledgeEntries: input.knowledgeEntries,
        ...(input.campaignSessionId !== undefined
          ? { campaignSessionId: input.campaignSessionId }
          : {}),
        ...(input.experimentIds !== undefined ? { experimentIds: input.experimentIds } : {}),
        ...(input.session !== undefined ? { session: input.session } : {}),
      },
      output: {},
      variables: {},
      metadata: {},
    };

    const pipelineResult = await this.executor.execute(pipeline, context, run);
    if (!pipelineResult.success) {
      throw new Error(pipelineResult.error ?? 'Insight pipeline failed');
    }

    return readPersistedInsights(pipelineResult.context);
  }

  update(id: string, input: UpdateInsightInput): Insight | null {
    const existing = this.insights.get(id);
    if (!existing) return null;

    if (input.title !== undefined) existing.title = input.title;
    if (input.summary !== undefined) existing.summary = input.summary;
    if (input.type !== undefined) existing.type = input.type;
    if (input.confidence !== undefined) {
      existing.confidence = normalizeConfidence(input.confidence);
    }
    if (input.knowledgeEntryIds !== undefined) {
      existing.knowledgeEntryIds = cloneIds(input.knowledgeEntryIds);
    }
    if (input.sources !== undefined) {
      existing.sources = cloneSources(input.sources);
    }
    if (input.metadata !== undefined) {
      existing.metadata = cloneMetadata(input.metadata);
    }

    if (input.campaignSessionId === null) {
      delete existing.campaignSessionId;
    } else if (input.campaignSessionId !== undefined) {
      existing.campaignSessionId = input.campaignSessionId;
    }

    if (input.experimentId === null) {
      delete existing.experimentId;
    } else if (input.experimentId !== undefined) {
      existing.experimentId = input.experimentId;
    }

    return existing;
  }

  delete(id: string): boolean {
    return this.insights.delete(id);
  }

  getById(id: string): Insight | null {
    return this.insights.get(id) ?? null;
  }

  /**
   * Combined filters with AND semantics.
   * Empty / omitted filters are ignored.
   */
  search(filters: InsightSearchFilters = {}): Insight[] {
    let results = Array.from(this.insights.values());

    if (filters.type !== undefined) {
      results = results.filter((insight) => insight.type === filters.type);
    }

    if (filters.source !== undefined) {
      const source = filters.source;
      results = results.filter((insight) => insight.sources.includes(source));
    }

    if (hasValue(filters.campaignSessionId)) {
      const sessionId = filters.campaignSessionId!.trim();
      results = results.filter((insight) => insight.campaignSessionId === sessionId);
    }

    if (hasValue(filters.experimentId)) {
      const experimentId = filters.experimentId!.trim();
      results = results.filter((insight) => insight.experimentId === experimentId);
    }

    if (hasValue(filters.knowledgeEntryId)) {
      const knowledgeId = filters.knowledgeEntryId!.trim();
      results = results.filter((insight) => insight.knowledgeEntryIds.includes(knowledgeId));
    }

    if (hasValue(filters.q)) {
      const needle = filters.q!.trim().toLowerCase();
      results = results.filter(
        (insight) =>
          insight.title.toLowerCase().includes(needle) ||
          insight.summary.toLowerCase().includes(needle),
      );
    }

    return results;
  }
}

function hasValue(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== '';
}

function normalizeConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function cloneIds(ids?: string[]): string[] {
  return ids ? [...ids] : [];
}

function cloneSources(sources?: InsightSource[]): InsightSource[] {
  return sources ? [...sources] : [];
}

function cloneMetadata(metadata?: InsightMetadata): InsightMetadata {
  if (!metadata) return {};

  const cloned: InsightMetadata = {};
  if (metadata.model !== undefined) cloned.model = metadata.model;
  if (metadata.promptVersion !== undefined) cloned.promptVersion = metadata.promptVersion;
  if (metadata.executionTime !== undefined) cloned.executionTime = metadata.executionTime;
  if (metadata.pipelineRunId !== undefined) cloned.pipelineRunId = metadata.pipelineRunId;
  return cloned;
}

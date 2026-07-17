import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Experiment } from '../experiments/experiment';
import { BUILTIN_PIPELINE_TEMPLATE_IDS } from '../pipeline/builtin-pipeline-templates';
import type { PipelineContext } from '../pipeline/pipeline-context';
import { PipelineDomainService } from '../pipeline/pipeline-domain.service';
import { PipelineExecutor } from '../pipeline/pipeline-executor';
import { PipelineTemplateService } from '../pipeline/pipeline-template.service';
import { readKnowledgeEntry } from '../pipeline/steps/knowledge/knowledge-pipeline-context';
import type { KnowledgeEntry } from './knowledge-entry';
import type { KnowledgeMetadata } from './knowledge-metadata';
import type { KnowledgeTag } from './knowledge-tag';

export type CreateKnowledgeEntryInput = {
  experimentId: string;
  title: string;
  summary: string;
  tags?: KnowledgeTag[];
  insights?: string[];
  metadata?: KnowledgeMetadata;
  /** Optional; defaults to now. Extraction may supply report.createdAt. */
  createdAt?: string;
};

export type UpdateKnowledgeEntryInput = {
  title?: string;
  summary?: string;
  tags?: KnowledgeTag[];
  insights?: string[];
  metadata?: KnowledgeMetadata;
};

/**
 * In-memory Knowledge domain service (US075–US079, US090).
 * create / update / get / list / search remain direct store APIs.
 * createFromExperiment orchestrates via PipelineExecutor + Knowledge PipelineSteps.
 *
 * Distinct from Prisma-backed {@link KnowledgeService} (`research_outcome` persistence).
 */
@Injectable()
export class KnowledgeDomainService {
  private readonly entries = new Map<string, KnowledgeEntry>();
  /** One KnowledgeEntry per Experiment (US077). */
  private readonly byExperimentId = new Map<string, string>();

  constructor(
    @Inject(PipelineExecutor)
    private readonly executor: PipelineExecutor,
    @Inject(PipelineTemplateService)
    private readonly templates: PipelineTemplateService,
    @Inject(PipelineDomainService)
    private readonly pipelines: PipelineDomainService,
  ) {}

  create(input: CreateKnowledgeEntryInput): KnowledgeEntry {
    const existingId = this.byExperimentId.get(input.experimentId);
    if (existingId) {
      const updated = this.update(existingId, {
        title: input.title,
        summary: input.summary,
        tags: input.tags,
        insights: input.insights,
        metadata: input.metadata,
      });
      if (!updated) {
        throw new Error(
          `Knowledge entry ${existingId} missing for experiment ${input.experimentId}`,
        );
      }
      return updated;
    }

    const entry: KnowledgeEntry = {
      knowledgeId: randomUUID(),
      experimentId: input.experimentId,
      createdAt: input.createdAt ?? new Date().toISOString(),
      title: input.title,
      summary: input.summary,
      tags: cloneTags(input.tags),
      insights: cloneInsights(input.insights),
      metadata: cloneMetadata(input.metadata),
    };

    this.entries.set(entry.knowledgeId, entry);
    this.byExperimentId.set(entry.experimentId, entry.knowledgeId);
    return entry;
  }

  /**
   * Extract Knowledge from Experiment.currentVersion.report and upsert
   * (one entry per experimentId — never duplicates) via Knowledge pipeline.
   */
  async createFromExperiment(experiment: Experiment): Promise<KnowledgeEntry> {
    const pipeline = this.templates.createPipelineFromTemplate(
      BUILTIN_PIPELINE_TEMPLATE_IDS.knowledge,
    );
    if (!pipeline) {
      throw new Error('Knowledge pipeline template is not registered');
    }

    const run = this.pipelines.createRun({ pipelineId: pipeline.pipelineId });
    if (!run) {
      throw new Error(`Failed to create PipelineRun for ${pipeline.pipelineId}`);
    }

    const context: PipelineContext = {
      input: { experiment },
      output: {},
      variables: {},
      metadata: {},
    };

    const pipelineResult = await this.executor.execute(pipeline, context, run);

    if (!pipelineResult.success) {
      throw new Error(pipelineResult.error ?? 'Knowledge pipeline failed');
    }

    return readKnowledgeEntry(pipelineResult.context);
  }

  update(knowledgeId: string, input: UpdateKnowledgeEntryInput): KnowledgeEntry | null {
    const existing = this.entries.get(knowledgeId);
    if (!existing) return null;

    if (input.title !== undefined) existing.title = input.title;
    if (input.summary !== undefined) existing.summary = input.summary;
    if (input.tags !== undefined) existing.tags = cloneTags(input.tags);
    if (input.insights !== undefined) existing.insights = cloneInsights(input.insights);
    if (input.metadata !== undefined) existing.metadata = cloneMetadata(input.metadata);

    return existing;
  }

  get(knowledgeId: string): KnowledgeEntry | null {
    return this.entries.get(knowledgeId) ?? null;
  }

  getByExperimentId(experimentId: string): KnowledgeEntry | null {
    const knowledgeId = this.byExperimentId.get(experimentId);
    if (!knowledgeId) return null;
    return this.entries.get(knowledgeId) ?? null;
  }

  list(): KnowledgeEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Case-insensitive text search over title, summary, insights, and tags (US079).
   */
  search(query: string): KnowledgeEntry[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return this.list();
    return this.list().filter((entry) => matchesText(entry, needle));
  }

  /** Case-insensitive exact tag match. */
  searchByTag(tag: string): KnowledgeEntry[] {
    const needle = tag.trim().toLowerCase();
    if (!needle) return this.list();
    return this.list().filter((entry) =>
      entry.tags.some((entryTag) => entryTag.toLowerCase() === needle),
    );
  }

  /** Exact experimentId lookup; empty array when missing (no 404). */
  searchByExperiment(experimentId: string): KnowledgeEntry[] {
    const entry = this.getByExperimentId(experimentId);
    return entry ? [entry] : [];
  }

  /**
   * Combined filters with AND semantics (US079).
   * Empty / omitted filters are ignored.
   */
  find(filters: KnowledgeSearchFilters = {}): KnowledgeEntry[] {
    let results = this.list();

    if (hasValue(filters.experimentId)) {
      results = results.filter((entry) => entry.experimentId === filters.experimentId!.trim());
    }

    if (hasValue(filters.tag)) {
      const tag = filters.tag!.trim().toLowerCase();
      results = results.filter((entry) =>
        entry.tags.some((entryTag) => entryTag.toLowerCase() === tag),
      );
    }

    if (hasValue(filters.q)) {
      const needle = filters.q!.trim().toLowerCase();
      results = results.filter((entry) => matchesText(entry, needle));
    }

    return results;
  }
}

export type KnowledgeSearchFilters = {
  q?: string;
  tag?: string;
  experimentId?: string;
};

function hasValue(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== '';
}

function matchesText(entry: KnowledgeEntry, needle: string): boolean {
  if (entry.title.toLowerCase().includes(needle)) return true;
  if (entry.summary.toLowerCase().includes(needle)) return true;
  if (entry.insights.some((insight) => insight.toLowerCase().includes(needle))) return true;
  if (entry.tags.some((tag) => tag.toLowerCase().includes(needle))) return true;
  return false;
}

function cloneTags(tags?: KnowledgeTag[]): KnowledgeTag[] {
  return tags ? [...tags] : [];
}

function cloneInsights(insights?: string[]): string[] {
  return insights ? [...insights] : [];
}

function cloneMetadata(metadata?: KnowledgeMetadata): KnowledgeMetadata {
  if (!metadata) return {};

  const cloned: KnowledgeMetadata = {};
  if (metadata.engineVersion !== undefined) cloned.engineVersion = metadata.engineVersion;
  if (metadata.datasetId !== undefined) cloned.datasetId = metadata.datasetId;
  if (metadata.strategyId !== undefined) cloned.strategyId = metadata.strategyId;
  if (metadata.source !== undefined) cloned.source = metadata.source;
  return cloned;
}

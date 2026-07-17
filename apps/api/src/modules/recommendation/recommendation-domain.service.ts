import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Insight } from '../insight/insight';
import { DEFAULT_WORKSPACE_ID } from '../pipeline/workspace-context';
import { draftRecommendationsFromInsights } from './recommendation-generation.rules';
import type { Recommendation } from './recommendation';
import type { RecommendationMetadata } from './recommendation-metadata';
import type { RecommendationPriority } from './recommendation-priority';
import type { RecommendationType } from './recommendation-type';
import type { RecommendationRepository } from './repositories/recommendation.repository';
import { RECOMMENDATION_REPOSITORY } from './repositories/recommendation.repository.token';

export type CreateRecommendationInput = {
  workspaceId: string;
  insightIds?: string[];
  campaignSessionIds?: string[];
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  metadata?: RecommendationMetadata;
  createdAt?: string;
};

export type UpdateRecommendationInput = {
  insightIds?: string[];
  campaignSessionIds?: string[];
  type?: RecommendationType;
  priority?: RecommendationPriority;
  title?: string;
  description?: string;
  rationale?: string;
  metadata?: RecommendationMetadata;
};

export type RecommendationSearchFilters = {
  q?: string;
  type?: RecommendationType;
  priority?: RecommendationPriority;
  insightId?: string;
  campaignSessionId?: string;
};

/**
 * Recommendation domain service (US098, US102).
 * create / update / delete / getById / search / generateFromInsights.
 * Storage is delegated to RecommendationRepository (no owned Map).
 *
 * Recommendation references Insights via insightIds; it must not duplicate Insight payload.
 * No PipelineExecutor / Jobs / REST / Export / Import / Prisma coupling.
 */
@Injectable()
export class RecommendationDomainService {
  constructor(
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly repository: RecommendationRepository,
  ) {}

  create(input: CreateRecommendationInput): Recommendation {
    const recommendation: Recommendation = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      createdAt: input.createdAt ?? new Date().toISOString(),
      insightIds: cloneIds(input.insightIds),
      campaignSessionIds: cloneIds(input.campaignSessionIds),
      type: input.type,
      priority: input.priority,
      title: input.title,
      description: input.description,
      rationale: input.rationale,
      metadata: cloneMetadata(input.metadata),
    };

    this.repository.save(recommendation);
    return recommendation;
  }

  /**
   * Deterministic Recommendation generation from Insights (US098).
   * RecommendationDomainService.create is the only write path.
   */
  generateFromInsights(insights: Insight[], workspaceId: string): Recommendation[] {
    const drafts = draftRecommendationsFromInsights(insights);
    return drafts.map((draft) => this.create({ ...draft, workspaceId }));
  }

  update(id: string, input: UpdateRecommendationInput, workspaceId: string): Recommendation | null {
    const existing = this.repository.findById(id, workspaceId);
    if (!existing) return null;

    if (input.insightIds !== undefined) {
      existing.insightIds = cloneIds(input.insightIds);
    }
    if (input.campaignSessionIds !== undefined) {
      existing.campaignSessionIds = cloneIds(input.campaignSessionIds);
    }
    if (input.type !== undefined) existing.type = input.type;
    if (input.priority !== undefined) existing.priority = input.priority;
    if (input.title !== undefined) existing.title = input.title;
    if (input.description !== undefined) existing.description = input.description;
    if (input.rationale !== undefined) existing.rationale = input.rationale;
    if (input.metadata !== undefined) {
      existing.metadata = cloneMetadata(input.metadata);
    }

    this.repository.save(existing);
    return existing;
  }

  delete(id: string, workspaceId: string): boolean {
    return this.repository.delete(id, workspaceId);
  }

  getById(id: string, workspaceId: string): Recommendation | null {
    return this.repository.findById(id, workspaceId);
  }

  /**
   * Combined filters with AND semantics.
   * Empty / omitted filters are ignored.
   */
  search(
    filters: RecommendationSearchFilters = {},
    workspaceId: string = DEFAULT_WORKSPACE_ID,
  ): Recommendation[] {
    let results = this.repository.findAll(workspaceId);

    if (filters.type !== undefined) {
      results = results.filter((item) => item.type === filters.type);
    }

    if (filters.priority !== undefined) {
      results = results.filter((item) => item.priority === filters.priority);
    }

    if (hasValue(filters.insightId)) {
      const insightId = filters.insightId!.trim();
      results = results.filter((item) => item.insightIds.includes(insightId));
    }

    if (hasValue(filters.campaignSessionId)) {
      const sessionId = filters.campaignSessionId!.trim();
      results = results.filter((item) => item.campaignSessionIds.includes(sessionId));
    }

    if (hasValue(filters.q)) {
      const needle = filters.q!.trim().toLowerCase();
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(needle) ||
          item.description.toLowerCase().includes(needle) ||
          item.rationale.toLowerCase().includes(needle),
      );
    }

    return results;
  }
}

function hasValue(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== '';
}

function cloneIds(ids?: string[]): string[] {
  return ids ? [...ids] : [];
}

function cloneMetadata(metadata?: RecommendationMetadata): RecommendationMetadata {
  if (!metadata) return {};

  const cloned: RecommendationMetadata = {};
  if (metadata.confidence !== undefined) cloned.confidence = metadata.confidence;
  if (metadata.generatedBy !== undefined) cloned.generatedBy = metadata.generatedBy;
  if (metadata.ruleId !== undefined) cloned.ruleId = metadata.ruleId;
  if (metadata.pipelineRunId !== undefined) cloned.pipelineRunId = metadata.pipelineRunId;
  return cloned;
}

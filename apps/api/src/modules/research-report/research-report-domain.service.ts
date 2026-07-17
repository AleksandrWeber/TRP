import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DEFAULT_WORKSPACE_ID } from '../pipeline/workspace-context';
import type { ReportMetadata } from './report-metadata';
import type { ReportSection } from './report-section';
import type { ResearchReport } from './research-report';
import {
  buildResearchReportDraft,
  type ResearchReportBuildInput,
} from './research-report-build.rules';
import type { ResearchReportRepository } from './repositories/research-report.repository';
import { RESEARCH_REPORT_REPOSITORY } from './repositories/research-report.repository.token';

export type CreateResearchReportInput = {
  workspaceId: string;
  campaignSessionIds?: string[];
  knowledgeEntryIds?: string[];
  insightIds?: string[];
  recommendationIds?: string[];
  sections?: ReportSection[];
  metadata?: ReportMetadata;
  createdAt?: string;
};

export type ResearchReportSearchFilters = {
  q?: string;
  campaignSessionId?: string;
  knowledgeEntryId?: string;
  insightId?: string;
  recommendationId?: string;
};

/**
 * Research Report domain service (US099, US102).
 * create / getById / search / build.
 * Storage is delegated to ResearchReportRepository (no owned Map).
 *
 * ResearchReport references entities by id only; it must not duplicate entity payloads.
 * No Pipeline / AI / Export / REST / Prisma coupling.
 */
@Injectable()
export class ResearchReportDomainService {
  constructor(
    @Inject(RESEARCH_REPORT_REPOSITORY)
    private readonly repository: ResearchReportRepository,
  ) {}

  create(input: CreateResearchReportInput): ResearchReport {
    const report: ResearchReport = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      createdAt: input.createdAt ?? new Date().toISOString(),
      campaignSessionIds: cloneIds(input.campaignSessionIds),
      knowledgeEntryIds: cloneIds(input.knowledgeEntryIds),
      insightIds: cloneIds(input.insightIds),
      recommendationIds: cloneIds(input.recommendationIds),
      sections: cloneSections(input.sections),
      metadata: cloneMetadata(input.metadata),
    };

    this.repository.save(report);
    return report;
  }

  /**
   * Aggregate Campaign / Knowledge / Insight / Recommendation into a structured report.
   * ResearchReportDomainService.create is the only write path.
   */
  build(input: ResearchReportBuildInput, workspaceId: string): ResearchReport {
    const draft = buildResearchReportDraft(input);
    return this.create({ ...draft, workspaceId });
  }

  getById(id: string, workspaceId: string): ResearchReport | null {
    return this.repository.findById(id, workspaceId);
  }

  /**
   * Combined filters with AND semantics.
   * Empty / omitted filters are ignored.
   * `q` matches report id only (structured data — no narrative fields).
   */
  search(
    filters: ResearchReportSearchFilters = {},
    workspaceId: string = DEFAULT_WORKSPACE_ID,
  ): ResearchReport[] {
    let results = this.repository.findAll(workspaceId);

    if (hasValue(filters.campaignSessionId)) {
      const sessionId = filters.campaignSessionId!.trim();
      results = results.filter((report) => report.campaignSessionIds.includes(sessionId));
    }

    if (hasValue(filters.knowledgeEntryId)) {
      const knowledgeId = filters.knowledgeEntryId!.trim();
      results = results.filter((report) => report.knowledgeEntryIds.includes(knowledgeId));
    }

    if (hasValue(filters.insightId)) {
      const insightId = filters.insightId!.trim();
      results = results.filter((report) => report.insightIds.includes(insightId));
    }

    if (hasValue(filters.recommendationId)) {
      const recommendationId = filters.recommendationId!.trim();
      results = results.filter((report) => report.recommendationIds.includes(recommendationId));
    }

    if (hasValue(filters.q)) {
      const needle = filters.q!.trim().toLowerCase();
      results = results.filter((report) => report.id.toLowerCase().includes(needle));
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

function cloneSections(sections?: ReportSection[]): ReportSection[] {
  if (!sections) return [];
  return sections.map((section) => ({
    type: section.type,
    itemIds: [...section.itemIds],
  }));
}

function cloneMetadata(metadata?: ReportMetadata): ReportMetadata {
  if (!metadata) return {};

  const cloned: ReportMetadata = {};
  if (metadata.campaignCount !== undefined) cloned.campaignCount = metadata.campaignCount;
  if (metadata.knowledgeEntryCount !== undefined) {
    cloned.knowledgeEntryCount = metadata.knowledgeEntryCount;
  }
  if (metadata.insightCount !== undefined) cloned.insightCount = metadata.insightCount;
  if (metadata.recommendationCount !== undefined) {
    cloned.recommendationCount = metadata.recommendationCount;
  }
  if (metadata.generatedBy !== undefined) cloned.generatedBy = metadata.generatedBy;
  return cloned;
}

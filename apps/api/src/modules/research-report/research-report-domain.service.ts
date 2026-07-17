import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ReportMetadata } from './report-metadata';
import type { ReportSection } from './report-section';
import type { ResearchReport } from './research-report';
import {
  buildResearchReportDraft,
  type ResearchReportBuildInput,
} from './research-report-build.rules';

export type CreateResearchReportInput = {
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
 * In-memory Research Report domain service (US099).
 * create / getById / search / build.
 *
 * ResearchReport references entities by id only; it must not duplicate entity payloads.
 * No Pipeline / AI / Export / REST / Prisma / Repository coupling.
 */
@Injectable()
export class ResearchReportDomainService {
  private readonly reports = new Map<string, ResearchReport>();

  create(input: CreateResearchReportInput): ResearchReport {
    const report: ResearchReport = {
      id: randomUUID(),
      createdAt: input.createdAt ?? new Date().toISOString(),
      campaignSessionIds: cloneIds(input.campaignSessionIds),
      knowledgeEntryIds: cloneIds(input.knowledgeEntryIds),
      insightIds: cloneIds(input.insightIds),
      recommendationIds: cloneIds(input.recommendationIds),
      sections: cloneSections(input.sections),
      metadata: cloneMetadata(input.metadata),
    };

    this.reports.set(report.id, report);
    return report;
  }

  /**
   * Aggregate Campaign / Knowledge / Insight / Recommendation into a structured report.
   * ResearchReportDomainService.create is the only write path.
   */
  build(input: ResearchReportBuildInput): ResearchReport {
    const draft = buildResearchReportDraft(input);
    return this.create(draft);
  }

  getById(id: string): ResearchReport | null {
    return this.reports.get(id) ?? null;
  }

  /**
   * Combined filters with AND semantics.
   * Empty / omitted filters are ignored.
   * `q` matches report id only (structured data — no narrative fields).
   */
  search(filters: ResearchReportSearchFilters = {}): ResearchReport[] {
    let results = Array.from(this.reports.values());

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

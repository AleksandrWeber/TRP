import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Experiment } from '../experiments/experiment';
import type { KnowledgeEntry } from './knowledge-entry';
import { KnowledgeExtractionService } from './knowledge-extraction.service';
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
 * In-memory Knowledge domain service (US075–US079).
 * create / update / get / list / createFromExperiment / search — no Repository.
 *
 * Distinct from Prisma-backed {@link KnowledgeService} (`research_outcome` persistence).
 */
@Injectable()
export class KnowledgeDomainService {
  private readonly entries = new Map<string, KnowledgeEntry>();
  /** One KnowledgeEntry per Experiment (US077). */
  private readonly byExperimentId = new Map<string, string>();

  constructor(private readonly extraction: KnowledgeExtractionService) {}

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
   * (one entry per experimentId — never duplicates).
   */
  createFromExperiment(experiment: Experiment): KnowledgeEntry {
    const extracted = this.extraction.extract(experiment);
    return this.create({
      experimentId: extracted.experimentId,
      title: extracted.title,
      summary: extracted.summary,
      tags: extracted.tags,
      insights: extracted.insights,
      metadata: extracted.metadata,
      createdAt: extracted.createdAt,
    });
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

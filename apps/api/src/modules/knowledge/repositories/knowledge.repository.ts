import type { KnowledgeEntry } from '../knowledge-entry';

/**
 * Persistence contract for Knowledge domain entities (US102).
 * Storage + experiment index only — no search / extraction logic.
 * Distinct from Prisma-backed KnowledgeService.
 */
export interface KnowledgeRepository {
  save(entry: KnowledgeEntry): void;
  /** Returns null when missing OR when the entry belongs to a different workspace (US109). */
  findById(knowledgeId: string, workspaceId: string): KnowledgeEntry | null;
  findByExperimentId(experimentId: string, workspaceId: string): KnowledgeEntry | null;
  findAll(workspaceId: string): KnowledgeEntry[];
}

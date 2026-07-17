import type { KnowledgeEntry } from '../knowledge-entry';
import type { KnowledgeRepository } from './knowledge.repository';

/**
 * In-memory KnowledgeRepository (Map-backed) (US102).
 * Maintains one-entry-per-experiment index used by domain upsert.
 * No filesystem, database, or serialization.
 */
export class InMemoryKnowledgeRepository implements KnowledgeRepository {
  private readonly entries = new Map<string, KnowledgeEntry>();
  /** One KnowledgeEntry per (workspaceId, experimentId) (US077, US109). */
  private readonly byExperimentId = new Map<string, string>();

  save(entry: KnowledgeEntry): void {
    this.entries.set(entry.knowledgeId, entry);
    this.byExperimentId.set(
      experimentIndexKey(entry.workspaceId, entry.experimentId),
      entry.knowledgeId,
    );
  }

  findById(knowledgeId: string, workspaceId: string): KnowledgeEntry | null {
    const found = this.entries.get(knowledgeId);
    if (!found || found.workspaceId !== workspaceId) return null;
    return found;
  }

  findByExperimentId(experimentId: string, workspaceId: string): KnowledgeEntry | null {
    const knowledgeId = this.byExperimentId.get(experimentIndexKey(workspaceId, experimentId));
    if (!knowledgeId) return null;
    return this.entries.get(knowledgeId) ?? null;
  }

  findAll(workspaceId: string): KnowledgeEntry[] {
    return Array.from(this.entries.values()).filter((entry) => entry.workspaceId === workspaceId);
  }
}

function experimentIndexKey(workspaceId: string, experimentId: string): string {
  return `${workspaceId}::${experimentId}`;
}

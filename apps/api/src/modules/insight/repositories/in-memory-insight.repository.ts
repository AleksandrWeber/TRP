import type { Insight } from '../insight';
import type { InsightRepository } from './insight.repository';

/**
 * In-memory InsightRepository (Map-backed) (US102).
 * No filesystem, database, or serialization.
 */
export class InMemoryInsightRepository implements InsightRepository {
  private readonly store = new Map<string, Insight>();

  save(insight: Insight): void {
    this.store.set(insight.id, insight);
  }

  findById(id: string, workspaceId: string): Insight | null {
    const found = this.store.get(id);
    if (!found || found.workspaceId !== workspaceId) return null;
    return found;
  }

  findAll(workspaceId: string): Insight[] {
    return Array.from(this.store.values()).filter((insight) => insight.workspaceId === workspaceId);
  }

  delete(id: string, workspaceId: string): boolean {
    const found = this.store.get(id);
    if (!found || found.workspaceId !== workspaceId) return false;
    return this.store.delete(id);
  }
}

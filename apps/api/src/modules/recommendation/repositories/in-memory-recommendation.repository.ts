import type { Recommendation } from '../recommendation';
import type { RecommendationRepository } from './recommendation.repository';

/**
 * In-memory RecommendationRepository (Map-backed) (US102).
 * No filesystem, database, or serialization.
 */
export class InMemoryRecommendationRepository implements RecommendationRepository {
  private readonly store = new Map<string, Recommendation>();

  save(recommendation: Recommendation): void {
    this.store.set(recommendation.id, recommendation);
  }

  findById(id: string, workspaceId: string): Recommendation | null {
    const found = this.store.get(id);
    if (!found || found.workspaceId !== workspaceId) return null;
    return found;
  }

  findAll(workspaceId: string): Recommendation[] {
    return Array.from(this.store.values()).filter((item) => item.workspaceId === workspaceId);
  }

  delete(id: string, workspaceId: string): boolean {
    const found = this.store.get(id);
    if (!found || found.workspaceId !== workspaceId) return false;
    return this.store.delete(id);
  }
}

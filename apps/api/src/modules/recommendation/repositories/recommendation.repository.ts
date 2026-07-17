import type { Recommendation } from '../recommendation';

/**
 * Persistence contract for Recommendation domain entities (US102).
 * Storage operations only — no generation / search logic.
 */
export interface RecommendationRepository {
  save(recommendation: Recommendation): void;
  /** Returns null when missing OR when the recommendation belongs to a different workspace (US109). */
  findById(id: string, workspaceId: string): Recommendation | null;
  findAll(workspaceId: string): Recommendation[];
  /** Deletes only when the recommendation matches workspaceId (US109). */
  delete(id: string, workspaceId: string): boolean;
}

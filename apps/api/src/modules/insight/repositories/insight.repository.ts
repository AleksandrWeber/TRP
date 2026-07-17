import type { Insight } from '../insight';

/**
 * Persistence contract for Insight domain entities (US102).
 * Storage operations only — no search / extraction logic.
 */
export interface InsightRepository {
  save(insight: Insight): void;
  /** Returns null when missing OR when the insight belongs to a different workspace (US109). */
  findById(id: string, workspaceId: string): Insight | null;
  findAll(workspaceId: string): Insight[];
  /** Deletes only when the insight matches workspaceId (US109). */
  delete(id: string, workspaceId: string): boolean;
}

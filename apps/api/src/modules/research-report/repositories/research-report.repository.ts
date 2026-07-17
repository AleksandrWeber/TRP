import type { ResearchReport } from '../research-report';

/**
 * Persistence contract for ResearchReport domain entities (US102).
 * Storage operations only — no build / search logic.
 */
export interface ResearchReportRepository {
  save(report: ResearchReport): void;
  /** Returns null when missing OR when the report belongs to a different workspace (US109). */
  findById(id: string, workspaceId: string): ResearchReport | null;
  findAll(workspaceId: string): ResearchReport[];
}

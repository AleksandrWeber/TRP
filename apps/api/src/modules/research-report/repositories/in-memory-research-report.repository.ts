import type { ResearchReport } from '../research-report';
import type { ResearchReportRepository } from './research-report.repository';

/**
 * In-memory ResearchReportRepository (Map-backed) (US102).
 * No filesystem, database, or serialization.
 */
export class InMemoryResearchReportRepository implements ResearchReportRepository {
  private readonly store = new Map<string, ResearchReport>();

  save(report: ResearchReport): void {
    this.store.set(report.id, report);
  }

  findById(id: string, workspaceId: string): ResearchReport | null {
    const found = this.store.get(id);
    if (!found || found.workspaceId !== workspaceId) return null;
    return found;
  }

  findAll(workspaceId: string): ResearchReport[] {
    return Array.from(this.store.values()).filter((report) => report.workspaceId === workspaceId);
  }
}

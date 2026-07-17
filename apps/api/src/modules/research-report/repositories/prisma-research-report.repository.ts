import type { Prisma, PrismaClient } from '@prisma/client';
import type { ResearchReport } from '../research-report';
import type { ResearchReportRepository } from './research-report.repository';

/**
 * Prisma-backed ResearchReportRepository (US104).
 * Sync interface preserved via write-through cache; durable writes go to Prisma.
 */
export class PrismaResearchReportRepository implements ResearchReportRepository {
  private readonly cache = new Map<string, ResearchReport>();

  constructor(private readonly prisma: PrismaClient) {}

  async hydrate(): Promise<void> {
    const rows = await this.prisma.researchReportAggregate.findMany();
    this.cache.clear();
    for (const row of rows) {
      this.cache.set(row.id, row.payload as ResearchReport);
    }
  }

  save(report: ResearchReport): void {
    this.cache.set(report.id, report);
    void this.prisma.researchReportAggregate.upsert({
      where: { id: report.id },
      create: { id: report.id, payload: report as unknown as Prisma.InputJsonValue },
      update: { payload: report as unknown as Prisma.InputJsonValue },
    });
  }

  findById(id: string, workspaceId: string): ResearchReport | null {
    const found = this.cache.get(id);
    if (!found || found.workspaceId !== workspaceId) return null;
    return found;
  }

  findAll(workspaceId: string): ResearchReport[] {
    return Array.from(this.cache.values()).filter((report) => report.workspaceId === workspaceId);
  }
}

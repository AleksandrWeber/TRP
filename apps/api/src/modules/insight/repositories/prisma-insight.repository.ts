import type { Prisma, PrismaClient } from '@prisma/client';
import type { Insight } from '../insight';
import type { InsightRepository } from './insight.repository';

/**
 * Prisma-backed InsightRepository (US104).
 * Sync interface preserved via write-through cache; durable writes go to Prisma.
 */
export class PrismaInsightRepository implements InsightRepository {
  private readonly cache = new Map<string, Insight>();

  constructor(private readonly prisma: PrismaClient) {}

  async hydrate(): Promise<void> {
    const rows = await this.prisma.researchInsight.findMany();
    this.cache.clear();
    for (const row of rows) {
      this.cache.set(row.id, row.payload as Insight);
    }
  }

  save(insight: Insight): void {
    this.cache.set(insight.id, insight);
    void this.prisma.researchInsight.upsert({
      where: { id: insight.id },
      create: { id: insight.id, payload: insight as unknown as Prisma.InputJsonValue },
      update: { payload: insight as unknown as Prisma.InputJsonValue },
    });
  }

  findById(id: string, workspaceId: string): Insight | null {
    const found = this.cache.get(id);
    if (!found || found.workspaceId !== workspaceId) return null;
    return found;
  }

  findAll(workspaceId: string): Insight[] {
    return Array.from(this.cache.values()).filter((insight) => insight.workspaceId === workspaceId);
  }

  delete(id: string, workspaceId: string): boolean {
    const found = this.cache.get(id);
    if (!found || found.workspaceId !== workspaceId) return false;
    const existed = this.cache.delete(id);
    if (existed) {
      void this.prisma.researchInsight.delete({ where: { id } }).catch(() => undefined);
    }
    return existed;
  }
}

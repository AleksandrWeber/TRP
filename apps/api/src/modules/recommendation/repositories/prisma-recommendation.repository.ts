import type { Prisma, PrismaClient } from '@prisma/client';
import type { Recommendation } from '../recommendation';
import type { RecommendationRepository } from './recommendation.repository';

/**
 * Prisma-backed RecommendationRepository (US104).
 * Sync interface preserved via write-through cache; durable writes go to Prisma.
 */
export class PrismaRecommendationRepository implements RecommendationRepository {
  private readonly cache = new Map<string, Recommendation>();

  constructor(private readonly prisma: PrismaClient) {}

  async hydrate(): Promise<void> {
    const rows = await this.prisma.researchRecommendation.findMany();
    this.cache.clear();
    for (const row of rows) {
      this.cache.set(row.id, row.payload as Recommendation);
    }
  }

  save(recommendation: Recommendation): void {
    this.cache.set(recommendation.id, recommendation);
    void this.prisma.researchRecommendation.upsert({
      where: { id: recommendation.id },
      create: {
        id: recommendation.id,
        payload: recommendation as unknown as Prisma.InputJsonValue,
      },
      update: { payload: recommendation as unknown as Prisma.InputJsonValue },
    });
  }

  findById(id: string, workspaceId: string): Recommendation | null {
    const found = this.cache.get(id);
    if (!found || found.workspaceId !== workspaceId) return null;
    return found;
  }

  findAll(workspaceId: string): Recommendation[] {
    return Array.from(this.cache.values()).filter((item) => item.workspaceId === workspaceId);
  }

  delete(id: string, workspaceId: string): boolean {
    const found = this.cache.get(id);
    if (!found || found.workspaceId !== workspaceId) return false;
    const existed = this.cache.delete(id);
    if (existed) {
      void this.prisma.researchRecommendation.delete({ where: { id } }).catch(() => undefined);
    }
    return existed;
  }
}

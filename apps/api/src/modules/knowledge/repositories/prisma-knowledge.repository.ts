import type { Prisma, PrismaClient } from '@prisma/client';
import type { KnowledgeEntry } from '../knowledge-entry';
import type { KnowledgeRepository } from './knowledge.repository';

/**
 * Prisma-backed KnowledgeRepository for domain KnowledgeEntry (US104).
 * Distinct from legacy Prisma KnowledgeEntry / KnowledgeService.
 */
export class PrismaKnowledgeRepository implements KnowledgeRepository {
  private readonly entries = new Map<string, KnowledgeEntry>();
  private readonly byExperimentId = new Map<string, string>();

  constructor(private readonly prisma: PrismaClient) {}

  async hydrate(): Promise<void> {
    const rows = await this.prisma.researchDomainKnowledge.findMany();
    this.entries.clear();
    this.byExperimentId.clear();
    for (const row of rows) {
      const entry = row.payload as KnowledgeEntry;
      this.entries.set(entry.knowledgeId, entry);
      this.byExperimentId.set(
        experimentIndexKey(entry.workspaceId, entry.experimentId),
        entry.knowledgeId,
      );
    }
  }

  save(entry: KnowledgeEntry): void {
    this.entries.set(entry.knowledgeId, entry);
    this.byExperimentId.set(
      experimentIndexKey(entry.workspaceId, entry.experimentId),
      entry.knowledgeId,
    );
    void this.prisma.researchDomainKnowledge.upsert({
      where: { knowledgeId: entry.knowledgeId },
      create: {
        knowledgeId: entry.knowledgeId,
        experimentId: entry.experimentId,
        payload: entry as unknown as Prisma.InputJsonValue,
      },
      update: {
        experimentId: entry.experimentId,
        payload: entry as unknown as Prisma.InputJsonValue,
      },
    });
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

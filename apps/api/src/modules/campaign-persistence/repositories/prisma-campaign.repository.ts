import type { Prisma, PrismaClient } from '@prisma/client';
import type { CampaignRecord } from '../campaign-record';
import type { CampaignRepository } from '../campaign-repository';

/**
 * Prisma-backed CampaignRepository (US104).
 * Sync interface preserved via write-through cache; durable writes go to Prisma.
 */
export class PrismaCampaignRepository implements CampaignRepository {
  private readonly store = new Map<string, CampaignRecord>();

  constructor(private readonly prisma: PrismaClient) {}

  async hydrate(): Promise<void> {
    const rows = await this.prisma.researchCampaignRecord.findMany();
    this.store.clear();
    for (const row of rows) {
      this.store.set(row.id, row.payload as CampaignRecord);
    }
  }

  save(record: CampaignRecord): void {
    this.store.set(record.id, record);
    void this.prisma.researchCampaignRecord.upsert({
      where: { id: record.id },
      create: { id: record.id, payload: record as unknown as Prisma.InputJsonValue },
      update: { payload: record as unknown as Prisma.InputJsonValue },
    });
  }

  findById(id: string, workspaceId: string): CampaignRecord | null {
    const found = this.store.get(id);
    if (!found || found.workspaceId !== workspaceId) return null;
    return found;
  }

  findAll(workspaceId: string): CampaignRecord[] {
    return Array.from(this.store.values()).filter((record) => record.workspaceId === workspaceId);
  }

  exists(id: string, workspaceId: string): boolean {
    const found = this.store.get(id);
    return found !== undefined && found.workspaceId === workspaceId;
  }

  delete(id: string, workspaceId: string): void {
    const found = this.store.get(id);
    if (!found || found.workspaceId !== workspaceId) return;
    this.store.delete(id);
    void this.prisma.researchCampaignRecord.delete({ where: { id } }).catch(() => undefined);
  }
}

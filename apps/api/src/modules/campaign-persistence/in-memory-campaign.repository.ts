import type { CampaignRecord } from './campaign-record';
import type { CampaignRepository } from './campaign-repository';

/**
 * Temporary in-memory CampaignRepository (Map-backed).
 * No filesystem, database, or serialization.
 * Instantiate per use — not a process-wide singleton.
 */
export class InMemoryCampaignRepository implements CampaignRepository {
  private readonly store = new Map<string, CampaignRecord>();

  save(record: CampaignRecord): void {
    this.store.set(record.id, cloneRecord(record));
  }

  findById(id: string): CampaignRecord | null {
    const found = this.store.get(id);
    if (!found) return null;
    return cloneRecord(found);
  }

  findAll(): CampaignRecord[] {
    return Array.from(this.store.values()).map((record) => cloneRecord(record));
  }

  exists(id: string): boolean {
    return this.store.has(id);
  }

  delete(id: string): void {
    this.store.delete(id);
  }
}

function cloneRecord(record: CampaignRecord): CampaignRecord {
  return {
    id: record.id,
    sessionId: record.sessionId,
    status: record.status,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
    metadata: {
      engineVersion: record.metadata.engineVersion,
      ...(record.metadata.datasetId !== undefined ? { datasetId: record.metadata.datasetId } : {}),
      ...(record.metadata.tags !== undefined ? { tags: [...record.metadata.tags] } : {}),
    },
    report: {
      ...record.report,
      recommendations: [...record.report.recommendations],
    },
  };
}

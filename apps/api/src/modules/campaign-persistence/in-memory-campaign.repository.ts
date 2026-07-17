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

  findById(id: string, workspaceId: string): CampaignRecord | null {
    const found = this.store.get(id);
    if (!found || found.workspaceId !== workspaceId) return null;
    return cloneRecord(found);
  }

  findAll(workspaceId: string): CampaignRecord[] {
    return Array.from(this.store.values())
      .filter((record) => record.workspaceId === workspaceId)
      .map((record) => cloneRecord(record));
  }

  exists(id: string, workspaceId: string): boolean {
    const found = this.store.get(id);
    return found !== undefined && found.workspaceId === workspaceId;
  }

  delete(id: string, workspaceId: string): void {
    const found = this.store.get(id);
    if (found && found.workspaceId === workspaceId) {
      this.store.delete(id);
    }
  }
}

function cloneRecord(record: CampaignRecord): CampaignRecord {
  return {
    id: record.id,
    sessionId: record.sessionId,
    workspaceId: record.workspaceId,
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

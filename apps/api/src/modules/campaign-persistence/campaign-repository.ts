import type { CampaignRecord } from './campaign-record';

/**
 * Persistence contract for CampaignRecord.
 * No business logic — storage operations only.
 */
export interface CampaignRepository {
  save(record: CampaignRecord): void;
  /** Returns null when missing OR when the record belongs to a different workspace (US109). */
  findById(id: string, workspaceId: string): CampaignRecord | null;
  findAll(workspaceId: string): CampaignRecord[];
  exists(id: string, workspaceId: string): boolean;
  /** Deletes only when the record matches workspaceId (US109). */
  delete(id: string, workspaceId: string): void;
}

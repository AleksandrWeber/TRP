import type { CampaignRecord } from './campaign-record';

/**
 * Persistence contract for CampaignRecord.
 * No business logic — storage operations only.
 */
export interface CampaignRepository {
  save(record: CampaignRecord): void;
  findById(id: string): CampaignRecord | null;
  findAll(): CampaignRecord[];
  exists(id: string): boolean;
  delete(id: string): void;
}

import type { CampaignSession } from '../campaign-session/campaign-session';
import type { ImportFormat } from './import-format';

/**
 * Strategy interface for Campaign Session import formats.
 * Implementations return CampaignSession only — never CampaignRecord.
 */
export interface CampaignImporter {
  readonly format: ImportFormat;
  import(payload: string): CampaignSession;
}

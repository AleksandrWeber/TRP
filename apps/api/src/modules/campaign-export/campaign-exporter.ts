import type { CampaignSession } from '../campaign-session/campaign-session';
import type { ExportFormat } from './export-format';

/**
 * Strategy interface for Campaign Session export formats.
 * Implementations receive CampaignSession only — never CampaignRecord.
 */
export interface CampaignExporter {
  readonly format: ExportFormat;
  export(session: CampaignSession): string;
}

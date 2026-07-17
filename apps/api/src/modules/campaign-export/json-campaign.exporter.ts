import { Injectable } from '@nestjs/common';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { CampaignExporter } from './campaign-exporter';
import { ExportFormat } from './export-format';

/**
 * Serializes a CampaignSession as pretty-printed JSON.
 */
@Injectable()
export class JsonCampaignExporter implements CampaignExporter {
  readonly format = ExportFormat.JSON;

  export(session: CampaignSession): string {
    return JSON.stringify(session, null, 2);
  }
}

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { CampaignImporter } from './campaign-importer';
import { CAMPAIGN_IMPORTERS } from './campaign-importers.token';
import { ImportFormat } from './import-format';

/**
 * Campaign Session import entry point.
 * Delegates to format-specific CampaignImporter strategies (US063).
 * Returns CampaignSession only — never CampaignRecord. Does not persist.
 */
@Injectable()
export class CampaignImportService {
  private readonly importersByFormat: Map<ImportFormat, CampaignImporter>;

  constructor(@Inject(CAMPAIGN_IMPORTERS) importers: CampaignImporter[]) {
    this.importersByFormat = new Map(importers.map((importer) => [importer.format, importer]));
  }

  import(payload: string, format: ImportFormat): CampaignSession {
    const importer = this.importersByFormat.get(format);
    if (!importer) {
      throw new BadRequestException(`Unsupported import format: ${String(format)}`);
    }
    return importer.import(payload);
  }
}

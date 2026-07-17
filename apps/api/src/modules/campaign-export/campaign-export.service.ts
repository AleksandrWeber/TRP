import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { CampaignSession } from '../campaign-session/campaign-session';
import type { CampaignExporter } from './campaign-exporter';
import { CAMPAIGN_EXPORTERS } from './campaign-exporters.token';
import { ExportFormat } from './export-format';

/**
 * Campaign Session export entry point.
 * Delegates to format-specific CampaignExporter strategies (US061).
 * Accepts CampaignSession only — never CampaignRecord.
 */
@Injectable()
export class CampaignExportService {
  private readonly exportersByFormat: Map<ExportFormat, CampaignExporter>;

  constructor(@Inject(CAMPAIGN_EXPORTERS) exporters: CampaignExporter[]) {
    this.exportersByFormat = new Map(exporters.map((exporter) => [exporter.format, exporter]));
  }

  export(session: CampaignSession, format: ExportFormat): string {
    const exporter = this.exportersByFormat.get(format);
    if (!exporter) {
      throw new BadRequestException(`Unsupported export format: ${String(format)}`);
    }
    return exporter.export(session);
  }
}

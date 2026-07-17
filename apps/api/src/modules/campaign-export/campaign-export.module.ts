import { Module } from '@nestjs/common';
import { CampaignPersistenceModule } from '../campaign-persistence/campaign-persistence.module';
import { CampaignExportController } from './campaign-export.controller';
import { CampaignExportService } from './campaign-export.service';
import { CAMPAIGN_EXPORTERS } from './campaign-exporters.token';
import { CsvCampaignExporter } from './csv-campaign.exporter';
import { JsonCampaignExporter } from './json-campaign.exporter';

/**
 * Campaign Session Export Nest module (US061–US062).
 * Read-only HTTP: GET /campaign-history/:sessionId/export
 */
@Module({
  imports: [CampaignPersistenceModule],
  controllers: [CampaignExportController],
  providers: [
    JsonCampaignExporter,
    CsvCampaignExporter,
    {
      provide: CAMPAIGN_EXPORTERS,
      useFactory: (json: JsonCampaignExporter, csv: CsvCampaignExporter) => [json, csv],
      inject: [JsonCampaignExporter, CsvCampaignExporter],
    },
    CampaignExportService,
  ],
  exports: [CampaignExportService],
})
export class CampaignExportModule {}

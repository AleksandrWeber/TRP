import { Module } from '@nestjs/common';
import { CampaignImportController } from './campaign-import.controller';
import { CampaignImportService } from './campaign-import.service';
import { CAMPAIGN_IMPORTERS } from './campaign-importers.token';
import { CampaignSessionValidator } from './campaign-session.validator';
import { JsonCampaignImporter } from './json-campaign.importer';

/**
 * Campaign Session Import Nest module (US063–US065).
 * HTTP: POST /campaign-import — does not persist imported sessions.
 */
@Module({
  controllers: [CampaignImportController],
  providers: [
    CampaignSessionValidator,
    JsonCampaignImporter,
    {
      provide: CAMPAIGN_IMPORTERS,
      useFactory: (json: JsonCampaignImporter) => [json],
      inject: [JsonCampaignImporter],
    },
    CampaignImportService,
  ],
  exports: [CampaignImportService, CampaignSessionValidator],
})
export class CampaignImportModule {}

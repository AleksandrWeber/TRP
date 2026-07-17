import { Module } from '@nestjs/common';
import { ResearchCampaignModule } from '../research-campaign/research-campaign.module';
import { CampaignReplayService } from './campaign-replay.service';

/**
 * Campaign Replay Nest module (US066–US067).
 * Prepares and executes transient replays via ResearchCampaignService.
 * No HTTP API; no Persistence/History writes on execute (`persistSession: false`).
 */
@Module({
  imports: [ResearchCampaignModule],
  providers: [CampaignReplayService],
  exports: [CampaignReplayService],
})
export class CampaignReplayModule {}

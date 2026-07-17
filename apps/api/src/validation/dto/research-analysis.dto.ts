import { IsObject, IsOptional } from 'class-validator';
import type { CampaignSummary } from '../../modules/research-campaign/research-campaign.types';

/**
 * Campaign analysis body DTO (US113).
 * `campaignSummary` is a large domain object — validated for presence/shape
 * only; the "required" business rule remains a manual BadRequestException.
 */
export class AnalyzeCampaignBodyDto {
  @IsOptional()
  @IsObject()
  campaignSummary?: CampaignSummary;
}

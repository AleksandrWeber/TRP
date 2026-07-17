import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from './base.dto';

/**
 * Cross-campaign analysis list query DTO (US113).
 */
export class ListCrossCampaignAnalysisQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  campaignSessionId?: string;
}

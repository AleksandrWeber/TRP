import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { CampaignSessionStatus } from '../../modules/campaign-session/campaign-session-status';
import { ApiSortOrderDto } from './base.dto';

/**
 * Campaign history list query DTO (US113).
 * Uses `sortDirection` (not `sortOrder`) to match the existing Campaign
 * History API contract. `tags` accepts a single comma-separated value or
 * repeated query params (both normalized by the controller).
 */
export class ListCampaignHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  sortBy?: string;

  @IsOptional()
  @IsEnum(ApiSortOrderDto)
  sortDirection?: ApiSortOrderDto;

  @IsOptional()
  @IsEnum(CampaignSessionStatus)
  status?: CampaignSessionStatus;

  @IsOptional()
  @IsString()
  engineVersion?: string;

  @IsOptional()
  @IsString()
  datasetId?: string;

  @IsOptional()
  tags?: string | string[];
}

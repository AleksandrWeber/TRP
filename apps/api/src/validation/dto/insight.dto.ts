import { IsEnum, IsOptional, IsString } from 'class-validator';
import { InsightType } from '../../modules/insight/insight-type';
import { PaginationQueryDto } from './base.dto';

/**
 * Insight list query DTO (US113).
 */
export class ListInsightQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(InsightType)
  type?: InsightType;

  @IsOptional()
  @IsString()
  campaignSessionId?: string;

  @IsOptional()
  @IsString()
  experimentId?: string;
}

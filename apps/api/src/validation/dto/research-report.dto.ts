import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from './base.dto';

/**
 * Research report list query DTO (US113).
 */
export class ListResearchReportQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  campaignSessionId?: string;
}

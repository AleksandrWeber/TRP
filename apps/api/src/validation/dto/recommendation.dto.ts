import { IsEnum, IsOptional } from 'class-validator';
import { RecommendationPriority } from '../../modules/recommendation/recommendation-priority';
import { RecommendationType } from '../../modules/recommendation/recommendation-type';
import { PaginationQueryDto } from './base.dto';

/**
 * Recommendation list query DTO (US113).
 */
export class ListRecommendationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(RecommendationType)
  type?: RecommendationType;

  @IsOptional()
  @IsEnum(RecommendationPriority)
  priority?: RecommendationPriority;
}

import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

/**
 * PC-10 — query/refresh transport for existing Market State surfaces.
 * workspaceId is taken from X-Workspace-Id, never from these queries.
 * Classify is not exposed.
 */
export class ListMarketStateHistoryQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  targetId?: string;
}

export class MarketStateTargetIdParamDto {
  @IsString()
  @MinLength(1)
  targetId!: string;
}

export class MarketStateVersionParamDto {
  @IsString()
  @MinLength(1)
  targetId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}

export class RefreshMarketStateBodyDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

/**
 * PC-09 — query transport for existing Market Profile ports.
 * workspaceId is taken from X-Workspace-Id, never from these queries.
 * Publish is not exposed.
 */
export class ListMarketProfileHistoryQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  targetId?: string;
}

export class MarketProfileTargetIdParamDto {
  @IsString()
  @MinLength(1)
  targetId!: string;
}

export class MarketProfileVersionParamDto {
  @IsString()
  @MinLength(1)
  targetId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}

export class CompareMarketProfileQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fromVersion!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  toVersion!: number;
}

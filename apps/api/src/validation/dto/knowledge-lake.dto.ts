import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export const KNOWLEDGE_LAKE_MODE_VALUES = ['paper', 'live', 'research', 'system'] as const;

/**
 * PC-16 — query transport for existing KnowledgeLakeQueryPort.list.
 * workspaceId is taken from X-Workspace-Id, never from this query.
 */
export class ListKnowledgeLakeQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  producer?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  category?: string;

  @IsOptional()
  @IsIn(KNOWLEDGE_LAKE_MODE_VALUES)
  mode?: (typeof KNOWLEDGE_LAKE_MODE_VALUES)[number];

  @IsOptional()
  @IsString()
  @MinLength(1)
  libraryEntryId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  reportRunId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  tradingSessionId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  exchangeScopeId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  correlationId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  occurredFrom?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  occurredTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  cursor?: string;
}

export class KnowledgeLakeEntryIdParamDto {
  @IsString()
  @MinLength(1)
  entryId!: string;
}

export class KnowledgeLakeEntryQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  entryId?: string;
}

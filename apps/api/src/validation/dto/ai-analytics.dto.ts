import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export const AI_ANALYTICS_KIND_VALUES = ['explain', 'summarize', 'trends', 'narrative'] as const;

/**
 * PC-17 — query transport for existing AIAnalyticsPort over ReportRuns.
 * workspaceId is taken from X-Workspace-Id, never from this query.
 */
export class ListAiAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(AI_ANALYTICS_KIND_VALUES)
  kind?: (typeof AI_ANALYTICS_KIND_VALUES)[number];

  @IsOptional()
  @IsString()
  @MinLength(1)
  reportRunId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  libraryEntryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class AiAnalyticsIdParamDto {
  @IsString()
  @MinLength(1)
  analysisId!: string;
}

export class AiAnalyticsProvenanceQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  analysisId?: string;
}

/**
 * PC-17 — generate transport for existing AIAnalyticsPort.
 * Invokes narrative generation only. Does not persist, own reports, or trade.
 */
export class GenerateAiAnalyticsBodyDto {
  @IsOptional()
  @IsIn(AI_ANALYTICS_KIND_VALUES)
  kind?: (typeof AI_ANALYTICS_KIND_VALUES)[number];

  @IsOptional()
  @IsString()
  @MinLength(1)
  reportRunId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  compareReportRunId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  libraryEntryId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  compareLibraryEntryId?: string;

  @IsOptional()
  @IsString()
  focus?: string;
}

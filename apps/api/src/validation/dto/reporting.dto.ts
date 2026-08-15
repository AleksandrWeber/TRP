import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export const REPORT_DEFINITION_KIND_VALUES = [
  'ops_daily',
  'ops_weekly',
  'research_summary',
  'custom',
] as const;

export const REPORT_RUN_STATUS_VALUES = ['completed', 'empty', 'rejected'] as const;

export const REPORTING_FACT_MODE_VALUES = ['paper', 'live', 'research', 'system'] as const;

/**
 * PC-05 — query transport for existing ReportingQueryPort.listRuns.
 * workspaceId is taken from X-Workspace-Id, never from this query.
 */
export class ListReportRunsQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  reportDefinitionId?: string;

  @IsOptional()
  @IsIn(REPORT_DEFINITION_KIND_VALUES)
  kind?: (typeof REPORT_DEFINITION_KIND_VALUES)[number];

  @IsOptional()
  @IsIn(REPORT_RUN_STATUS_VALUES)
  status?: (typeof REPORT_RUN_STATUS_VALUES)[number];

  @IsOptional()
  @IsIn(REPORTING_FACT_MODE_VALUES)
  mode?: (typeof REPORTING_FACT_MODE_VALUES)[number];

  @IsOptional()
  @IsString()
  @MinLength(1)
  tradingSessionId?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class ReportRunIdParamDto {
  @IsString()
  @MinLength(1)
  reportRunId!: string;
}

export class ListReportDefinitionsQueryDto {
  @IsOptional()
  @IsIn(REPORT_DEFINITION_KIND_VALUES)
  kind?: (typeof REPORT_DEFINITION_KIND_VALUES)[number];
}

export class ReportDefinitionIdParamDto {
  @IsString()
  @MinLength(1)
  reportDefinitionId!: string;
}

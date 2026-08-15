import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export const QUALIFICATION_PRODUCT_MODE_VALUES = ['lab', 'paper'] as const;

export const QUALIFICATION_RUN_STATUS_QUERY_VALUES = [
  'requested',
  'confirmed',
  'running',
  'completed',
  'failed',
  'cancelled',
  'rejected',
] as const;

/**
 * PC-08 — query/command transport for existing Market Qualification ports.
 * workspaceId is taken from X-Workspace-Id, never from these bodies.
 */
export class ListQualificationRunsQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  targetId?: string;

  @IsOptional()
  @IsIn(QUALIFICATION_RUN_STATUS_QUERY_VALUES)
  status?: (typeof QUALIFICATION_RUN_STATUS_QUERY_VALUES)[number];
}

export class QualificationTargetIdParamDto {
  @IsString()
  @MinLength(1)
  targetId!: string;
}

export class QualificationRunIdParamDto {
  @IsString()
  @MinLength(1)
  qualificationRunId!: string;
}

export class RequestQualificationRunBodyDto {
  @IsString()
  @MinLength(1)
  exchangeScopeId!: string;

  @IsString()
  @MinLength(1)
  marketSymbol!: string;

  @IsIn(QUALIFICATION_PRODUCT_MODE_VALUES)
  modeContext!: (typeof QUALIFICATION_PRODUCT_MODE_VALUES)[number];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class FailQualificationRunBodyDto {
  @IsArray()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  reasons!: string[];
}

export class RequalifyQualificationRunBodyDto {
  @IsIn(QUALIFICATION_PRODUCT_MODE_VALUES)
  modeContext!: (typeof QUALIFICATION_PRODUCT_MODE_VALUES)[number];

  @IsOptional()
  @IsString()
  notes?: string;
}

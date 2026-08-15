import { Type } from 'class-transformer';
import { IsIn, IsInt, IsObject, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export const RUNTIME_VALIDATION_PURPOSE_VALUES = ['deployment_bind', 'session_start'] as const;

/**
 * PC-04 — validateDeployment command body. Transport for RuntimeEnforcementPort.
 * workspaceId is taken from X-Workspace-Id, never from this body.
 */
export class RunRuntimeValidationBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  libraryEntryId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  strategyFamilyId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  strategyVersion?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  exchangeScopeId?: string;

  @IsOptional()
  @IsObject()
  tacticPoint?: Record<string, unknown>;

  @IsOptional()
  @IsIn(RUNTIME_VALIDATION_PURPOSE_VALUES)
  purpose?: (typeof RUNTIME_VALIDATION_PURPOSE_VALUES)[number];
}

export class RuntimeValidationIdParamDto {
  @IsString()
  @MinLength(1)
  validationId!: string;
}

export class ListRuntimeValidationHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

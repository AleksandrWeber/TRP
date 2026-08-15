import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export const ORCHESTRATION_PRODUCT_MODE_CONTEXTS = ['lab', 'paper'] as const;

/**
 * PC-11 — HTTP bodies for existing Trading Orchestrator commands.
 * workspaceId is taken from X-Workspace-Id. Live mode is not a product transport.
 */

export class CreateOrchestrationPlanBodyDto {
  @IsString()
  @MinLength(1)
  marketSymbol!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  exchangeScopeId?: string;

  @IsOptional()
  @IsIn([...ORCHESTRATION_PRODUCT_MODE_CONTEXTS])
  modeContext?: (typeof ORCHESTRATION_PRODUCT_MODE_CONTEXTS)[number];

  @IsString()
  @MinLength(1)
  objective!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  rationaleSummary?: string;
}

export class RequestOrchestrationRunBodyDto {
  @IsString()
  @MinLength(1)
  marketSymbol!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  exchangeScopeId?: string;

  @IsOptional()
  @IsIn([...ORCHESTRATION_PRODUCT_MODE_CONTEXTS])
  modeContext?: (typeof ORCHESTRATION_PRODUCT_MODE_CONTEXTS)[number];

  @IsOptional()
  @IsString()
  @MinLength(1)
  objective?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  orchestrationPlanId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  marketStateId?: string;

  @IsOptional()
  @IsBoolean()
  requiresConfirmation?: boolean;
}

export class ProposeSelectionBodyDto {
  @IsString()
  @MinLength(1)
  libraryEntryId!: string;

  @IsString()
  @MinLength(1)
  strategyVersionId!: string;

  @IsString()
  @MinLength(1)
  envelopeVersion!: string;

  @IsObject()
  tacticPoint!: Record<string, unknown>;
}

export class EmitSessionHandoffBodyDto {
  @IsString()
  @MinLength(1)
  selectionDecisionId!: string;

  @IsString()
  @MinLength(1)
  deploymentBindRef!: string;
}

export class CancelOrchestrationRunBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  reason?: string;
}

export class OrchestrationPlanIdParamDto {
  @IsString()
  @MinLength(1)
  planId!: string;
}

export class OrchestrationRunIdParamDto {
  @IsString()
  @MinLength(1)
  runId!: string;
}

export class SelectionDecisionIdParamDto {
  @IsString()
  @MinLength(1)
  selectionDecisionId!: string;
}

export class SessionHandoffIntentIdParamDto {
  @IsString()
  @MinLength(1)
  sessionHandoffIntentId!: string;
}

export class ListOrchestrationHistoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const EXCHANGE_SCOPE_LIFECYCLE_STATUS_VALUES = [
  'created',
  'active',
  'suspended',
  'archived',
] as const;

export const EXCHANGE_SCOPE_MODE_CONTEXT_VALUES = ['lab', 'paper', 'live'] as const;

/**
 * PC-12 — query/command transport for existing Exchange Scope ports.
 * workspaceId is taken from X-Workspace-Id, never from these bodies.
 */
export class ListExchangeScopesQueryDto {
  @IsOptional()
  @IsIn(EXCHANGE_SCOPE_LIFECYCLE_STATUS_VALUES)
  lifecycleStatus?: (typeof EXCHANGE_SCOPE_LIFECYCLE_STATUS_VALUES)[number];
}

export class ExchangeScopeIdParamDto {
  @IsString()
  @MinLength(1)
  exchangeScopeId!: string;
}

export class TradingAccountBindingIdParamDto {
  @IsString()
  @MinLength(1)
  exchangeScopeId!: string;

  @IsString()
  @MinLength(1)
  bindingId!: string;
}

export class RegisterExchangeScopeBodyDto {
  @IsString()
  @MinLength(1)
  venueCode!: string;

  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxActiveSessions?: number;

  @IsOptional()
  @IsIn(EXCHANGE_SCOPE_MODE_CONTEXT_VALUES)
  modeContext?: (typeof EXCHANGE_SCOPE_MODE_CONTEXT_VALUES)[number];
}

export class RenameExchangeScopeBodyDto {
  @IsString()
  @MinLength(1)
  displayName!: string;
}

export class ExchangeScopeReasonBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  reason?: string;
}

export class UpdateExchangeScopeConfigBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxActiveSessions?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  symbolAllowlist?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  strategyAllowlist?: string[];

  @IsOptional()
  @IsIn(EXCHANGE_SCOPE_MODE_CONTEXT_VALUES)
  modeContext?: (typeof EXCHANGE_SCOPE_MODE_CONTEXT_VALUES)[number];
}

export class ExchangeRiskPolicyLimitsDto {
  @IsString()
  @MinLength(1)
  maxExposureLabel!: string;

  @IsString()
  @MinLength(1)
  maxOrderNotionalLabel!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PublishExchangeRiskPolicyBodyDto {
  @ValidateNested()
  @Type(() => ExchangeRiskPolicyLimitsDto)
  limits!: ExchangeRiskPolicyLimitsDto;
}

export class BindTradingAccountBodyDto {
  @IsString()
  @MinLength(1)
  tradingAccountId!: string;
}

export class SetAdapterBindingContextBodyDto {
  @IsString()
  @MinLength(1)
  adapterIdentity!: string;

  @IsOptional()
  @IsIn(EXCHANGE_SCOPE_MODE_CONTEXT_VALUES)
  modeContext?: (typeof EXCHANGE_SCOPE_MODE_CONTEXT_VALUES)[number];
}

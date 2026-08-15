import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { STRATEGY_TIMEFRAMES } from '../../modules/strategies/strategy';

export class CreateStrategyDeploymentBodyDto {
  @IsString()
  @MinLength(1)
  strategyId!: string;

  @IsString()
  @MinLength(1)
  strategyVersion!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  experimentId?: string;

  /** Optional Library identity. Gate consumes Lookup; Deployment does not own Library. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  libraryEntryId?: string;

  @IsObject()
  parameters!: Record<string, unknown>;

  @IsString()
  @Matches(/^[A-Za-z0-9]{3,32}$/)
  instrument!: string;

  @IsString()
  @IsIn([...STRATEGY_TIMEFRAMES])
  timeframe!: string;

  @IsString()
  @MinLength(1)
  marketDataSourceId!: string;

  @IsString()
  @MinLength(1)
  paperExecutionConfigurationId!: string;

  @IsString()
  @MinLength(1)
  riskPolicyId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  riskPolicyVersion!: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class StrategyDeploymentIdParamDto {
  @IsString()
  @MinLength(1)
  id!: string;
}

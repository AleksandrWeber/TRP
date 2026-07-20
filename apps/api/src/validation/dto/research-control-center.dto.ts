import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ENGINEERING_SUITE_KINDS,
  RESEARCH_EXECUTION_KINDS,
} from '../../modules/research-control-center/research-execution-record';
import { OPTIMIZATION_CRITERIA_TYPES } from '../../modules/strategy-optimization';

export class StartResearchExecutionBodyDto {
  @IsIn([...RESEARCH_EXECUTION_KINDS])
  kind!: string;

  @IsOptional()
  @IsString()
  strategyId?: string;
}

export class OptimizationConfigurationDto {
  @IsString()
  configurationId!: string;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, number>;
}

export class StartOptimizationBodyDto {
  @IsOptional()
  @IsIn([...OPTIMIZATION_CRITERIA_TYPES])
  criterion?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptimizationConfigurationDto)
  configurations?: OptimizationConfigurationDto[];
}

export class StartAnalyticsBodyDto {
  @IsOptional()
  @IsString()
  analysisId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  executionCount?: number;
}

export class StartEngineeringBodyDto {
  @IsIn([...ENGINEERING_SUITE_KINDS])
  kind!: string;
}

export class UpdateResearchControlSettingsBodyDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  autoRefreshSeconds?: number;

  @IsOptional()
  @IsString()
  defaultStrategyId?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(500)
  maxListedExecutions?: number;
}

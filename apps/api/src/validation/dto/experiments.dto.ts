import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import type { StrategyParams } from '@trp/research';

/**
 * Experiment run body DTO (US113).
 */
export class RunExperimentBodyDto {
  @IsString()
  @MinLength(1)
  datasetId!: string;

  @IsOptional()
  @IsString()
  strategyId?: string;

  @IsOptional()
  @IsObject()
  params?: StrategyParams;
}

import { IsArray, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import type { StrategyParams } from '@trp/research';

/**
 * Shared "run campaign" body DTO (US113).
 * Required-field / non-empty-array business rules remain manual BadRequestException
 * checks in the controllers (ValidationPipe only enforces shape here).
 */
export class RunCampaignBodyDto {
  @IsOptional()
  @IsString()
  datasetId?: string;

  @IsOptional()
  @IsString()
  strategyId?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  paramsList?: StrategyParams[];
}

/**
 * Multi-dataset "run campaign" body DTO (US113).
 */
export class RunMultiCampaignBodyDto {
  @IsOptional()
  @IsString()
  strategyId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  datasets?: string[];

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  paramsList?: StrategyParams[];
}

/**
 * Walk-forward "run campaign" body DTO (US113).
 */
export class RunWalkForwardCampaignBodyDto extends RunCampaignBodyDto {
  @IsOptional()
  @IsNumber()
  datasetLength?: number;

  @IsOptional()
  @IsNumber()
  windowSize?: number;

  @IsOptional()
  @IsNumber()
  stepSize?: number;
}

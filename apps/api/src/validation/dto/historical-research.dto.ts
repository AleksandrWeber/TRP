import { IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { MARKET_REGIMES } from '../../modules/datasets/dataset-metadata';

export class RunHistoricalResearchBodyDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  datasetIds?: string[];

  @IsOptional()
  @IsBoolean()
  allDatasets?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strategyIds?: string[];
}

export class ListHistoricalResearchResultsQueryDto {
  @IsOptional()
  @IsString()
  strategyId?: string;

  @IsOptional()
  @IsString()
  datasetId?: string;

  @IsOptional()
  @IsIn(MARKET_REGIMES)
  marketRegime?: string;
}

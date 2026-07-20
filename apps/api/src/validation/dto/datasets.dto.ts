import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { MARKET_REGIMES } from '../../modules/datasets/dataset-metadata';

/**
 * Binance dataset import body DTO (US113).
 */
export class ImportBinanceBodyDto {
  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsString()
  interval?: string;

  @IsOptional()
  @IsString()
  timeframe?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  startTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  endTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(MARKET_REGIMES)
  marketRegime?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateDatasetBodyDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(MARKET_REGIMES)
  marketRegime?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

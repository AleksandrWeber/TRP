import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

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
}

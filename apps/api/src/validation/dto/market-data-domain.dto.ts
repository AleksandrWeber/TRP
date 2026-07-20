import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min, MinLength } from 'class-validator';

const MARKET_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

/**
 * Market Data Domain `:symbol` path param (US006).
 */
export class MarketSymbolParamDto {
  @IsString()
  @MinLength(1)
  @Matches(/^[A-Z0-9]+$/)
  symbol!: string;
}

/**
 * Market Data Domain candles query (US006).
 */
export class MarketCandlesQueryDto {
  @IsString()
  @MinLength(1)
  @Matches(/^[A-Z0-9]+$/)
  symbol!: string;

  @IsIn(MARKET_TIMEFRAMES)
  timeframe!: (typeof MARKET_TIMEFRAMES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}

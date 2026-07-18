import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const STRATEGY_STATUSES = ['draft', 'active', 'archived'] as const;
const STRATEGY_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
const STRATEGY_DIRECTIONS = ['LONG', 'SHORT', 'BOTH'] as const;

/**
 * Strategy creation body DTO (US004/US005).
 */
export class CreateStrategyBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(1)
  @Matches(/^[A-Z0-9]+$/)
  tradingPair!: string;

  @IsIn(STRATEGY_TIMEFRAMES)
  timeframe!: (typeof STRATEGY_TIMEFRAMES)[number];

  @IsIn(STRATEGY_DIRECTIONS)
  direction!: (typeof STRATEGY_DIRECTIONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsIn(STRATEGY_STATUSES)
  status?: (typeof STRATEGY_STATUSES)[number];

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  positionSize?: number;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(100)
  stopLossPercent?: number;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(100)
  takeProfitPercent?: number;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>;
}

/**
 * Strategy partial-update body DTO (US004/US005).
 */
export class UpdateStrategyBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @Matches(/^[A-Z0-9]+$/)
  tradingPair?: string;

  @IsOptional()
  @IsIn(STRATEGY_TIMEFRAMES)
  timeframe?: (typeof STRATEGY_TIMEFRAMES)[number];

  @IsOptional()
  @IsIn(STRATEGY_DIRECTIONS)
  direction?: (typeof STRATEGY_DIRECTIONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsIn(STRATEGY_STATUSES)
  status?: (typeof STRATEGY_STATUSES)[number];

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsPositive()
  positionSize?: number;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(100)
  stopLossPercent?: number;

  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  @Max(100)
  takeProfitPercent?: number;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>;
}

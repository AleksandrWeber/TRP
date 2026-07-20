import { Type } from 'class-transformer';
import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

/**
 * POST /v1/evaluation-schedules body (US015).
 * Bounds mirror MIN/MAX_EVALUATION_INTERVAL_MS in the scheduler domain.
 */
export class CreateEvaluationScheduleBodyDto {
  @IsString()
  @MinLength(1)
  strategyId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1_000)
  @Max(86_400_000)
  intervalMs!: number;
}

/**
 * Path param for routes using `:strategyId` (US015).
 */
export class StrategyIdParamDto {
  @IsString()
  @MinLength(1)
  strategyId!: string;
}

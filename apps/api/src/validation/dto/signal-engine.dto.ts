import { IsString, MinLength } from 'class-validator';

/**
 * Signal Engine evaluate body (US009): POST /v1/market/signal/evaluate.
 */
export class EvaluateSignalBodyDto {
  @IsString()
  @MinLength(1)
  strategyId!: string;
}

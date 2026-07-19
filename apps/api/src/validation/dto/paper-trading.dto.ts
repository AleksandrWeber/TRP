import { IsString, MinLength } from 'class-validator';

/** POST /v1/paper-trading/execute body (US010). */
export class ExecutePaperTradeBodyDto {
  @IsString()
  @MinLength(1)
  strategyId!: string;
}

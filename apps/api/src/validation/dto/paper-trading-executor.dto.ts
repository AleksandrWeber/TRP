import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * GET /v1/paper-executor/trades query (US016).
 * Optional strategy filter over the workspace trade history.
 */
export class ListExecutorTradesQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  strategyId?: string;
}

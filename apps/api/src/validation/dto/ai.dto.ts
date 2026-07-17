import { Type } from 'class-transformer';
import { IsIn, IsInt, IsObject, IsOptional, Min } from 'class-validator';
import type { AiTask } from '../../modules/ai/ai.types';

const AI_TASKS: readonly AiTask[] = [
  'research_summary',
  'validation_explanation',
  'strategy_explanation',
  'market_summary',
  'report_generation',
];

/**
 * AI execute body DTO (US113).
 */
export class ExecuteAiBodyDto {
  @IsIn(AI_TASKS)
  task!: AiTask;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}

/**
 * AI logs list query DTO (US113).
 */
export class ListAiLogsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

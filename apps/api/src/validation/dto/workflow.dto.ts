import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Workflow start body DTO (US113).
 */
export class StartWorkflowBodyDto {
  @IsString()
  @MinLength(1)
  type!: string;

  @IsOptional()
  @IsString()
  datasetId?: string;

  @IsOptional()
  @IsBoolean()
  approveNeedsReview?: boolean;
}

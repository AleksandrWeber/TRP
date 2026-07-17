import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Production deployment body DTO (US113).
 */
export class DeployBodyDto {
  @IsString()
  @MinLength(1)
  experimentId!: string;

  @IsOptional()
  @IsBoolean()
  approve?: boolean;
}

/**
 * Production executions list query DTO (US113).
 */
export class ListExecutionsQueryDto {
  @IsOptional()
  @IsString()
  deploymentId?: string;
}

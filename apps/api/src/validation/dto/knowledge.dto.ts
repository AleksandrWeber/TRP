import { IsArray, IsEmail, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Knowledge list query DTO (US113).
 */
export class ListKnowledgeQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  experimentId?: string;
}

/**
 * Knowledge creation body DTO (US113).
 */
export class CreateKnowledgeBodyDto {
  @IsString()
  @MinLength(1)
  type!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsString()
  @MinLength(1)
  category!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsString()
  @MinLength(1)
  validationStatus!: string;

  @IsOptional()
  @IsString()
  workflowId?: string;

  @IsOptional()
  @IsString()
  experimentId?: string;

  @IsOptional()
  @IsEmail()
  authorEmail?: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  parentId?: string;
}

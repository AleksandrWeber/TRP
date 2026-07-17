import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export enum ApiSortOrderDto {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Shared pagination / sorting query DTO (US113).
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  sortBy?: string;

  @IsOptional()
  @IsEnum(ApiSortOrderDto)
  sortOrder?: ApiSortOrderDto;
}

/**
 * Shared UUID path param (US113).
 */
export class UuidParamDto {
  @IsUUID('4')
  id!: string;
}

/**
 * Shared non-empty string id param (jobs / sessions may not be UUID).
 */
export class IdParamDto {
  @IsString()
  @MinLength(1)
  id!: string;
}

/**
 * Path param for routes using `:sessionId` (US113).
 */
export class SessionIdParamDto {
  @IsString()
  @MinLength(1)
  sessionId!: string;
}

/**
 * Path param for routes using `:jobId` (US113).
 */
export class JobIdParamDto {
  @IsString()
  @MinLength(1)
  jobId!: string;
}

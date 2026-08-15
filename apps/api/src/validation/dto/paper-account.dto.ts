import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * PC-13 — transport for existing PaperAccountService.create.
 * Paper mode only. Not a Paper Account redesign.
 */
export class CreatePaperAccountBodyDto {
  @IsString()
  @MinLength(3)
  @MaxLength(12)
  @Matches(/^[A-Za-z0-9]+$/)
  currency!: string;

  @IsString()
  @MinLength(1)
  openingCapital!: string;

  @IsIn(['paper'])
  mode!: 'paper';

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  idempotencyKey?: string;
}

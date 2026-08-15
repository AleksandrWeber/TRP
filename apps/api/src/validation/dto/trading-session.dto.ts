import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * PC-13 / PC-15 15-a — transport for existing TradingSessionService.create.
 * Optional sessionHandoffIntentId is consumed by Trading Session (via product-flow).
 * Strategy-origin paper sessions only. Not a Session redesign. Not a new REST resource.
 */
export class CreateTradingSessionBodyDto {
  @IsString()
  @MinLength(1)
  paperAccountId!: string;

  @IsString()
  @MinLength(1)
  deploymentId!: string;

  @IsIn(['strategy'])
  origin!: 'strategy';

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  sessionHandoffIntentId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  idempotencyKey?: string;
}

export class TradingSessionIdParamDto {
  @IsString()
  @MinLength(1)
  id!: string;
}

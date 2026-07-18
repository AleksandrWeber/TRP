import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { OrderSide, OrderType } from '../../modules/orders/domain/order-intent';

const DECIMAL_STRING = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;

export class OrderMarketCheckpointDto {
  @IsString()
  @MinLength(1)
  streamId!: string;

  @IsInt()
  @Min(0)
  sequence!: number;

  @IsString()
  @MinLength(1)
  eventId!: string;
}

export class CreateOrderBodyDto {
  @IsString()
  @MinLength(1)
  clientOrderId!: string;

  @IsString()
  @MinLength(1)
  paperAccountId!: string;

  @IsString()
  @MinLength(1)
  tradingSessionId!: string;

  @IsInt()
  @Min(1)
  sessionFencingToken!: number;

  @IsString()
  @MinLength(1)
  instrument!: string;

  @IsEnum(OrderSide)
  side!: OrderSide;

  @IsEnum(OrderType)
  type!: OrderType;

  @IsString()
  @Matches(DECIMAL_STRING)
  quantity!: string;

  @IsOptional()
  @IsString()
  @Matches(DECIMAL_STRING)
  limitPrice?: string;

  @IsBoolean()
  reduceOnly!: boolean;

  @ValidateNested()
  @Type(() => OrderMarketCheckpointDto)
  marketCheckpoint!: OrderMarketCheckpointDto;
}

import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export const NOTIFICATION_TYPE_VALUES = [
  'daily-report',
  'weekly-report',
  'monthly-report',
  'session-finished',
  'strategy-certified',
  'strategy-deprecated',
  'runtime-validation-failed',
  'emergency-stop',
  'kill-switch-activated',
  'critical-platform-error',
  'order-events',
  'fill-events',
  'debug-events',
] as const;

export const NOTIFICATION_CHANNEL_VALUES = [
  'telegram',
  'email',
  'slack',
  'discord',
  'teams',
  'push',
] as const;

export const DELIVERY_OUTCOME_VALUES = ['delivered', 'skipped', 'failed'] as const;

const HHMM = /^\d{2}:\d{2}$/;

/**
 * PC-06 — query transport for existing NotificationServicePort.listDeliveries.
 * workspaceId is taken from X-Workspace-Id, never from this query.
 */
export class ListNotificationDeliveriesQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  userId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  reportRunId?: string;

  @IsOptional()
  @IsIn(NOTIFICATION_TYPE_VALUES)
  type?: (typeof NOTIFICATION_TYPE_VALUES)[number];

  @IsOptional()
  @IsIn(DELIVERY_OUTCOME_VALUES)
  outcome?: (typeof DELIVERY_OUTCOME_VALUES)[number];

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class DeliveryIdParamDto {
  @IsString()
  @MinLength(1)
  deliveryId!: string;
}

export class NotificationChannelIdParamDto {
  @IsIn(NOTIFICATION_CHANNEL_VALUES)
  channelId!: (typeof NOTIFICATION_CHANNEL_VALUES)[number];
}

export class QuietHoursDto {
  @Matches(HHMM)
  start!: string;

  @Matches(HHMM)
  end!: string;
}

export class NotificationSchedulePatchDto {
  @IsOptional()
  @Matches(HHMM)
  dailyDeliveryTime?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  timezone?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @ValidateNested()
  @Type(() => QuietHoursDto)
  quietHours?: QuietHoursDto | null;

  @IsOptional()
  @IsBoolean()
  criticalBypassQuietHours?: boolean;
}

export class ChannelEnablementPatchDto {
  @IsOptional()
  @IsBoolean()
  telegram?: boolean;

  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @IsBoolean()
  slack?: boolean;

  @IsOptional()
  @IsBoolean()
  discord?: boolean;

  @IsOptional()
  @IsBoolean()
  teams?: boolean;

  @IsOptional()
  @IsBoolean()
  push?: boolean;
}

export class TypeDeliveryPreferencePatchDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsIn(NOTIFICATION_CHANNEL_VALUES, { each: true })
  channels?: (typeof NOTIFICATION_CHANNEL_VALUES)[number][];

  @IsOptional()
  @IsBoolean()
  critical?: boolean;
}

export class TypeRoutingPatchDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'daily-report'?: TypeDeliveryPreferencePatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'weekly-report'?: TypeDeliveryPreferencePatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'monthly-report'?: TypeDeliveryPreferencePatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'session-finished'?: TypeDeliveryPreferencePatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'strategy-certified'?: TypeDeliveryPreferencePatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'strategy-deprecated'?: TypeDeliveryPreferencePatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'runtime-validation-failed'?: TypeDeliveryPreferencePatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'emergency-stop'?: TypeDeliveryPreferencePatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'kill-switch-activated'?: TypeDeliveryPreferencePatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'critical-platform-error'?: TypeDeliveryPreferencePatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'order-events'?: TypeDeliveryPreferencePatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'fill-events'?: TypeDeliveryPreferencePatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeDeliveryPreferencePatchDto)
  'debug-events'?: TypeDeliveryPreferencePatchDto;
}

/**
 * PC-06 — body transport for existing NotificationServicePort.upsertPreferences.
 * Does not send, connect Telegram, or activate reserved channels.
 */
export class UpsertNotificationPreferencesBodyDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChannelEnablementPatchDto)
  channels?: ChannelEnablementPatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypeRoutingPatchDto)
  typeRouting?: TypeRoutingPatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSchedulePatchDto)
  schedule?: NotificationSchedulePatchDto;
}

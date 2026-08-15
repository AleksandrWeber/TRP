import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
  DeliveryIdParamDto,
  ListNotificationDeliveriesQueryDto,
  NotificationChannelIdParamDto,
  UpsertNotificationPreferencesBodyDto,
} from './notification.dto';

describe('Notification DTOs (PC-06)', () => {
  it('accepts existing delivery filters and preference patches', () => {
    const query = Object.assign(new ListNotificationDeliveriesQueryDto(), {
      type: 'daily-report',
      outcome: 'skipped',
      q: 'telegram',
      limit: 20,
    });
    expect(validateSync(query)).toHaveLength(0);

    const body = plainToInstance(UpsertNotificationPreferencesBodyDto, {
      enabled: false,
      schedule: { timezone: 'UTC', dailyDeliveryTime: '09:00' },
    });
    expect(validateSync(body)).toHaveLength(0);
  });

  it('rejects unknown types, outcomes, and malformed times', () => {
    expect(
      validateSync(Object.assign(new ListNotificationDeliveriesQueryDto(), { type: 'pnl' })).length,
    ).toBeGreaterThan(0);
    expect(
      validateSync(Object.assign(new ListNotificationDeliveriesQueryDto(), { outcome: 'queued' }))
        .length,
    ).toBeGreaterThan(0);
    const body = plainToInstance(UpsertNotificationPreferencesBodyDto, {
      schedule: { dailyDeliveryTime: '9am' },
    });
    expect(validateSync(body).length).toBeGreaterThan(0);
  });

  it('requires delivery ids and rejects an oversized limit', () => {
    expect(validateSync(new DeliveryIdParamDto()).length).toBeGreaterThan(0);
    expect(
      validateSync(Object.assign(new DeliveryIdParamDto(), { deliveryId: 'del-1' })),
    ).toHaveLength(0);
    expect(
      validateSync(Object.assign(new ListNotificationDeliveriesQueryDto(), { limit: 201 })).length,
    ).toBeGreaterThan(0);
  });

  it('accepts catalog channel ids and rejects unknown channels', () => {
    expect(
      validateSync(Object.assign(new NotificationChannelIdParamDto(), { channelId: 'telegram' })),
    ).toHaveLength(0);
    expect(
      validateSync(Object.assign(new NotificationChannelIdParamDto(), { channelId: 'email' })),
    ).toHaveLength(0);
    expect(
      validateSync(Object.assign(new NotificationChannelIdParamDto(), { channelId: 'sms' })).length,
    ).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from 'vitest';
import {
  NOTIFICATION_DELIVERY_AUTHORITY_CLASS,
  NOTIFICATION_DELIVERY_BOUNDARY,
  NOTIFICATION_DELIVERY_FORBIDDEN_CAPABILITIES,
  NOTIFICATION_DELIVERY_MODULE_ID,
  isNotificationDeliveryForbiddenCapability,
  notificationDeliveryControlsRuntime,
  notificationDeliveryGeneratesReports,
  notificationDeliveryIsSourceOfTruth,
  notificationDeliveryIsTelegramControlPlane,
  notificationDeliveryTalksToStrategyLibrary,
} from './notification-boundary';

describe('RC-24 Epic 6 — Notification Delivery boundary', () => {
  it('exposes immutable notification-projection boundary', () => {
    expect(Object.isFrozen(NOTIFICATION_DELIVERY_BOUNDARY)).toBe(true);
    expect(NOTIFICATION_DELIVERY_BOUNDARY.moduleId).toBe(NOTIFICATION_DELIVERY_MODULE_ID);
    expect(NOTIFICATION_DELIVERY_BOUNDARY.authorityClass).toBe(
      NOTIFICATION_DELIVERY_AUTHORITY_CLASS,
    );
    expect(NOTIFICATION_DELIVERY_BOUNDARY.sourceOfTruth).toBe(false);
    expect(NOTIFICATION_DELIVERY_BOUNDARY.activePorts.telegramChannel).toBe(true);
    expect(NOTIFICATION_DELIVERY_BOUNDARY.activePorts.emailChannel).toBe(false);
    expect(NOTIFICATION_DELIVERY_BOUNDARY.activePorts.rest).toBe(false);
  });

  it('forbids control-plane and report-generation capabilities', () => {
    expect(NOTIFICATION_DELIVERY_FORBIDDEN_CAPABILITIES).toEqual(
      expect.arrayContaining([
        'generate-reports',
        'telegram-trading-commands',
        'telegram-control-plane',
        'control-runtime',
        'pause-trading',
        'manage-strategy-library',
      ]),
    );
    expect(isNotificationDeliveryForbiddenCapability('telegram-control-plane')).toBe(true);
  });

  it('never becomes SoT, never generates reports, never controls runtime', () => {
    expect(notificationDeliveryIsSourceOfTruth()).toBe(false);
    expect(notificationDeliveryGeneratesReports()).toBe(false);
    expect(notificationDeliveryControlsRuntime()).toBe(false);
    expect(notificationDeliveryTalksToStrategyLibrary()).toBe(false);
    expect(notificationDeliveryIsTelegramControlPlane()).toBe(false);
  });
});

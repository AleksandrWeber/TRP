/**
 * RC-24 Epic 6 — Nest facade for Notification Delivery boundary invariants.
 */

import { Injectable } from '@nestjs/common';
import {
  NOTIFICATION_DELIVERY_BOUNDARY,
  notificationDeliveryControlsRuntime,
  notificationDeliveryGeneratesReports,
  notificationDeliveryIsSourceOfTruth,
  notificationDeliveryIsTelegramControlPlane,
  notificationDeliveryTalksToStrategyLibrary,
  type NotificationDeliveryBoundary,
} from './domain/notification-boundary';

@Injectable()
export class NotificationDeliveryBoundaryService {
  getBoundary(): NotificationDeliveryBoundary {
    return NOTIFICATION_DELIVERY_BOUNDARY;
  }

  isSourceOfTruth(): false {
    return notificationDeliveryIsSourceOfTruth();
  }

  generatesReports(): false {
    return notificationDeliveryGeneratesReports();
  }

  controlsRuntime(): false {
    return notificationDeliveryControlsRuntime();
  }

  talksToStrategyLibrary(): false {
    return notificationDeliveryTalksToStrategyLibrary();
  }

  isTelegramControlPlane(): false {
    return notificationDeliveryIsTelegramControlPlane();
  }
}

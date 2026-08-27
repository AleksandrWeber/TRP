export {
  NOTIFICATION_DELIVERY_AUTHORITY_CLASS,
  NOTIFICATION_DELIVERY_BOUNDARY,
  NOTIFICATION_DELIVERY_DISTINCT_FROM,
  NOTIFICATION_DELIVERY_FORBIDDEN_CAPABILITIES,
  NOTIFICATION_DELIVERY_MODULE_ID,
  NOTIFICATION_DELIVERY_NON_OWNED,
  NOTIFICATION_DELIVERY_OWNED_CONCERNS,
  isNotificationDeliveryForbiddenCapability,
  notificationDeliveryControlsRuntime,
  notificationDeliveryGeneratesReports,
  notificationDeliveryIsSourceOfTruth,
  notificationDeliveryIsTelegramControlPlane,
  notificationDeliveryTalksToStrategyLibrary,
  type NotificationDeliveryBoundary,
  type NotificationDeliveryForbiddenCapability,
  type NotificationDeliveryOwnedConcern,
} from './domain/notification-boundary';
export {
  ACTIVE_NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_CATALOG,
  NOTIFICATION_CHANNELS,
  RESERVED_NOTIFICATION_CHANNELS,
  channelStatus,
  isActiveNotificationChannel,
  isNotificationChannelId,
  type ActiveNotificationChannelId,
  type NotificationChannelDescriptor,
  type NotificationChannelId,
  type NotificationChannelStatus,
  type ReservedNotificationChannelId,
} from './domain/notification-channel';
export {
  CRITICAL_NOTIFICATION_TYPES,
  NOTIFICATION_TYPES,
  OPTIONAL_NOTIFICATION_TYPES,
  defaultEnabledForType,
  isCriticalNotificationType,
  isNotificationType,
  isOptionalNotificationType,
  type CriticalNotificationType,
  type NotificationType,
  type OptionalNotificationType,
} from './domain/notification-type';
export {
  TELEGRAM_CONNECTION_STATUSES,
  bindTelegramChat,
  createPendingTelegramConnection,
  disconnectTelegramConnection,
  notConnectedTelegram,
  type CreatePendingTelegramConnectionInput,
  type TelegramConnection,
  type TelegramConnectionStatus,
} from './domain/telegram-connection';
export {
  createUserNotificationPreferences,
  type ChannelEnablement,
  type CreateUserNotificationPreferencesInput,
  type NotificationSchedulePreferences,
  type QuietHours,
  type TypeDeliveryPreference,
  type UserNotificationPreferences,
} from './domain/user-notification-preferences';
export {
  DELIVERY_OUTCOMES,
  DELIVERY_SKIP_REASONS,
  createDeliveryResult,
  type ChannelDeliveryAttempt,
  type DeliverNotificationCommand,
  type DeliveryOutcome,
  type DeliveryResult,
  type DeliverySkipReason,
} from './domain/delivery';
export {
  NOTIFICATION_QUEUE_OPEN_STATUSES,
  NOTIFICATION_QUEUE_STATUSES,
  createPendingNotificationQueueItem,
  isNotificationQueueStatus,
  isOpenNotificationQueueStatus,
  queueItemToDeliverCommand,
  withNotificationQueueStatus,
  type NotificationDeliveryQueueItem,
  type NotificationQueueOpenStatus,
  type NotificationQueueStatus,
} from './domain/delivery-queue';
export {
  extractLocalTimeHHmm,
  isWithinQuietHours,
  resolveCritical,
  resolveDeliveryRoutes,
} from './routing/resolve-delivery-routing';
export { InMemoryNotificationStore } from './adapters/in-memory-notification-store';
export { InMemoryTelegramAdapter } from './adapters/in-memory-telegram.adapter';
export { ReservedInactiveChannelAdapter } from './adapters/reserved-inactive-channel.adapter';
export { NotificationDeliveryBoundaryService } from './notification-boundary.service';
export { NotificationDeliveryService } from './notification-delivery.service';
export { NotificationDeliveryModule } from './notification-delivery.module';
export {
  NOTIFICATION_PORTS_ACTIVE,
  NOTIFICATION_SERVICE_PORT,
  TELEGRAM_CHANNEL_ADAPTER,
  type NotificationChannelPort,
  type NotificationServicePort,
  type ListDeliveriesQuery,
  type SendTestNotificationRequest,
  type TelegramConnectRequest,
  type TelegramConnectResult,
  type TelegramDisconnectRequest,
  type TelegramVerifyRequest,
  type UpsertNotificationPreferences,
} from './ports/notification.port';

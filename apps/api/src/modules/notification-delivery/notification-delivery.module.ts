import { Module } from '@nestjs/common';
import { createRepositoryByDriver } from '../../persistence/create-repository-by-driver';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { DurableNotificationStore } from './adapters/durable-notification-store';
import { InMemoryNotificationStore } from './adapters/in-memory-notification-store';
import { InMemoryTelegramAdapter } from './adapters/in-memory-telegram.adapter';
import { TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY } from './domain/telegram-notification-anchor.repository';
import { EMAIL_NOTIFICATION_ANCHOR_REPOSITORY } from './domain/email-notification-anchor.repository';
import { SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_REPOSITORY } from './domain/slack-discord-teams-notification-anchor.repository';
import { PUSH_NOTIFICATION_ANCHOR_REPOSITORY } from './domain/push-notification-anchor.repository';
import { NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_REPOSITORY } from './domain/notification-platform-integration-anchor.repository';
import { NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_REPOSITORY } from './domain/notification-platform-delivery-anchor.repository';
import { NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_REPOSITORY } from './domain/notification-platform-dispatch-anchor.repository';
import { NOTIFICATION_PLATFORM_QUEUE_ANCHOR_REPOSITORY } from './domain/notification-platform-queue-anchor.repository';
import { NOTIFICATION_PLATFORM_WORKERS_ANCHOR_REPOSITORY } from './domain/notification-platform-workers-anchor.repository';
import { NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_REPOSITORY } from './domain/notification-platform-worker-execution-anchor.repository';
import { NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_REPOSITORY } from './domain/notification-platform-worker-runtime-anchor.repository';
import { NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_REPOSITORY } from './domain/notification-platform-scheduler-anchor.repository';
import { NOTIFICATION_PLATFORM_RETRY_ANCHOR_REPOSITORY } from './domain/notification-platform-retry-anchor.repository';
import { NotificationDeliveryBoundaryService } from './notification-boundary.service';
import { NotificationDeliveryService } from './notification-delivery.service';
import { PrismaEmailNotificationAnchorRepository } from './persistence/prisma-email-notification-anchor.repository';
import { PrismaSlackDiscordTeamsNotificationAnchorRepository } from './persistence/prisma-slack-discord-teams-notification-anchor.repository';
import { PrismaPushNotificationAnchorRepository } from './persistence/prisma-push-notification-anchor.repository';
import { PrismaNotificationPlatformIntegrationAnchorRepository } from './persistence/prisma-notification-platform-integration-anchor.repository';
import { PrismaNotificationPlatformDeliveryAnchorRepository } from './persistence/prisma-notification-platform-delivery-anchor.repository';
import { PrismaNotificationPlatformDispatchAnchorRepository } from './persistence/prisma-notification-platform-dispatch-anchor.repository';
import { PrismaNotificationPlatformQueueAnchorRepository } from './persistence/prisma-notification-platform-queue-anchor.repository';
import { PrismaNotificationPlatformWorkersAnchorRepository } from './persistence/prisma-notification-platform-workers-anchor.repository';
import { PrismaNotificationPlatformWorkerExecutionAnchorRepository } from './persistence/prisma-notification-platform-worker-execution-anchor.repository';
import { PrismaNotificationPlatformWorkerRuntimeAnchorRepository } from './persistence/prisma-notification-platform-worker-runtime-anchor.repository';
import { PrismaNotificationPlatformSchedulerAnchorRepository } from './persistence/prisma-notification-platform-scheduler-anchor.repository';
import { PrismaNotificationPlatformRetryAnchorRepository } from './persistence/prisma-notification-platform-retry-anchor.repository';
import { PrismaTelegramNotificationAnchorRepository } from './persistence/prisma-telegram-notification-anchor.repository';
import { NOTIFICATION_SERVICE_PORT, TELEGRAM_CHANNEL_ADAPTER } from './ports/notification.port';
import { EmailNotificationPersistenceService } from './email-notification-persistence.service';
import { SlackDiscordTeamsNotificationPersistenceService } from './slack-discord-teams-notification-persistence.service';
import { SlackDiscordTeamsNotificationRecoveryStore } from './slack-discord-teams-notification-recovery-store';
import { SlackDiscordTeamsNotificationRestartRecoveryService } from './slack-discord-teams-notification-restart-recovery.service';
import { PushNotificationPersistenceService } from './push-notification-persistence.service';
import { NotificationPlatformIntegrationPersistenceService } from './notification-platform-integration-persistence.service';
import { NotificationPlatformDeliveryPersistenceService } from './notification-platform-delivery-persistence.service';
import { NotificationPlatformDispatchPersistenceService } from './notification-platform-dispatch-persistence.service';
import { NotificationPlatformQueuePersistenceService } from './notification-platform-queue-persistence.service';
import { NotificationPlatformWorkersPersistenceService } from './notification-platform-workers-persistence.service';
import { NotificationPlatformWorkerExecutionPersistenceService } from './notification-platform-worker-execution-persistence.service';
import { NotificationPlatformWorkerRuntimePersistenceService } from './notification-platform-worker-runtime-persistence.service';
import { NotificationPlatformSchedulerPersistenceService } from './notification-platform-scheduler-persistence.service';
import { NotificationPlatformRetryPersistenceService } from './notification-platform-retry-persistence.service';
import { NotificationPlatformSchedulerRecoveryStore } from './domain/notification-platform-scheduler-recovery-store';
import { NotificationPlatformSchedulerRestartRecoveryService } from './domain/notification-platform-scheduler-restart-recovery.service';
import { NotificationPlatformWorkerRuntimeRecoveryStore } from './notification-platform-worker-runtime-recovery-store';
import { NotificationPlatformWorkerRuntimeRestartRecoveryService } from './notification-platform-worker-runtime-restart-recovery.service';
import { NotificationPlatformWorkerExecutionRecoveryStore } from './notification-platform-worker-execution-recovery-store';
import { NotificationPlatformWorkerExecutionRestartRecoveryService } from './notification-platform-worker-execution-restart-recovery.service';
import { NotificationPlatformWorkersRecoveryStore } from './notification-platform-workers-recovery-store';
import { NotificationPlatformWorkersRestartRecoveryService } from './notification-platform-workers-restart-recovery.service';
import { NotificationPlatformQueueRecoveryStore } from './notification-platform-queue-recovery-store';
import { NotificationPlatformQueueRestartRecoveryService } from './notification-platform-queue-restart-recovery.service';
import { NotificationPlatformDispatchRecoveryStore } from './notification-platform-dispatch-recovery-store';
import { NotificationPlatformDispatchRestartRecoveryService } from './notification-platform-dispatch-restart-recovery.service';
import { NotificationPlatformDeliveryRecoveryStore } from './notification-platform-delivery-recovery-store';
import { NotificationPlatformDeliveryRestartRecoveryService } from './notification-platform-delivery-restart-recovery.service';
import { NotificationPlatformIntegrationRecoveryStore } from './notification-platform-integration-recovery-store';
import { NotificationPlatformIntegrationRestartRecoveryService } from './notification-platform-integration-restart-recovery.service';
import { PushNotificationRecoveryStore } from './push-notification-recovery-store';
import { PushNotificationRestartRecoveryService } from './push-notification-restart-recovery.service';
import { EmailNotificationRecoveryStore } from './email-notification-recovery-store';
import { EmailNotificationRestartRecoveryService } from './email-notification-restart-recovery.service';
import { TelegramNotificationPersistenceService } from './telegram-notification-persistence.service';
import { TelegramNotificationRecoveryStore } from './telegram-notification-recovery-store';
import { TelegramNotificationRestartRecoveryService } from './telegram-notification-restart-recovery.service';

/**
 * RC-24 Epic 6 — Notification Delivery module.
 *
 * Delivery only through configured channels (Telegram active).
 * W3-O01-b / W3-O02-b: optional durable store snapshot via PERSISTENCE_DRIVER=prisma
 * (history + Notification Durable Queue work items on this owner only).
 * W5-N01-b: durable Telegram notification anchor persistence on this owner only.
 * W5-N01-c: deterministic restart recovery hydrate for canonical anchors on this owner only.
 * W5-N02-b: durable Email notification anchor persistence on this owner only.
 * W5-N02-c: deterministic restart recovery hydrate for canonical Email anchors on this owner only.
 * W5-N03-b: durable Slack / Discord / Teams notification anchor persistence on this owner only.
 * W5-N03-c: deterministic restart recovery hydrate for canonical Slack / Discord / Teams anchors on this owner only.
 * W5-N04-b: durable Push notification anchor persistence on this owner only.
 * W5-N04-c: deterministic restart recovery hydrate for canonical Push anchors on this owner only.
 * W5-N05-b: durable Notification Platform Integration anchor persistence on this owner only.
 * W5-N05-c: deterministic restart recovery hydrate for canonical platform integration anchors on this owner only.
 * W5-N06-b: durable Notification Platform Delivery anchor persistence on this owner only.
 * W5-N06-c: deterministic restart recovery hydrate for canonical platform delivery anchors on this owner only.
 * W5-N07-b: durable Notification Platform Dispatch anchor persistence on this owner only.
 * W5-N07-c: deterministic restart recovery hydrate for canonical platform dispatch anchors on this owner only.
 * W5-N08-b: durable Notification Platform Queue anchor persistence on this owner only.
 * W5-N08-c: deterministic restart recovery hydrate for canonical platform queue anchors on this owner only.
 * W5-N09-b: durable Notification Platform Workers anchor persistence on this owner only.
 * W5-N09-c: deterministic restart recovery hydrate for canonical platform workers anchors on this owner only.
 * W5-N10-b: durable Notification Platform Worker Execution anchor persistence on this owner only.
 * W5-N10-c: deterministic restart recovery hydrate for canonical platform worker execution anchors on this owner only.
 * W5-N11-b: durable Notification Platform Worker Runtime anchor persistence on this owner only.
 * W5-N11-c: deterministic restart recovery hydrate for canonical platform worker runtime anchors on this owner only.
 * Does not import Reporting / AI Analytics / Strategy Library / Runtime /
 * Trading Session / Orders / Ledger. Does not expose REST or trading commands.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    NotificationDeliveryBoundaryService,
    {
      provide: InMemoryNotificationStore,
      useFactory: async () =>
        createRepositoryByDriver({
          createMemory: () => new InMemoryNotificationStore(),
          createPrisma: (client) => new DurableNotificationStore(client),
          owner: 'notification-delivery',
        }),
    },
    {
      provide: TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaTelegramNotificationAnchorRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: EMAIL_NOTIFICATION_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaEmailNotificationAnchorRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaSlackDiscordTeamsNotificationAnchorRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: PUSH_NOTIFICATION_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaPushNotificationAnchorRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaNotificationPlatformIntegrationAnchorRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaNotificationPlatformDeliveryAnchorRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaNotificationPlatformDispatchAnchorRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: NOTIFICATION_PLATFORM_QUEUE_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaNotificationPlatformQueueAnchorRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: NOTIFICATION_PLATFORM_WORKERS_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaNotificationPlatformWorkersAnchorRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaNotificationPlatformWorkerExecutionAnchorRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaNotificationPlatformWorkerRuntimeAnchorRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: NOTIFICATION_PLATFORM_SCHEDULER_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaNotificationPlatformSchedulerAnchorRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: NOTIFICATION_PLATFORM_RETRY_ANCHOR_REPOSITORY,
      useFactory: (prisma: PrismaService) =>
        new PrismaNotificationPlatformRetryAnchorRepository(prisma),
      inject: [PrismaService],
    },
    TelegramNotificationRecoveryStore,
    TelegramNotificationRestartRecoveryService,
    TelegramNotificationPersistenceService,
    EmailNotificationPersistenceService,
    SlackDiscordTeamsNotificationPersistenceService,
    SlackDiscordTeamsNotificationRecoveryStore,
    SlackDiscordTeamsNotificationRestartRecoveryService,
    PushNotificationPersistenceService,
    PushNotificationRecoveryStore,
    PushNotificationRestartRecoveryService,
    NotificationPlatformIntegrationPersistenceService,
    NotificationPlatformDeliveryPersistenceService,
    NotificationPlatformDispatchPersistenceService,
    NotificationPlatformQueuePersistenceService,
    NotificationPlatformWorkersPersistenceService,
    NotificationPlatformWorkerExecutionPersistenceService,
    NotificationPlatformWorkerRuntimePersistenceService,
    NotificationPlatformSchedulerPersistenceService,
    NotificationPlatformRetryPersistenceService,
    NotificationPlatformSchedulerRecoveryStore,
    NotificationPlatformSchedulerRestartRecoveryService,
    NotificationPlatformWorkerRuntimeRecoveryStore,
    NotificationPlatformWorkerRuntimeRestartRecoveryService,
    NotificationPlatformWorkerExecutionRecoveryStore,
    NotificationPlatformWorkerExecutionRestartRecoveryService,
    NotificationPlatformWorkersRecoveryStore,
    NotificationPlatformWorkersRestartRecoveryService,
    NotificationPlatformQueueRecoveryStore,
    NotificationPlatformQueueRestartRecoveryService,
    NotificationPlatformDispatchRecoveryStore,
    NotificationPlatformDispatchRestartRecoveryService,
    NotificationPlatformDeliveryRecoveryStore,
    NotificationPlatformDeliveryRestartRecoveryService,
    NotificationPlatformIntegrationRecoveryStore,
    NotificationPlatformIntegrationRestartRecoveryService,
    EmailNotificationRecoveryStore,
    EmailNotificationRestartRecoveryService,
    InMemoryTelegramAdapter,
    {
      provide: TELEGRAM_CHANNEL_ADAPTER,
      useExisting: InMemoryTelegramAdapter,
    },
    NotificationDeliveryService,
    {
      provide: NOTIFICATION_SERVICE_PORT,
      useExisting: NotificationDeliveryService,
    },
  ],
  exports: [
    NotificationDeliveryBoundaryService,
    NotificationDeliveryService,
    InMemoryTelegramAdapter,
    NOTIFICATION_SERVICE_PORT,
    TELEGRAM_CHANNEL_ADAPTER,
    TELEGRAM_NOTIFICATION_ANCHOR_REPOSITORY,
    EMAIL_NOTIFICATION_ANCHOR_REPOSITORY,
    SLACK_DISCORD_TEAMS_NOTIFICATION_ANCHOR_REPOSITORY,
    PUSH_NOTIFICATION_ANCHOR_REPOSITORY,
    NOTIFICATION_PLATFORM_INTEGRATION_ANCHOR_REPOSITORY,
    NOTIFICATION_PLATFORM_DELIVERY_ANCHOR_REPOSITORY,
    NOTIFICATION_PLATFORM_DISPATCH_ANCHOR_REPOSITORY,
    NOTIFICATION_PLATFORM_QUEUE_ANCHOR_REPOSITORY,
    NOTIFICATION_PLATFORM_WORKERS_ANCHOR_REPOSITORY,
    NOTIFICATION_PLATFORM_WORKER_EXECUTION_ANCHOR_REPOSITORY,
    NOTIFICATION_PLATFORM_WORKER_RUNTIME_ANCHOR_REPOSITORY,
    TelegramNotificationRecoveryStore,
    TelegramNotificationRestartRecoveryService,
    TelegramNotificationPersistenceService,
    EmailNotificationPersistenceService,
    SlackDiscordTeamsNotificationPersistenceService,
    SlackDiscordTeamsNotificationRecoveryStore,
    SlackDiscordTeamsNotificationRestartRecoveryService,
    PushNotificationPersistenceService,
    PushNotificationRecoveryStore,
    PushNotificationRestartRecoveryService,
    NotificationPlatformIntegrationPersistenceService,
    NotificationPlatformDeliveryPersistenceService,
    NotificationPlatformDispatchPersistenceService,
    NotificationPlatformQueuePersistenceService,
    NotificationPlatformWorkersPersistenceService,
    NotificationPlatformWorkerExecutionPersistenceService,
    NotificationPlatformWorkerRuntimePersistenceService,
    NotificationPlatformSchedulerPersistenceService,
    NotificationPlatformRetryPersistenceService,
    NotificationPlatformSchedulerRecoveryStore,
    NotificationPlatformSchedulerRestartRecoveryService,
    NotificationPlatformWorkerRuntimeRecoveryStore,
    NotificationPlatformWorkerRuntimeRestartRecoveryService,
    NotificationPlatformWorkerExecutionRecoveryStore,
    NotificationPlatformWorkerExecutionRestartRecoveryService,
    NotificationPlatformWorkersRecoveryStore,
    NotificationPlatformWorkersRestartRecoveryService,
    NotificationPlatformQueueRecoveryStore,
    NotificationPlatformQueueRestartRecoveryService,
    NotificationPlatformDispatchRecoveryStore,
    NotificationPlatformDispatchRestartRecoveryService,
    NotificationPlatformDeliveryRecoveryStore,
    NotificationPlatformDeliveryRestartRecoveryService,
    NotificationPlatformIntegrationRecoveryStore,
    NotificationPlatformIntegrationRestartRecoveryService,
    EmailNotificationRecoveryStore,
    EmailNotificationRestartRecoveryService,
  ],
})
export class NotificationDeliveryModule {}

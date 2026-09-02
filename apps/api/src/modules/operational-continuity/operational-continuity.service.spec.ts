import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  evaluateOwnerOperationalStates,
  healthyOwnersContinueWhileOthersUnavailable,
} from './operational-readiness';
import { OperationalContinuityService } from './operational-continuity.service';
import { OperationalContinuityAudit } from './operational-continuity-audit';
import { resetAnalyticalOwnerBootOutcomes } from '../../persistence/analytical-owner-continuity-status';
import { resetMonitoringHealthContinuity } from '../../security-platform/monitoring-health/domain/monitoring-health-continuity-status';
import { resetKrakenExchangeConnectivityContinuity } from '../exchange-adapter/domain/kraken-exchange-connectivity-continuity-status';
import {
  recordVenuePermissionRecoveryStart,
  recordVenuePermissionRecoverySuccess,
  resetVenuePermissionContinuity,
} from '../exchange-adapter/domain/venue-permission-continuity-status';
import { buildVenuePermissionVerificationAnchorState } from '../exchange-adapter/domain/durable-venue-permission-verification-state';
import { buildVenuePermissionVerificationRecoveryDiagnostics } from '../exchange-adapter/domain/venue-permission-restart-recovery';
import {
  recordTelegramNotificationRecoveryStart,
  recordTelegramNotificationRecoverySuccess,
  resetTelegramNotificationContinuity,
} from '../notification-delivery/domain/telegram-notification-continuity-status';
import { buildTelegramNotificationAnchorState } from '../notification-delivery/domain/durable-telegram-notification-anchor';
import { buildTelegramNotificationRecoveryDiagnostics } from '../notification-delivery/domain/telegram-notification-restart-recovery';
import {
  recordEmailNotificationRecoveryStart,
  recordEmailNotificationRecoverySuccess,
  resetEmailNotificationContinuity,
} from '../notification-delivery/domain/email-notification-continuity-status';
import { buildEmailNotificationAnchorState } from '../notification-delivery/domain/durable-email-notification-anchor';
import { buildEmailNotificationRecoveryDiagnostics } from '../notification-delivery/domain/email-notification-restart-recovery';
import {
  recordSlackDiscordTeamsNotificationRecoveryStart,
  recordSlackDiscordTeamsNotificationRecoverySuccess,
  resetSlackDiscordTeamsNotificationContinuity,
} from '../notification-delivery/domain/slack-discord-teams-notification-continuity-status';
import { buildSlackDiscordTeamsNotificationAnchorState } from '../notification-delivery/domain/durable-slack-discord-teams-notification-anchor';
import { buildSlackDiscordTeamsNotificationRecoveryDiagnostics } from '../notification-delivery/domain/slack-discord-teams-notification-restart-recovery';
import {
  recordPushNotificationRecoveryStart,
  recordPushNotificationRecoverySuccess,
  resetPushNotificationContinuity,
} from '../notification-delivery/domain/push-notification-continuity-status';
import { buildPushNotificationAnchorState } from '../notification-delivery/domain/durable-push-notification-anchor';
import { buildPushNotificationRecoveryDiagnostics } from '../notification-delivery/domain/push-notification-restart-recovery';
import {
  recordNotificationPlatformIntegrationRecoveryStart,
  recordNotificationPlatformIntegrationRecoverySuccess,
  resetNotificationPlatformIntegrationContinuity,
} from '../notification-delivery/domain/notification-platform-integration-continuity-status';
import { buildNotificationPlatformIntegrationAnchorState } from '../notification-delivery/domain/durable-notification-platform-integration-anchor';
import { buildNotificationPlatformIntegrationRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-integration-restart-recovery';
import {
  recordNotificationPlatformDeliveryRecoveryStart,
  recordNotificationPlatformDeliveryRecoverySuccess,
  resetNotificationPlatformDeliveryContinuity,
} from '../notification-delivery/domain/notification-platform-delivery-continuity-status';
import { buildNotificationPlatformDeliveryAnchorState } from '../notification-delivery/domain/durable-notification-platform-delivery-anchor';
import { buildNotificationPlatformDeliveryRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-delivery-restart-recovery';
import {
  recordNotificationPlatformDispatchRecoveryStart,
  recordNotificationPlatformDispatchRecoverySuccess,
  resetNotificationPlatformDispatchContinuity,
} from '../notification-delivery/domain/notification-platform-dispatch-continuity-status';
import { buildNotificationPlatformDispatchAnchorState } from '../notification-delivery/domain/durable-notification-platform-dispatch-anchor';
import { buildNotificationPlatformDispatchRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-dispatch-restart-recovery';
import {
  recordNotificationPlatformQueueRecoveryStart,
  recordNotificationPlatformQueueRecoverySuccess,
  resetNotificationPlatformQueueContinuity,
} from '../notification-delivery/domain/notification-platform-queue-continuity-status';
import { buildNotificationPlatformQueueAnchorState } from '../notification-delivery/domain/durable-notification-platform-queue-anchor';
import { buildNotificationPlatformQueueRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-queue-restart-recovery';
import {
  recordNotificationPlatformWorkersRecoveryStart,
  recordNotificationPlatformWorkersRecoverySuccess,
  resetNotificationPlatformWorkersContinuity,
} from '../notification-delivery/domain/notification-platform-workers-continuity-status';
import { buildNotificationPlatformWorkersAnchorState } from '../notification-delivery/domain/durable-notification-platform-workers-anchor';
import { buildNotificationPlatformWorkersRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-workers-restart-recovery';
import {
  recordNotificationPlatformWorkerExecutionRecoveryStart,
  recordNotificationPlatformWorkerExecutionRecoverySuccess,
  resetNotificationPlatformWorkerExecutionContinuity,
} from '../notification-delivery/domain/notification-platform-worker-execution-continuity-status';
import { buildNotificationPlatformWorkerExecutionAnchorState } from '../notification-delivery/domain/durable-notification-platform-worker-execution-anchor';
import { buildNotificationPlatformWorkerExecutionRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-worker-execution-restart-recovery';
import {
  recordNotificationPlatformWorkerRuntimeRecoveryStart,
  recordNotificationPlatformWorkerRuntimeRecoverySuccess,
  resetNotificationPlatformWorkerRuntimeContinuity,
} from '../notification-delivery/domain/notification-platform-worker-runtime-continuity-status';
import { buildNotificationPlatformWorkerRuntimeAnchorState } from '../notification-delivery/domain/durable-notification-platform-worker-runtime-anchor';
import { buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-worker-runtime-restart-recovery';
import {
  recordNotificationPlatformSchedulerRecoveryStart,
  recordNotificationPlatformSchedulerRecoverySuccess,
  resetNotificationPlatformSchedulerContinuity,
} from '../notification-delivery/domain/notification-platform-scheduler-continuity-status';
import { buildNotificationPlatformSchedulerAnchorState } from '../notification-delivery/domain/durable-notification-platform-scheduler-anchor';
import { buildNotificationPlatformSchedulerRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-scheduler-restart-recovery';
import { buildNotificationPlatformRetryAnchorState } from '../notification-delivery/domain/durable-notification-platform-retry-anchor';
import {
  recordNotificationPlatformRetryRecoveryStart,
  recordNotificationPlatformRetryRecoverySuccess,
  resetNotificationPlatformRetryContinuity,
} from '../notification-delivery/domain/notification-platform-retry-continuity-status';
import { buildNotificationPlatformRetryRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-retry-restart-recovery';
import { buildNotificationPlatformDeadLetterAnchorState } from '../notification-delivery/domain/durable-notification-platform-dead-letter-anchor';
import {
  recordNotificationPlatformDeadLetterRecoveryStart,
  recordNotificationPlatformDeadLetterRecoverySuccess,
  resetNotificationPlatformDeadLetterContinuity,
} from '../notification-delivery/domain/notification-platform-dead-letter-continuity-status';
import { buildNotificationPlatformDeadLetterRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-dead-letter-restart-recovery';
import { buildNotificationPlatformTelemetryAnchorState } from '../notification-delivery/domain/durable-notification-platform-telemetry-anchor';
import {
  recordNotificationPlatformTelemetryRecoveryStart,
  recordNotificationPlatformTelemetryRecoverySuccess,
  resetNotificationPlatformTelemetryContinuity,
} from '../notification-delivery/domain/notification-platform-telemetry-continuity-status';
import { buildNotificationPlatformTelemetryRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-telemetry-restart-recovery';
import { buildNotificationPlatformMetricsAnchorState } from '../notification-delivery/domain/durable-notification-platform-metrics-anchor';
import {
  recordNotificationPlatformMetricsRecoveryStart,
  recordNotificationPlatformMetricsRecoverySuccess,
  resetNotificationPlatformMetricsContinuity,
} from '../notification-delivery/domain/notification-platform-metrics-continuity-status';
import { buildNotificationPlatformMetricsRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-metrics-restart-recovery';
import { buildNotificationPlatformReliabilityAnchorState } from '../notification-delivery/domain/durable-notification-platform-reliability-anchor';
import {
  recordNotificationPlatformReliabilityRecoveryStart,
  recordNotificationPlatformReliabilityRecoverySuccess,
  resetNotificationPlatformReliabilityContinuity,
} from '../notification-delivery/domain/notification-platform-reliability-continuity-status';
import { buildNotificationPlatformReliabilityRecoveryDiagnostics } from '../notification-delivery/domain/notification-platform-reliability-restart-recovery';

describe('OperationalContinuityService', () => {
  beforeEach(() => {
    resetAnalyticalOwnerBootOutcomes();
    resetMonitoringHealthContinuity();
    resetKrakenExchangeConnectivityContinuity();
    resetVenuePermissionContinuity();
    resetTelegramNotificationContinuity();
    resetEmailNotificationContinuity();
  });

  it('mixed owner states: unavailable + ready + degraded dependents', async () => {
    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest([
      { owner: 'strategy-library', outcome: 'ready' },
      { owner: 'exchange-scope', outcome: 'unavailable', reason: 'hydrate failed' },
      { owner: 'knowledge-lake', outcome: 'ready' },
      { owner: 'market-profile', outcome: 'ready' },
      { owner: 'market-qualification', outcome: 'ready' },
      { owner: 'market-state', outcome: 'ready' },
      { owner: 'reporting', outcome: 'ready' },
      { owner: 'notification-delivery', outcome: 'ready' },
      { owner: 'trading-orchestrator', outcome: 'ready' },
      { owner: 'runtime-enforcement', outcome: 'ready' },
    ]);

    expect(projection.unavailableOwners).toContain('exchange-scope');
    expect(projection.degradedOwners).toContain('market-qualification');
    expect(projection.degradedOwners).toContain('market-state');
    expect(projection.degradedOwners).toContain('trading-orchestrator');
    expect(projection.ownerStates.find((o) => o.owner === 'notification-delivery')?.state).toBe(
      'Ready',
    );
    expect(projection.platformState).toBe('Degraded');
    expect(healthyOwnersContinueWhileOthersUnavailable(projection.ownerStates)).toBe(true);
  });

  it('all ready → platform Ready with recovery timestamp', async () => {
    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );
    expect(projection.platformState).toBe('Ready');
    expect(projection.unavailableOwners).toEqual([]);
    expect(projection.degradedOwners).toEqual([]);
    expect(projection.recoveryTimestamp).toBeTruthy();
    expect(typeof projection.recoveryDurationMs).toBe('number');
    expect(projection.krakenExchangeConnectivity).toBeTruthy();
    expect(projection.krakenExchangeConnectivity?.operationalState).toBe('Unavailable');
    expect(projection.venuePermissionVerification).toBeTruthy();
    expect(projection.venuePermissionVerification?.operationalState).toBe('Unavailable');
    expect(projection.telegramNotification?.operationalState).toBe('Unavailable');
    expect(projection.emailNotification?.operationalState).toBe('Unavailable');
    expect(projection.slackDiscordTeamsNotification?.operationalState).toBe('Unavailable');
    expect(projection.pushNotification?.operationalState).toBe('Unavailable');
    expect(projection.notificationPlatformIntegration?.operationalState).toBe('Unavailable');
    expect(projection.notificationPlatformDelivery?.operationalState).toBe('Unavailable');
    expect(projection.notificationPlatformDispatch?.operationalState).toBe('Unavailable');
    expect(projection.notificationPlatformQueue?.operationalState).toBe('Unavailable');
    expect(projection.notificationPlatformWorkers?.operationalState).toBe('Unavailable');
    expect(projection.notificationPlatformWorkerExecution?.operationalState).toBe('Unavailable');
    expect(projection.notificationPlatformWorkerRuntime?.operationalState).toBe('Unavailable');
  });

  it('workspace-safe projection is read-only (no mutation API on service)', () => {
    const owners = evaluateOwnerOperationalStates({
      bootByOwner: new Map(),
      recovering: false,
    });
    expect(Object.isFrozen(owners)).toBe(true);
  });

  it('includes venue permission verification continuity derived from W4-E05-c recovery record', async () => {
    resetVenuePermissionContinuity();
    const anchor = buildVenuePermissionVerificationAnchorState({
      workspaceId: 'ws-1',
      exchangeIdentifier: 'BINANCE',
      connectionId: 'conn-1',
      adapterExchangeConnectionId: 'ex-1',
      permissionVerificationId: 'pv-1',
      vendorPermissionHash: 'vendor-hash',
      integrityMetadataHash: 'integrity-hash',
      correlationId: 'corr-1',
      recordedAt: '2026-08-29T10:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordVenuePermissionRecoveryStart();
    recordVenuePermissionRecoverySuccess({
      diagnostics: buildVenuePermissionVerificationRecoveryDiagnostics([anchor.state]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.venuePermissionVerification?.operationalState).toBe('Ready');
    expect(projection.venuePermissionVerification?.verifiedAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes telegram notification continuity derived from W5-N01-c recovery record', async () => {
    resetTelegramNotificationContinuity();
    const anchor = buildTelegramNotificationAnchorState({
      workspaceId: 'ws-1',
      notificationId: 'ntf-1',
      notificationChannel: 'telegram',
      notificationType: 'report-complete',
      recipientIdentifier: 'chat:123',
      templateIdentifier: 'inline:report-complete',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-28T16:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordTelegramNotificationRecoveryStart();
    recordTelegramNotificationRecoverySuccess({
      diagnostics: buildTelegramNotificationRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.telegramNotification?.operationalState).toBe('Ready');
    expect(projection.telegramNotification?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes email notification continuity derived from W5-N02-c recovery record', async () => {
    resetEmailNotificationContinuity();
    const anchor = buildEmailNotificationAnchorState({
      workspaceId: 'ws-1',
      notificationId: 'ntf-1',
      notificationChannel: 'email',
      notificationType: 'report-complete',
      recipientIdentifier: 'user@example.com',
      templateIdentifier: 'inline:report-complete',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-28T17:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordEmailNotificationRecoveryStart();
    recordEmailNotificationRecoverySuccess({
      diagnostics: buildEmailNotificationRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.emailNotification?.operationalState).toBe('Ready');
    expect(projection.emailNotification?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes slack discord teams notification continuity derived from W5-N03-c recovery record', async () => {
    resetSlackDiscordTeamsNotificationContinuity();
    const anchor = buildSlackDiscordTeamsNotificationAnchorState({
      workspaceId: 'ws-1',
      notificationId: 'ntf-1',
      notificationChannel: 'slack',
      notificationType: 'report-complete',
      recipientIdentifier: 'https://hooks.slack.com/services/example',
      templateIdentifier: 'inline:report-complete',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-28T17:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordSlackDiscordTeamsNotificationRecoveryStart();
    recordSlackDiscordTeamsNotificationRecoverySuccess({
      diagnostics: buildSlackDiscordTeamsNotificationRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.slackDiscordTeamsNotification?.operationalState).toBe('Ready');
    expect(projection.slackDiscordTeamsNotification?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes push notification continuity derived from W5-N04-c recovery record', async () => {
    resetPushNotificationContinuity();
    const anchor = buildPushNotificationAnchorState({
      workspaceId: 'ws-1',
      notificationId: 'ntf-1',
      notificationChannel: 'push',
      notificationType: 'report-complete',
      recipientIdentifier: 'device-ref-1',
      templateIdentifier: 'inline:report-complete',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-29T17:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordPushNotificationRecoveryStart();
    recordPushNotificationRecoverySuccess({
      diagnostics: buildPushNotificationRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.pushNotification?.operationalState).toBe('Ready');
    expect(projection.pushNotification?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform integration continuity derived from W5-N05-c recovery record', async () => {
    resetNotificationPlatformIntegrationContinuity();
    const anchor = buildNotificationPlatformIntegrationAnchorState({
      workspaceId: 'ws-1',
      integrationAnchorId: 'int-1',
      platformIntegrationType: 'unified-platform-integration',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-29T18:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformIntegrationRecoveryStart();
    recordNotificationPlatformIntegrationRecoverySuccess({
      diagnostics: buildNotificationPlatformIntegrationRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformIntegration?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformIntegration?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform delivery continuity derived from W5-N06-c recovery record', async () => {
    resetNotificationPlatformDeliveryContinuity();
    const anchor = buildNotificationPlatformDeliveryAnchorState({
      workspaceId: 'ws-1',
      deliveryAnchorId: 'del-1',
      platformDeliveryType: 'unified-platform-delivery',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-29T19:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformDeliveryRecoveryStart();
    recordNotificationPlatformDeliveryRecoverySuccess({
      diagnostics: buildNotificationPlatformDeliveryRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformDelivery?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformDelivery?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform dispatch continuity derived from W5-N07-c recovery record', async () => {
    resetNotificationPlatformDispatchContinuity();
    const anchor = buildNotificationPlatformDispatchAnchorState({
      workspaceId: 'ws-1',
      dispatchAnchorId: 'disp-1',
      platformDispatchType: 'unified-platform-dispatch',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-29T19:30:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformDispatchRecoveryStart();
    recordNotificationPlatformDispatchRecoverySuccess({
      diagnostics: buildNotificationPlatformDispatchRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformDispatch?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformDispatch?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform queue continuity derived from W5-N08-c recovery record', async () => {
    resetNotificationPlatformQueueContinuity();
    const anchor = buildNotificationPlatformQueueAnchorState({
      workspaceId: 'ws-1',
      queueAnchorId: 'queue-1',
      platformQueueType: 'unified-platform-queue',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-29T20:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformQueueRecoveryStart();
    recordNotificationPlatformQueueRecoverySuccess({
      diagnostics: buildNotificationPlatformQueueRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformQueue?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformQueue?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform workers continuity derived from W5-N09-c recovery record', async () => {
    resetNotificationPlatformWorkersContinuity();
    const anchor = buildNotificationPlatformWorkersAnchorState({
      workspaceId: 'ws-1',
      workersAnchorId: 'workers-1',
      platformWorkerType: 'unified-platform-workers',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-29T20:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformWorkersRecoveryStart();
    recordNotificationPlatformWorkersRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkersRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformWorkers?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformWorkers?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform worker execution continuity derived from W5-N10-c recovery record', async () => {
    resetNotificationPlatformWorkerExecutionContinuity();
    const anchor = buildNotificationPlatformWorkerExecutionAnchorState({
      workspaceId: 'ws-1',
      workerExecutionAnchorId: 'worker-exec-1',
      platformWorkerExecutionType: 'unified-platform-worker-execution',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-29T22:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformWorkerExecutionRecoveryStart();
    recordNotificationPlatformWorkerExecutionRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerExecutionRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformWorkerExecution?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformWorkerExecution?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform worker runtime continuity derived from W5-N11-c recovery record', async () => {
    resetNotificationPlatformWorkerRuntimeContinuity();
    const anchor = buildNotificationPlatformWorkerRuntimeAnchorState({
      workspaceId: 'ws-1',
      workerRuntimeAnchorId: 'worker-runtime-1',
      platformWorkerRuntimeType: 'unified-platform-worker-runtime',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-09-02T10:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformWorkerRuntimeRecoveryStart();
    recordNotificationPlatformWorkerRuntimeRecoverySuccess({
      diagnostics: buildNotificationPlatformWorkerRuntimeRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformWorkerRuntime?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformWorkerRuntime?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform scheduler continuity derived from W5-N12-c recovery record', async () => {
    resetNotificationPlatformSchedulerContinuity();
    const anchor = buildNotificationPlatformSchedulerAnchorState({
      workspaceId: 'ws-1',
      schedulerAnchorId: 'scheduler-1',
      platformSchedulerType: 'unified-platform-scheduler',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-09-02T14:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformSchedulerRecoveryStart();
    recordNotificationPlatformSchedulerRecoverySuccess({
      diagnostics: buildNotificationPlatformSchedulerRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformScheduler?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformScheduler?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform retry continuity derived from W5-N13-c recovery record', async () => {
    resetNotificationPlatformRetryContinuity();
    const anchor = buildNotificationPlatformRetryAnchorState({
      workspaceId: 'ws-1',
      retryAnchorId: 'retry-1',
      platformRetryType: 'unified-platform-retry',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-09-02T16:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformRetryRecoveryStart();
    recordNotificationPlatformRetryRecoverySuccess({
      diagnostics: buildNotificationPlatformRetryRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformRetry?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformRetry?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform dead-letter continuity derived from W5-N14-c recovery record', async () => {
    resetNotificationPlatformDeadLetterContinuity();
    const anchor = buildNotificationPlatformDeadLetterAnchorState({
      workspaceId: 'ws-1',
      deadLetterAnchorId: 'dead-letter-1',
      platformDeadLetterType: 'unified-platform-dead-letter',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-09-02T16:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformDeadLetterRecoveryStart();
    recordNotificationPlatformDeadLetterRecoverySuccess({
      diagnostics: buildNotificationPlatformDeadLetterRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformDeadLetter?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformDeadLetter?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform telemetry continuity derived from W5-N15-c recovery record', async () => {
    resetNotificationPlatformTelemetryContinuity();
    const anchor = buildNotificationPlatformTelemetryAnchorState({
      workspaceId: 'ws-1',
      telemetryAnchorId: 'telemetry-1',
      platformTelemetryType: 'unified-platform-telemetry',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-09-02T16:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformTelemetryRecoveryStart();
    recordNotificationPlatformTelemetryRecoverySuccess({
      diagnostics: buildNotificationPlatformTelemetryRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformTelemetry?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformTelemetry?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform metrics continuity derived from W5-N16-c recovery record', async () => {
    resetNotificationPlatformMetricsContinuity();
    const anchor = buildNotificationPlatformMetricsAnchorState({
      workspaceId: 'ws-1',
      metricsAnchorId: 'metrics-1',
      platformMetricsType: 'unified-platform-metrics',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-09-02T16:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformMetricsRecoveryStart();
    recordNotificationPlatformMetricsRecoverySuccess({
      diagnostics: buildNotificationPlatformMetricsRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformMetrics?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformMetrics?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });

  it('includes notification platform delivery reliability continuity derived from W5-N17-c recovery record', async () => {
    resetNotificationPlatformReliabilityContinuity();
    const anchor = buildNotificationPlatformReliabilityAnchorState({
      workspaceId: 'ws-1',
      reliabilityAnchorId: 'reliability-1',
      platformReliabilityType: 'cross-channel-foundation',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt: '2026-09-02T16:00:00.000Z',
      prior: null,
    });
    if (!anchor.ok) throw new Error('expected anchor');
    recordNotificationPlatformReliabilityRecoveryStart();
    recordNotificationPlatformReliabilityRecoverySuccess({
      diagnostics: buildNotificationPlatformReliabilityRecoveryDiagnostics([anchor.anchor]),
    });

    const audit = {
      recordOwnerState: vi.fn(async () => undefined),
      recordRecoveryCompleted: vi.fn(async () => undefined),
    } as unknown as OperationalContinuityAudit;
    const service = new OperationalContinuityService(audit);
    const projection = await service.applyBootOutcomesForTest(
      (
        [
          'strategy-library',
          'exchange-scope',
          'knowledge-lake',
          'market-profile',
          'market-qualification',
          'market-state',
          'reporting',
          'notification-delivery',
          'trading-orchestrator',
          'runtime-enforcement',
        ] as const
      ).map((owner) => ({ owner, outcome: 'ready' as const })),
    );

    expect(projection.notificationPlatformReliability?.operationalState).toBe('Ready');
    expect(projection.notificationPlatformReliability?.canonicalAnchorCount).toBe(1);
    expect(projection.platformState).toBe('Ready');
  });
});

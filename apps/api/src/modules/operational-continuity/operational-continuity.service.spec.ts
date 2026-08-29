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
});

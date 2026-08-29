import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformIntegrationAnchorState,
  type DurableNotificationPlatformIntegrationAnchor,
} from './domain/durable-notification-platform-integration-anchor';
import type { NotificationPlatformIntegrationAnchorRepository } from './domain/notification-platform-integration-anchor.repository';
import { NotificationPlatformIntegrationPersistenceService } from './notification-platform-integration-persistence.service';
import { NotificationPlatformIntegrationRecoveryStore } from './notification-platform-integration-recovery-store';

const recordedAt = '2026-08-29T18:00:00.000Z';

function createRepository(): NotificationPlatformIntegrationAnchorRepository & {
  saved: DurableNotificationPlatformIntegrationAnchor[];
} {
  const saved: DurableNotificationPlatformIntegrationAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformIntegrationAnchor>();

  return {
    saved,
    saveNotificationPlatformIntegrationAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.integrationAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformIntegrationAnchor: vi.fn(
      async (workspaceId, integrationAnchorId) =>
        byKey.get(`${workspaceId}:${integrationAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformIntegrationAnchors: vi.fn(async () => saved),
  };
}

describe('NotificationPlatformIntegrationPersistenceService — W5-N05-b storage only', () => {
  it('persistIntegrationAnchor writes canonical platform integration anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformIntegrationPersistenceService(
      repository,
      new NotificationPlatformIntegrationRecoveryStore(),
    );

    const outcome = await service.persistIntegrationAnchor({
      workspaceId: 'ws-1',
      integrationAnchorId: 'plat-1',
      platformIntegrationType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      integrationAnchorId: 'plat-1',
      platformIntegrationType: 'cross-channel-foundation',
      integrationState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('plat-1');
    expect(await service.loadAnchor('ws-1', 'plat-1')).toMatchObject({
      integrationAnchorId: 'plat-1',
    });
  });

  it('does not persist delivery state, transport secrets, or process-local runtime fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformIntegrationPersistenceService(
      repository,
      new NotificationPlatformIntegrationRecoveryStore(),
    );

    await service.persistIntegrationAnchor({
      workspaceId: 'ws-1',
      integrationAnchorId: 'plat-2',
      platformIntegrationType: 'platform-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('deliveryState');
    expect(anchor).not.toHaveProperty('notificationChannel');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
    expect(anchor).not.toHaveProperty('templateIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformIntegrationAnchor = {
      workspaceId: 'ws-1',
      integrationAnchorId: 'plat-3',
      platformIntegrationType: 'cross-channel-foundation',
      integrationState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformIntegrationAnchorState({
      workspaceId: 'ws-2',
      integrationAnchorId: 'plat-3',
      platformIntegrationType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});

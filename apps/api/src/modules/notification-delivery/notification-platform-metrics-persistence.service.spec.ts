import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformMetricsAnchorState,
  type DurableNotificationPlatformMetricsAnchor,
} from './domain/durable-notification-platform-metrics-anchor';
import type { NotificationPlatformMetricsAnchorRepository } from './domain/notification-platform-metrics-anchor.repository';
import { NotificationPlatformMetricsRecoveryStore } from './domain/notification-platform-metrics-recovery-store';
import { NotificationPlatformMetricsPersistenceService } from './notification-platform-metrics-persistence.service';

const recordedAt = '2026-09-02T19:00:00.000Z';

function createRepository(): NotificationPlatformMetricsAnchorRepository & {
  saved: DurableNotificationPlatformMetricsAnchor[];
} {
  const saved: DurableNotificationPlatformMetricsAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformMetricsAnchor>();

  return {
    saved,
    saveNotificationPlatformMetricsAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.metricsAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformMetricsAnchor: vi.fn(
      async (workspaceId, metricsAnchorId) =>
        byKey.get(`${workspaceId}:${metricsAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformMetricsAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.metricsAnchorId.localeCompare(b.metricsAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformMetricsPersistenceService — W5-N16-b storage only', () => {
  it('persistNotificationPlatformMetricsAnchor writes canonical platform metrics anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformMetricsPersistenceService(
      repository,
      new NotificationPlatformMetricsRecoveryStore(),
    );
    const outcome = await service.persistNotificationPlatformMetricsAnchor({
      workspaceId: 'ws-1',
      metricsAnchorId: 'metrics-1',
      platformMetricsType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      metricsAnchorId: 'metrics-1',
      platformMetricsType: 'cross-channel-foundation',
      metricsState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('metrics-1');
    expect(await service.loadNotificationPlatformMetricsAnchor('ws-1', 'metrics-1')).toMatchObject({
      metricsAnchorId: 'metrics-1',
    });
  });

  it('does not persist metrics collection, exporters, dashboards, aggregation, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformMetricsPersistenceService(
      repository,
      new NotificationPlatformMetricsRecoveryStore(),
    );

    await service.persistNotificationPlatformMetricsAnchor({
      workspaceId: 'ws-1',
      metricsAnchorId: 'metrics-2',
      platformMetricsType: 'platform-metrics-inventory-baseline',
      recordedAt,
    });

    const anchor = repository.saved[0];
    expect(anchor).toBeDefined();
    expect(anchor).not.toHaveProperty('metricsCollectionState');
    expect(anchor).not.toHaveProperty('exporterState');
    expect(anchor).not.toHaveProperty('dashboardState');
    expect(anchor).not.toHaveProperty('aggregationState');
    expect(anchor).not.toHaveProperty('runtimeCounterState');
    expect(anchor).not.toHaveProperty('metricsBufferState');
    expect(anchor).not.toHaveProperty('transportExecutionState');
    expect(anchor).not.toHaveProperty('notificationId');
    expect(anchor).not.toHaveProperty('recipientIdentifier');
  });

  it('rejects workspace mismatch when prior anchor exists', () => {
    const prior: DurableNotificationPlatformMetricsAnchor = {
      workspaceId: 'ws-1',
      metricsAnchorId: 'metrics-3',
      platformMetricsType: 'cross-channel-foundation',
      metricsState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformMetricsAnchorState({
      workspaceId: 'ws-2',
      metricsAnchorId: 'metrics-3',
      platformMetricsType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});

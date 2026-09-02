import { describe, expect, it, vi } from 'vitest';
import {
  buildNotificationPlatformTelemetryAnchorState,
  type DurableNotificationPlatformTelemetryAnchor,
} from './domain/durable-notification-platform-telemetry-anchor';
import type { NotificationPlatformTelemetryAnchorRepository } from './domain/notification-platform-telemetry-anchor.repository';
import { NotificationPlatformTelemetryPersistenceService } from './notification-platform-telemetry-persistence.service';

const recordedAt = '2026-09-02T18:00:00.000Z';

function createRepository(): NotificationPlatformTelemetryAnchorRepository & {
  saved: DurableNotificationPlatformTelemetryAnchor[];
} {
  const saved: DurableNotificationPlatformTelemetryAnchor[] = [];
  const byKey = new Map<string, DurableNotificationPlatformTelemetryAnchor>();

  return {
    saved,
    saveNotificationPlatformTelemetryAnchor: vi.fn(async (anchor) => {
      byKey.set(`${anchor.workspaceId}:${anchor.telemetryAnchorId}`, anchor);
      saved.push(anchor);
    }),
    loadNotificationPlatformTelemetryAnchor: vi.fn(
      async (workspaceId, telemetryAnchorId) =>
        byKey.get(`${workspaceId}:${telemetryAnchorId}`) ?? null,
    ),
    listAllNotificationPlatformTelemetryAnchors: vi.fn(async () =>
      [...byKey.values()].sort((a, b) => {
        const workspaceCompare = a.workspaceId.localeCompare(b.workspaceId);
        if (workspaceCompare !== 0) {
          return workspaceCompare;
        }
        return a.telemetryAnchorId.localeCompare(b.telemetryAnchorId);
      }),
    ),
  };
}

describe('NotificationPlatformTelemetryPersistenceService — W5-N15-b storage only', () => {
  it('persistTelemetryAnchor writes canonical platform telemetry anchors without runtime I/O', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformTelemetryPersistenceService(repository);
    const outcome = await service.persistTelemetryAnchor({
      workspaceId: 'ws-1',
      telemetryAnchorId: 'telemetry-1',
      platformTelemetryType: 'cross-channel-foundation',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
      actorId: 'actor-1',
      recordedAt,
    });

    expect(outcome.ok).toBe(true);
    expect(repository.saved).toHaveLength(1);
    expect(repository.saved[0]).toMatchObject({
      workspaceId: 'ws-1',
      telemetryAnchorId: 'telemetry-1',
      platformTelemetryType: 'cross-channel-foundation',
      telemetryState: 'anchor-recorded',
      channelScope: 'telegram,email,slack-discord-teams,push',
      correlationId: 'corr-1',
    });
    expect(repository.saved[0]?.integrityMetadata).toContain('telemetry-1');
    expect(await service.loadAnchor('ws-1', 'telemetry-1')).toMatchObject({
      telemetryAnchorId: 'telemetry-1',
    });
  });

  it('does not persist metrics collection, exporters, dashboards, aggregation, or transport fields', async () => {
    const repository = createRepository();
    const service = new NotificationPlatformTelemetryPersistenceService(repository);

    await service.persistTelemetryAnchor({
      workspaceId: 'ws-1',
      telemetryAnchorId: 'telemetry-2',
      platformTelemetryType: 'platform-telemetry-inventory-baseline',
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
    const prior: DurableNotificationPlatformTelemetryAnchor = {
      workspaceId: 'ws-1',
      telemetryAnchorId: 'telemetry-3',
      platformTelemetryType: 'cross-channel-foundation',
      telemetryState: 'anchor-recorded',
      channelScope: null,
      integrityMetadata: '{}',
      correlationId: null,
      schemaVersion: 1,
      recordedAt,
      recordedByActorId: null,
      updatedAt: recordedAt,
    };

    const outcome = buildNotificationPlatformTelemetryAnchorState({
      workspaceId: 'ws-2',
      telemetryAnchorId: 'telemetry-3',
      platformTelemetryType: 'cross-channel-foundation',
      recordedAt,
      prior,
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe('workspace_mismatch');
    }
  });
});

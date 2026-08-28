import { describe, expect, it } from 'vitest';
import { MonitoringHealthPersistenceService } from './monitoring-health-persistence.service';
import type { MonitoringHealthStateRepository } from './domain/monitoring-health-state.repository';
import type { DurableMonitoringHealthState } from './domain/durable-monitoring-health-state';
import { MonitoringHealthRecoveryStore } from './monitoring-health-recovery-store';

function createInMemoryRepository(): MonitoringHealthStateRepository & {
  rows: Map<string, DurableMonitoringHealthState>;
} {
  const rows = new Map<string, DurableMonitoringHealthState>();
  return {
    rows,
    async saveMonitoringHealthState(state) {
      rows.set(state.workspaceId, state);
    },
    async loadMonitoringHealthState(workspaceId) {
      return rows.get(workspaceId) ?? null;
    },
    async listAllMonitoringHealthStates() {
      return Object.freeze(
        [...rows.values()].sort((a, b) => a.workspaceId.localeCompare(b.workspaceId)),
      );
    },
  };
}

describe('MonitoringHealthPersistenceService — W3-O05-b storage only', () => {
  it('persists explicit security health anchor without fabricating connection anchor', async () => {
    const repository = createInMemoryRepository();
    const service = new MonitoringHealthPersistenceService(
      repository,
      new MonitoringHealthRecoveryStore(),
    );

    const outcome = await service.persistSecurityHealthAnchor({
      workspaceId: 'ws-a',
      incidentId: 'inc-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-28T10:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadState('ws-a');
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      securityHealthAnchorIncidentId: 'inc-1',
      securityHealthAnchorRecordedByActorId: 'actor-1',
      connectionHealthAnchorSessionId: null,
    });
  });

  it('persists explicit connection health anchor without fabricating security anchor', async () => {
    const repository = createInMemoryRepository();
    const service = new MonitoringHealthPersistenceService(
      repository,
      new MonitoringHealthRecoveryStore(),
    );

    await service.persistSecurityHealthAnchor({
      workspaceId: 'ws-a',
      incidentId: 'inc-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-28T10:00:00.000Z',
    });

    const outcome = await service.persistConnectionHealthAnchor({
      workspaceId: 'ws-a',
      sessionId: 'sess-9',
      actorId: 'actor-2',
      recordedAt: '2026-08-28T10:05:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadState('ws-a');
    expect(loaded?.securityHealthAnchorIncidentId).toBe('inc-1');
    expect(loaded?.connectionHealthAnchorSessionId).toBe('sess-9');
  });

  it('does not create a row until explicit persist command', async () => {
    const repository = createInMemoryRepository();
    const service = new MonitoringHealthPersistenceService(
      repository,
      new MonitoringHealthRecoveryStore(),
    );
    expect(await service.loadState('ws-empty')).toBeNull();
  });
});

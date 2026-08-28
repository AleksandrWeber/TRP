import { describe, expect, it, vi } from 'vitest';
import { MonitoringHealthRestartRecoveryService } from './monitoring-health-restart-recovery.service';
import { MonitoringHealthRecoveryStore } from './monitoring-health-recovery-store';
import type { MonitoringHealthStateRepository } from './domain/monitoring-health-state.repository';
import { buildSecurityHealthAnchorState } from './domain/durable-monitoring-health-state';

const recordedAt = '2026-08-28T10:00:00.000Z';

function securityAnchor(workspaceId: string) {
  const outcome = buildSecurityHealthAnchorState({
    workspaceId,
    incidentId: 'inc-1',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected security anchor');
  return outcome.state;
}

function createRepository(
  states: ReturnType<typeof securityAnchor>[],
): MonitoringHealthStateRepository {
  return {
    saveMonitoringHealthState: vi.fn(),
    loadMonitoringHealthState: vi.fn(),
    listAllMonitoringHealthStates: vi.fn(async () => states),
  };
}

describe('MonitoringHealthRestartRecoveryService — W3-O05-c', () => {
  it('hydrate restores persisted monitoring state after simulated restart', async () => {
    const repository = createRepository([securityAnchor('ws-1')]);
    const recoveryStore = new MonitoringHealthRecoveryStore();
    const service = new MonitoringHealthRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(1);
    expect(diagnostics.securityHealthAnchorCount).toBe(1);
    expect(service.getRecoveredState('ws-1')?.securityHealthAnchorIncidentId).toBe('inc-1');
    expect(service.getRecoveredState('ws-missing')).toBeNull();
  });

  it('hydrate is idempotent', async () => {
    const repository = createRepository([securityAnchor('ws-b'), securityAnchor('ws-a')]);
    const recoveryStore = new MonitoringHealthRecoveryStore();
    const service = new MonitoringHealthRestartRecoveryService(repository, recoveryStore);

    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
    expect(service.getRecoveryDiagnostics().recoveryOrder).toEqual(['ws-a', 'ws-b']);
  });

  it('hydrate with no persisted rows leaves runtime empty', async () => {
    const repository = createRepository([]);
    const recoveryStore = new MonitoringHealthRecoveryStore();
    const service = new MonitoringHealthRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(recoveryStore.hasHydrated()).toBe(true);
    expect(service.getRecoveredState('ws-1')).toBeNull();
  });
});

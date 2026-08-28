import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSecurityHealthAnchorState } from '../security-platform/monitoring-health/domain/durable-monitoring-health-state';
import {
  MonitoringHealthRestartRecoveryError,
  prepareMonitoringHealthStatesForRecovery,
} from '../security-platform/monitoring-health/domain/monitoring-health-restart-recovery';
import { MonitoringHealthRecoveryStore } from '../security-platform/monitoring-health/monitoring-health-recovery-store';
import { MonitoringHealthRestartRecoveryService } from '../security-platform/monitoring-health/monitoring-health-restart-recovery.service';
import { PrismaMonitoringHealthStateRepository } from '../security-platform/monitoring-health/persistence/prisma-monitoring-health-state.repository';
import {
  W3_O05_C_ARCHITECTURE_CLAIMS,
  W3_O05_C_EXPLICIT_OUT,
  W3_O05_C_MONITORING_OWNER,
  W3_O05_C_RECOVERED_ARTIFACT_IDS,
  W3_O05_C_SLICE_ID,
  W3_O05_C_TECHNICAL_DEBT_DELTA,
  W3_O05_C_TRANSITION_MATRIX,
} from './w3-o05-c-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-28T10:00:00.000Z';

function securityAnchor(workspaceId: string) {
  const outcome = buildSecurityHealthAnchorState({
    workspaceId,
    incidentId: 'inc-42',
    actorId: 'actor-1',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected security anchor');
  return outcome.state;
}

function createPrismaMock(rows: Record<string, unknown>[]) {
  const store = new Map(rows.map((row) => [row.workspaceId as string, row]));
  return {
    workspaceMonitoringHealthState: {
      findMany: async () =>
        [...store.values()].sort((a, b) =>
          String(a.workspaceId).localeCompare(String(b.workspaceId)),
        ),
      findUnique: async ({ where: { workspaceId } }: { where: { workspaceId: string } }) =>
        store.get(workspaceId) ?? null,
      upsert: async () => ({}),
    },
  };
}

function toRow(state: ReturnType<typeof securityAnchor>) {
  return {
    workspaceId: state.workspaceId,
    schemaVersion: state.schemaVersion,
    securityHealthAnchorIncidentId: state.securityHealthAnchorIncidentId,
    securityHealthAnchorRecordedAt: state.securityHealthAnchorRecordedAt
      ? new Date(state.securityHealthAnchorRecordedAt)
      : null,
    securityHealthAnchorRecordedByActorId: state.securityHealthAnchorRecordedByActorId,
    connectionHealthAnchorSessionId: state.connectionHealthAnchorSessionId,
    connectionHealthAnchorRecordedAt: state.connectionHealthAnchorRecordedAt
      ? new Date(state.connectionHealthAnchorRecordedAt)
      : null,
    connectionHealthAnchorRecordedByActorId: state.connectionHealthAnchorRecordedByActorId,
    correlationId: state.correlationId,
    updatedAt: new Date(state.updatedAt),
  };
}

describe('W3-O05-c monitoring restart recovery — unit', () => {
  it('ownership remains security-platform only', () => {
    expect(W3_O05_C_MONITORING_OWNER).toBe('security-platform');
  });

  it('corrupt security anchor fails honestly', () => {
    const bad = Object.freeze({
      ...securityAnchor('ws-1'),
      securityHealthAnchorRecordedAt: null,
    });
    expect(() => prepareMonitoringHealthStatesForRecovery([bad])).toThrow(
      MonitoringHealthRestartRecoveryError,
    );
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaMonitoringHealthStateRepository(createPrismaMock([]) as never);
    const service = new MonitoringHealthRestartRecoveryService(
      repository,
      new MonitoringHealthRecoveryStore(),
    );
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredState('ws-1')).toBeNull();
  });
});

describe('W3-O05-c monitoring restart recovery — integration', () => {
  it('recover persisted monitoring state after normal restart (new store + hydrate)', async () => {
    const state = securityAnchor('ws-1');
    const repository = new PrismaMonitoringHealthStateRepository(
      createPrismaMock([toRow(state)]) as never,
    );
    const recoveryStore = new MonitoringHealthRecoveryStore();
    const service = new MonitoringHealthRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.securityHealthAnchorCount).toBe(1);
    expect(service.getRecoveredState('ws-1')?.securityHealthAnchorIncidentId).toBe('inc-42');
    expect(W3_O05_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(W3_O05_C_ARCHITECTURE_CLAIMS.monitoringStateRestoredAfterRestart).toBe(true);
    expect(W3_O05_C_ARCHITECTURE_CLAIMS.securityHealthStateRestoredAfterRestart).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const state = securityAnchor('ws-a');
    const service = new MonitoringHealthRestartRecoveryService(
      new PrismaMonitoringHealthStateRepository(createPrismaMock([toRow(state)]) as never),
      new MonitoringHealthRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
    expect(W3_O05_C_ARCHITECTURE_CLAIMS.recoveryIdempotent).toBe(true);
  });

  it('transition matrix documents persistence → recovery → still missing', () => {
    expect(W3_O05_C_TRANSITION_MATRIX.before).toContain('Durable persistence (W3-O05-b)');
    expect(W3_O05_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W3-O05-c)');
    expect(W3_O05_C_TRANSITION_MATRIX.stillMissing).toContain('Operational Continuity (W3-O05-d)');
  });

  it('technical debt delta resolves W3-O05 restart recovery foundation', () => {
    expect(W3_O05_C_TECHNICAL_DEBT_DELTA.resolved[0]).toMatch(/restart recovery/i);
    expect(W3_O05_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
  });

  it('explicit OUT covers operational continuity and W3-O05-d', () => {
    expect(W3_O05_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['operational-continuity', 'w3-o05-d', 'monitoring-evaluation']),
    );
  });

  it('architecture claims deny operational continuity and monitoring complete', () => {
    expect(W3_O05_C_SLICE_ID).toBe('W3-O05-c');
    expect(W3_O05_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W3_O05_C_ARCHITECTURE_CLAIMS.monitoringCompleteClaimed).toBe(false);
    expect(W3_O05_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O05_C_RECOVERED_ARTIFACT_IDS.length).toBe(1);
  });

  it('required reports exist for W3-O05-c', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o05-c-implementation-report.md',
      'w3-o05-c-architecture-review.md',
      'w3-o05-c-security-review.md',
      'w3-o05-c-product-review.md',
      'w3-o05-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});

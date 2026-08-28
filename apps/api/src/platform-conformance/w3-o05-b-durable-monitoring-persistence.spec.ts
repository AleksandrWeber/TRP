import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MonitoringHealthPersistenceService } from '../security-platform/monitoring-health/monitoring-health-persistence.service';
import { MonitoringHealthRecoveryStore } from '../security-platform/monitoring-health/monitoring-health-recovery-store';
import { PrismaMonitoringHealthStateRepository } from '../security-platform/monitoring-health/persistence/prisma-monitoring-health-state.repository';
import {
  W3_O05_A_MONITORING_INVENTORY,
  rowsEphemeral,
  rowsSecurityHealthSurvive,
  rowsSurvive,
} from './w3-o05-a-monitoring-inventory';
import {
  W3_O05_B_ARCHITECTURE_CLAIMS,
  W3_O05_B_CONSUMED_SURVIVE_ARTIFACT_IDS,
  W3_O05_B_DURABLE_COVERAGE,
  W3_O05_B_EXPLICIT_OUT,
  W3_O05_B_MONITORING_OWNER,
  W3_O05_B_NEW_PERSISTED_ARTIFACT_IDS,
  W3_O05_B_PREEXISTING_SECURITY_HEALTH_ARTIFACT_IDS,
  W3_O05_B_SLICE_ID,
  W3_O05_B_TECHNICAL_DEBT_DELTA,
  newPersistedInventoryRows,
  persistedArtifactIds,
  preexistingSecurityHealthSurviveRows,
} from './w3-o05-b-durable-monitoring-persistence';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceMonitoringHealthState: {
      upsert: async ({
        where: { workspaceId },
        create,
        update,
      }: {
        where: { workspaceId: string };
        create: unknown;
        update: unknown;
      }) => {
        const data = rows.has(workspaceId) ? update : create;
        rows.set(workspaceId, data);
        return data;
      },
      findUnique: async ({ where: { workspaceId } }: { where: { workspaceId: string } }) =>
        rows.get(workspaceId) ?? null,
      findMany: async () => [...rows.values()],
    },
    _rows: rows,
  };
}

describe('W3-O05-b durable monitoring persistence — unit', () => {
  it('persistence correctness: security health anchor write-through upserts workspace row', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaMonitoringHealthStateRepository(prisma as never);
    const service = new MonitoringHealthPersistenceService(
      repository,
      new MonitoringHealthRecoveryStore(),
    );

    const outcome = await service.persistSecurityHealthAnchor({
      workspaceId: 'ws-a',
      incidentId: 'inc-42',
      actorId: 'actor-1',
      recordedAt: '2026-08-28T10:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadState('ws-a');
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      securityHealthAnchorIncidentId: 'inc-42',
    });
  });

  it('artifact coverage: only approved new SURVIVE rows are persisted by this slice', () => {
    expect([...persistedArtifactIds()].sort()).toEqual(
      [...W3_O05_B_NEW_PERSISTED_ARTIFACT_IDS].sort(),
    );
    const rows = newPersistedInventoryRows();
    expect(rows.length).toBe(W3_O05_B_NEW_PERSISTED_ARTIFACT_IDS.length);
    for (const row of rows) {
      expect(row.durabilityClass).toBe('SURVIVE');
      expect(row.owner).toBe('security-platform');
    }
  });

  it('pre-existing Security Health SURVIVE rows remain on security-audit owner', () => {
    const preexisting = preexistingSecurityHealthSurviveRows();
    expect(preexisting.length).toBe(W3_O05_B_PREEXISTING_SECURITY_HEALTH_ARTIFACT_IDS.length);
    for (const row of preexisting) {
      expect(row.owner).toBe('security-audit');
      expect(row.durabilityClass).toBe('SURVIVE');
    }
    expect(rowsSecurityHealthSurvive().length).toBeGreaterThan(0);
  });

  it('ownership: monitoring persistence remains on security-platform owner only', () => {
    expect(W3_O05_B_MONITORING_OWNER).toBe('security-platform');
    for (const row of W3_O05_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('security-platform');
    }
  });

  it('EPHEMERAL inventory rows are not in new durable coverage', () => {
    const covered = new Set(persistedArtifactIds());
    for (const row of rowsEphemeral()) {
      expect(covered.has(row.artifactId)).toBe(false);
    }
  });

  it('consumed SURVIVE rows from O01–O04 are not duplicated by O05-b', () => {
    const covered = new Set(persistedArtifactIds());
    for (const artifactId of W3_O05_B_CONSUMED_SURVIVE_ARTIFACT_IDS) {
      expect(covered.has(artifactId)).toBe(false);
    }
    const consumed = W3_O05_A_MONITORING_INVENTORY.filter((row) =>
      (W3_O05_B_CONSUMED_SURVIVE_ARTIFACT_IDS as readonly string[]).includes(row.artifactId),
    );
    expect(consumed.length).toBe(W3_O05_B_CONSUMED_SURVIVE_ARTIFACT_IDS.length);
  });
});

describe('W3-O05-b durable monitoring persistence — integration', () => {
  it('persistence lifecycle: no recovery / evaluation / continuity claims from this slice', () => {
    expect(W3_O05_B_SLICE_ID).toBe('W3-O05-b');
    expect(W3_O05_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W3_O05_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W3_O05_B_ARCHITECTURE_CLAIMS.monitoringEvaluationImplemented).toBe(false);
    expect(W3_O05_B_ARCHITECTURE_CLAIMS.alertingImplemented).toBe(false);
    expect(W3_O05_B_ARCHITECTURE_CLAIMS.dashboardImplemented).toBe(false);
    expect(W3_O05_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O05_B_ARCHITECTURE_CLAIMS.monitoringRestartSurvivalClaimed).toBe(false);
  });

  it('technical debt delta: persistence foundation resolved; recovery deferred', () => {
    expect(W3_O05_B_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W3_O05_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W3_O05_B_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.includes('restart'))).toBe(
      true,
    );
  });

  it('explicit OUT covers restart recovery and W3-O05-c', () => {
    expect(W3_O05_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['restart-recovery', 'w3-o05-c', 'second-monitoring-platform']),
    );
  });

  it('owner consistency: each coverage row maps to existing adapter and service files', () => {
    for (const row of W3_O05_B_DURABLE_COVERAGE) {
      expect(existsSync(join(REPO_ROOT, row.prismaAdapter))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.persistenceService))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.repositoryPort))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.migration))).toBe(true);
    }
  });

  it('SURVIVE inventory includes rows beyond new persistence — not all are O05-b targets', () => {
    expect(rowsSurvive().length).toBeGreaterThan(W3_O05_B_NEW_PERSISTED_ARTIFACT_IDS.length);
  });

  it('required reports exist for W3-O05-b', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o05-b-implementation-report.md',
      'w3-o05-b-architecture-review.md',
      'w3-o05-b-security-review.md',
      'w3-o05-b-product-review.md',
      'w3-o05-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});

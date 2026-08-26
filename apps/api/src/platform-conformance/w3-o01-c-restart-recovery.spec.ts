import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { saveOwnerStoreSnapshot } from '../persistence/analytical-owner-store-snapshot';
import {
  AnalyticalRestartRecoveryError,
  assertRecoveryDependenciesAcyclic,
  assertRecoveryOrderComplete,
  loadRecoverableOwnerSnapshot,
  runAnalyticalRestartRecovery,
  W3_O01_C_RECOVERY_ORDER,
} from '../persistence/analytical-restart-recovery';
import { DurableReportingStore } from '../modules/reporting/adapters/durable-reporting-store';
import { DurableNotificationStore } from '../modules/notification-delivery/adapters/durable-notification-store';
import { W3_O01_A_ANALYTICAL_INVENTORY } from './w3-o01-a-analytical-inventory';
import {
  durableOwnerSetMatchesRecoveryOrder,
  ephemeralArtifactsNotRecovered,
  surviveArtifactsRestored,
  transitionSafetyAnswers,
  W3_O01_C_ARCHITECTURE_CLAIMS,
  W3_O01_C_RECOVERY_COVERAGE,
  W3_O01_C_SLICE_ID,
} from './w3-o01-c-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');

function createSnapshotPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    analyticalOwnerStoreSnapshot: {
      findUnique: async ({ where: { owner } }: { where: { owner: string } }) => {
        if (!rows.has(owner)) return null;
        return { owner, payload: rows.get(owner) };
      },
      upsert: async ({
        where: { owner },
        create,
        update,
      }: {
        where: { owner: string };
        create: { owner: string; payload: unknown };
        update: { payload: unknown };
      }) => {
        const payload = rows.has(owner) ? update.payload : create.payload;
        rows.set(owner, payload);
        return { owner, payload };
      },
    },
    _rows: rows,
  };
}

describe('W3-O01-c restart recovery — unit', () => {
  it('recovery correctness: persisted reporting state restores on new store hydrate', async () => {
    const prisma = createSnapshotPrismaMock();
    const first = new DurableReportingStore(prisma as never);
    await first.hydrate();
    first.putDefinition({
      reportDefinitionId: 'def-recover-1',
      workspaceId: 'ws-1',
      name: 'Recovered',
      createdAt: '2026-08-26T00:00:00.000Z',
    } as never);

    const afterRestart = new DurableReportingStore(prisma as never);
    await afterRestart.hydrate();
    expect(afterRestart.getDefinition('def-recover-1')?.name).toBe('Recovered');
  });

  it('recovery ordering: complete, covers durable owners, dependencies acyclic', () => {
    expect(() => assertRecoveryOrderComplete()).not.toThrow();
    expect(() => assertRecoveryDependenciesAcyclic()).not.toThrow();
    expect(durableOwnerSetMatchesRecoveryOrder()).toBe(true);
    expect(W3_O01_C_RECOVERY_ORDER[0]).toBe('strategy-library');
    expect(W3_O01_C_RECOVERY_ORDER.at(-1)).toBe('runtime-enforcement');
  });

  it('recovery integrity: corrupt snapshot fails honestly', async () => {
    const prisma = createSnapshotPrismaMock();
    prisma._rows.set('reporting', ['not-an-object']);
    await expect(loadRecoverableOwnerSnapshot(prisma as never, 'reporting')).rejects.toBeInstanceOf(
      AnalyticalRestartRecoveryError,
    );
    const store = new DurableReportingStore(prisma as never);
    await expect(store.hydrate()).rejects.toMatchObject({ code: 'CORRUPT_SNAPSHOT' });
  });

  it('missing persistence behavior: absent snapshot leaves empty store (no fabrication)', async () => {
    const prisma = createSnapshotPrismaMock();
    const store = new DurableReportingStore(prisma as never);
    await store.hydrate();
    expect(store.listDefinitions('ws-1')).toEqual([]);
    expect(await loadRecoverableOwnerSnapshot(prisma as never, 'reporting')).toBeNull();
  });
});

describe('W3-O01-c restart recovery — integration', () => {
  it('normal restart: multi-owner recovery runs in documented order', async () => {
    const prisma = createSnapshotPrismaMock();
    const reporting = new DurableReportingStore(prisma as never);
    const notifications = new DurableNotificationStore(prisma as never);
    await reporting.hydrate();
    await notifications.hydrate();
    reporting.putDefinition({
      reportDefinitionId: 'def-order-1',
      workspaceId: 'ws-1',
      name: 'Ordered',
      createdAt: '2026-08-26T00:00:00.000Z',
    } as never);
    notifications.savePreferences({
      workspaceId: 'ws-1',
      userId: 'user-1',
      channels: {},
    } as never);

    const order: string[] = [];
    const reporting2 = new DurableReportingStore(prisma as never);
    const notifications2 = new DurableNotificationStore(prisma as never);

    const result = await runAnalyticalRestartRecovery(
      W3_O01_C_RECOVERY_ORDER.map((owner) => ({
        owner,
        restore: async () => {
          order.push(owner);
          if (owner === 'reporting') await reporting2.hydrate();
          if (owner === 'notification-delivery') await notifications2.hydrate();
        },
      })),
    );

    expect(order).toEqual([...W3_O01_C_RECOVERY_ORDER]);
    expect(result.restoredOwners).toEqual([...W3_O01_C_RECOVERY_ORDER]);
    expect(reporting2.getDefinition('def-order-1')?.name).toBe('Ordered');
    expect(notifications2.getPreferences('ws-1', 'user-1')).toBeDefined();
  });

  it('owner restoration + inventory consistency: SURVIVE covered; EPHEMERAL excluded', () => {
    expect([...surviveArtifactsRestored()].sort()).toEqual(
      [...W3_O01_C_RECOVERY_COVERAGE.map((row) => row.artifactId)].sort(),
    );
    for (const id of ephemeralArtifactsNotRecovered()) {
      expect(surviveArtifactsRestored()).not.toContain(id);
    }
    expect(
      W3_O01_A_ANALYTICAL_INVENTORY.filter((row) => row.requiredDurability === 'SURVIVE').every(
        (row) => row.restartSurvivability === 'restored-after-normal-restart',
      ),
    ).toBe(true);
  });

  it('recovery dependency validation + transition safety + non-claims', () => {
    expect(transitionSafetyAnswers()).toEqual({
      canRestorePreviouslyPersistedArtifacts: true,
      canRecoverWithoutOwnershipChanges: true,
      canRecoverWithoutPersistenceRedesign: true,
      backwardCompatibilityPreserved: true,
      w3O01aInventoryRemainsValid: true,
    });
    expect(W3_O01_C_SLICE_ID).toBe('W3-O01-c');
    expect(W3_O01_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(W3_O01_C_ARCHITECTURE_CLAIMS.businessContinuity).toBe(false);
    expect(W3_O01_C_ARCHITECTURE_CLAIMS.highAvailability).toBe(false);
    expect(W3_O01_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O01_C_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
  });

  it('required reports exist for W3-O01-c', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o01-c-implementation-report.md',
      'w3-o01-c-architecture-review.md',
      'w3-o01-c-security-review.md',
      'w3-o01-c-product-review.md',
      'w3-o01-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });

  it('persist helper still write-through for regression with W3-O01-b', async () => {
    const prisma = createSnapshotPrismaMock();
    await saveOwnerStoreSnapshot(prisma as never, 'market-state', { ok: true });
    expect(await loadRecoverableOwnerSnapshot(prisma as never, 'market-state')).toEqual({
      ok: true,
    });
  });
});

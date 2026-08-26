import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  loadOwnerStoreSnapshot,
  saveOwnerStoreSnapshot,
  W3_O01_B_DURABLE_OWNERS,
} from '../persistence/analytical-owner-store-snapshot';
import { DurableReportingStore } from '../modules/reporting/adapters/durable-reporting-store';
import {
  W3_O01_A_ANALYTICAL_INVENTORY,
  W3_O01_A_PORT_PERSISTENCE_FLAGS,
} from './w3-o01-a-analytical-inventory';
import {
  W3_O01_B_ARCHITECTURE_CLAIMS,
  W3_O01_B_DURABLE_COVERAGE,
  W3_O01_B_EPHEMERAL_EXCLUDED,
  W3_O01_B_SLICE_ID,
  durableOwnersCovered,
} from './w3-o01-b-durable-persistence';

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

describe('W3-O01-b durable persistence — unit', () => {
  it('persistence correctness: durable reporting store write-through upserts owner snapshot', async () => {
    const prisma = createSnapshotPrismaMock();
    const store = new DurableReportingStore(prisma as never);
    await store.hydrate();

    store.putDefinition({
      reportDefinitionId: 'def-1',
      workspaceId: 'ws-1',
      name: 'Demo',
      createdAt: '2026-08-26T00:00:00.000Z',
    } as never);

    const saved = await loadOwnerStoreSnapshot(prisma as never, 'reporting');
    expect(saved).toMatchObject({
      definitions: [expect.objectContaining({ reportDefinitionId: 'def-1' })],
    });

    const restored = new DurableReportingStore(prisma as never);
    await restored.hydrate();
    expect(restored.getDefinition('def-1')?.workspaceId).toBe('ws-1');
  });

  it('persistence ownership: only approved durable owners are snapshotted', () => {
    expect([...W3_O01_B_DURABLE_OWNERS].sort()).toEqual([...durableOwnersCovered()].sort());
    for (const owner of W3_O01_B_DURABLE_OWNERS) {
      expect(W3_O01_A_PORT_PERSISTENCE_FLAGS[owner]).toBe(true);
    }
    expect(W3_O01_A_PORT_PERSISTENCE_FLAGS['ai-analytics']).toBe(false);
  });

  it('artifact coverage: every SURVIVE inventory artifact is covered; EPHEMERAL excluded', () => {
    const surviveIds = W3_O01_A_ANALYTICAL_INVENTORY.filter(
      (row) => row.requiredDurability === 'SURVIVE',
    ).map((row) => row.artifactId);
    const coveredIds = W3_O01_B_DURABLE_COVERAGE.map((row) => row.artifactId);
    expect(coveredIds.sort()).toEqual([...surviveIds].sort());
    for (const excluded of W3_O01_B_EPHEMERAL_EXCLUDED) {
      expect(coveredIds).not.toContain(excluded);
    }
  });

  it('persistence helper round-trips owner snapshots', async () => {
    const prisma = createSnapshotPrismaMock();
    await saveOwnerStoreSnapshot(prisma as never, 'market-state', { ok: true });
    expect(await loadOwnerStoreSnapshot(prisma as never, 'market-state')).toEqual({ ok: true });
  });
});

describe('W3-O01-b durable persistence — integration', () => {
  it('inventory consistency: coverage owners match W3-O01-a SURVIVE owners', () => {
    const inventoryOwners = [
      ...new Set(
        W3_O01_A_ANALYTICAL_INVENTORY.filter((row) => row.requiredDurability === 'SURVIVE').map(
          (row) => row.owner,
        ),
      ),
    ].sort();
    expect(durableOwnersCovered()).toEqual(inventoryOwners);
  });

  it('owner consistency: each coverage row maps to an existing durable adapter file', () => {
    for (const row of W3_O01_B_DURABLE_COVERAGE) {
      expect(existsSync(join(REPO_ROOT, row.durableAdapter))).toBe(true);
    }
  });

  it('persistence lifecycle: no recovery / continuity claims from this slice', () => {
    expect(W3_O01_B_SLICE_ID).toBe('W3-O01-b');
    expect(W3_O01_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W3_O01_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W3_O01_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O01_B_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W3_O01_B_ARCHITECTURE_CLAIMS.newKnowledgeLake).toBe(false);
    expect(W3_O01_B_ARCHITECTURE_CLAIMS.newOutbox).toBe(false);
  });

  it('required reports exist for W3-O01-b', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o01-b-implementation-report.md',
      'w3-o01-b-architecture-review.md',
      'w3-o01-b-security-review.md',
      'w3-o01-b-product-review.md',
      'w3-o01-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });

  it('migration for analytical owner snapshots exists', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'apps/api/prisma/migrations/20260826210000_w3_o01_b_analytical_owner_store_snapshots/migration.sql',
        ),
      ),
    ).toBe(true);
  });
});

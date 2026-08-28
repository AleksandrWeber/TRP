import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { KrakenExchangeConnectivityPersistenceService } from '../modules/exchange-adapter/kraken-exchange-connectivity-persistence.service';
import { KrakenExchangeConnectivityRecoveryStore } from '../modules/exchange-adapter/kraken-exchange-connectivity-recovery-store';
import { PrismaKrakenExchangeConnectivityStateRepository } from '../modules/exchange-adapter/persistence/prisma-kraken-exchange-connectivity-state.repository';
import {
  rowsEphemeral,
  rowsExchangeConnectivitySurvive,
} from './w4-e04-a-exchange-connectivity-inventory';
import {
  W4_E04_B_ARCHITECTURE_CLAIMS,
  W4_E04_B_DURABLE_COVERAGE,
  W4_E04_B_EXCHANGE_CONNECTIVITY_OWNER,
  W4_E04_B_EXPLICIT_OUT,
  W4_E04_B_NEW_PERSISTED_ARTIFACT_IDS,
  W4_E04_B_PREEXISTING_SURVIVE_ARTIFACT_IDS,
  W4_E04_B_SLICE_ID,
  W4_E04_B_TECHNICAL_DEBT_DELTA,
  W4_E04_B_TRANSITION_MATRIX,
  newPersistedInventoryRows,
  persistedArtifactIds,
  preexistingSurviveInventoryRows,
} from './w4-e04-b-durable-exchange-connectivity';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceKrakenExchangeConnectivityState: {
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

describe('W4-E04-b durable Kraken exchange connectivity — unit', () => {
  it('persistence correctness: connection anchor write-through upserts workspace row', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaKrakenExchangeConnectivityStateRepository(prisma as never);
    const service = new KrakenExchangeConnectivityPersistenceService(
      repository,
      new KrakenExchangeConnectivityRecoveryStore(),
    );

    const outcome = await service.persistConnectionManagementAnchor({
      workspaceId: 'ws-a',
      connectionId: 'conn-kraken-1',
      actorId: 'actor-1',
      recordedAt: '2026-08-28T16:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadState('ws-a');
    expect(loaded).toMatchObject({
      workspaceId: 'ws-a',
      exchangeIdentifier: 'KRAKEN',
      connectionAnchorConnectionId: 'conn-kraken-1',
    });
    expect(loaded).not.toHaveProperty('connected');
  });

  it('artifact coverage: only approved new SURVIVE row is persisted by this slice', () => {
    expect([...persistedArtifactIds()].sort()).toEqual(
      [...W4_E04_B_NEW_PERSISTED_ARTIFACT_IDS].sort(),
    );
    const rows = newPersistedInventoryRows();
    expect(rows.length).toBe(W4_E04_B_NEW_PERSISTED_ARTIFACT_IDS.length);
    for (const row of rows) {
      expect(row.artifactId).toBe('persist-kraken-connection-continuity');
      expect(row.durabilityClass).toBe('SURVIVE');
    }
  });

  it('pre-existing SURVIVE rows remain on vault / connection-management / exchange-adapter owners', () => {
    const preexisting = preexistingSurviveInventoryRows();
    expect(preexisting.length).toBe(W4_E04_B_PREEXISTING_SURVIVE_ARTIFACT_IDS.length);
    const owners = new Set(preexisting.map((row) => row.owner));
    expect(owners.has('secret-vault')).toBe(true);
    expect(owners.has('connection-management')).toBe(true);
    expect(owners.has('exchange-adapter')).toBe(true);
  });

  it('ownership: Kraken exchange connectivity persistence remains on exchange-adapter owner only', () => {
    expect(W4_E04_B_EXCHANGE_CONNECTIVITY_OWNER).toBe('exchange-adapter');
    for (const row of W4_E04_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('exchange-adapter');
    }
  });

  it('EPHEMERAL inventory rows are not in new durable coverage', () => {
    const covered = new Set(persistedArtifactIds());
    for (const row of rowsEphemeral()) {
      expect(covered.has(row.artifactId)).toBe(false);
    }
  });

  it('transition matrix: inventory → durable persistence → restart recovery still missing', () => {
    expect(W4_E04_B_TRANSITION_MATRIX.before).toContain('Inventory');
    expect(W4_E04_B_TRANSITION_MATRIX.after).toContain('Durable Persistence');
    expect(W4_E04_B_TRANSITION_MATRIX.stillMissing.some((item) => item.includes('Restart'))).toBe(
      true,
    );
  });
});

describe('W4-E04-b durable Kraken exchange connectivity — integration', () => {
  it('persistence lifecycle: no recovery / I/O / continuity claims from this slice', () => {
    expect(W4_E04_B_SLICE_ID).toBe('W4-E04-b');
    expect(W4_E04_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W4_E04_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W4_E04_B_ARCHITECTURE_CLAIMS.restImplementation).toBe(false);
    expect(W4_E04_B_ARCHITECTURE_CLAIMS.websocketImplementation).toBe(false);
    expect(W4_E04_B_ARCHITECTURE_CLAIMS.exchangeIoEstablished).toBe(false);
    expect(W4_E04_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W4_E04_B_ARCHITECTURE_CLAIMS.exchangeConnectivityRestartSurvivalClaimed).toBe(false);
    expect(W4_E04_B_ARCHITECTURE_CLAIMS.w4E01Reopened).toBe(false);
    expect(W4_E04_B_ARCHITECTURE_CLAIMS.w4E02Reopened).toBe(false);
    expect(W4_E04_B_ARCHITECTURE_CLAIMS.w4E03Reopened).toBe(false);
  });

  it('technical debt delta: persistence foundation resolved; recovery deferred', () => {
    expect(W4_E04_B_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W4_E04_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W4_E04_B_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.includes('restart'))).toBe(
      true,
    );
  });

  it('explicit OUT covers restart recovery and W4-E04-c', () => {
    expect(W4_E04_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['restart-recovery', 'w4-e04-c', 'rest-connectivity']),
    );
  });

  it('owner consistency: each coverage row maps to existing adapter and service files', () => {
    for (const row of W4_E04_B_DURABLE_COVERAGE) {
      expect(existsSync(join(REPO_ROOT, row.prismaAdapter))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.persistenceService))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.repositoryPort))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.migration))).toBe(true);
    }
  });

  it('SURVIVE inventory includes rows beyond new persistence — not all are W4-E04-b targets', () => {
    expect(rowsExchangeConnectivitySurvive().length).toBeGreaterThan(
      W4_E04_B_NEW_PERSISTED_ARTIFACT_IDS.length,
    );
  });

  it('required reports exist for W4-E04-b', () => {
    const wave4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');
    for (const name of [
      'w4-e04-b-implementation-report.md',
      'w4-e04-b-architecture-review.md',
      'w4-e04-b-security-review.md',
      'w4-e04-b-product-review.md',
      'w4-e04-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave4, name))).toBe(true);
    }
  });
});

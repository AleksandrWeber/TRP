import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PrismaKillSwitchStateRepository } from '../modules/trading-session/persistence/prisma-kill-switch-state.repository';
import { KillSwitchPersistenceService } from '../modules/trading-session/kill-switch/kill-switch-persistence.service';
import { KillSwitchRecoveryStore } from '../modules/trading-session/kill-switch/kill-switch-recovery-store';
import { W3_O04_A_KILL_SWITCH_INVENTORY, rowsSurvive } from './w3-o04-a-kill-switch-inventory';
import {
  W3_O04_B_ARCHITECTURE_CLAIMS,
  W3_O04_B_DURABLE_COVERAGE,
  W3_O04_B_EXPLICIT_OUT,
  W3_O04_B_KILL_SWITCH_OWNER,
  W3_O04_B_PERSISTED_ARTIFACT_IDS,
  W3_O04_B_SLICE_ID,
  W3_O04_B_TECHNICAL_DEBT_DELTA,
  paperSurviveInventoryRows,
  persistedArtifactIds,
} from './w3-o04-b-durable-kill-switch-persistence';

const REPO_ROOT = join(__dirname, '../../../..');

function createPrismaMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceKillSwitchState: {
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
    },
    _rows: rows,
  };
}

describe('W3-O04-b durable kill switch persistence — unit', () => {
  it('persistence correctness: armed state write-through upserts workspace row', async () => {
    const prisma = createPrismaMock();
    const repository = new PrismaKillSwitchStateRepository(prisma as never);
    const service = new KillSwitchPersistenceService(repository, new KillSwitchRecoveryStore());

    const outcome = await service.persistArmed({
      workspaceId: 'ws-a',
      actorId: 'actor-1',
      reason: 'halt',
      recordedAt: '2026-08-27T18:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);

    const loaded = await service.loadState('ws-a');
    expect(loaded).toMatchObject({ workspaceId: 'ws-a', armed: true, reason: 'halt' });
  });

  it('artifact coverage: only approved SURVIVE paper rows are persisted', () => {
    expect([...persistedArtifactIds()].sort()).toEqual([...W3_O04_B_PERSISTED_ARTIFACT_IDS].sort());
    const paperSurvive = paperSurviveInventoryRows();
    expect(paperSurvive.length).toBe(W3_O04_B_PERSISTED_ARTIFACT_IDS.length);
    for (const row of paperSurvive) {
      expect(row.durabilityClass).toBe('SURVIVE');
      expect(row.owner).toBe('trading-session');
    }
  });

  it('ownership: kill switch persistence remains on trading-session owner only', () => {
    expect(W3_O04_B_KILL_SWITCH_OWNER).toBe('trading-session');
    for (const row of W3_O04_B_DURABLE_COVERAGE) {
      expect(row.owner).toBe('trading-session');
    }
  });

  it('EPHEMERAL inventory rows are not in durable coverage', () => {
    const covered = new Set(persistedArtifactIds());
    const ephemeralPaper = W3_O04_A_KILL_SWITCH_INVENTORY.filter(
      (row) => row.isPaperProduct && row.durabilityClass === 'EPHEMERAL',
    );
    for (const row of ephemeralPaper) {
      expect(covered.has(row.artifactId)).toBe(false);
    }
  });

  it('live SURVIVE rows remain outside O04-b paper persistence scope', () => {
    const covered = new Set(persistedArtifactIds());
    const liveSurvive = rowsSurvive().filter((row) => !row.isPaperProduct);
    expect(liveSurvive.length).toBeGreaterThan(0);
    for (const row of liveSurvive) {
      expect(covered.has(row.artifactId)).toBe(false);
    }
  });
});

describe('W3-O04-b durable kill switch persistence — integration', () => {
  it('persistence lifecycle: no recovery / execution / continuity claims from this slice', () => {
    expect(W3_O04_B_SLICE_ID).toBe('W3-O04-b');
    expect(W3_O04_B_ARCHITECTURE_CLAIMS.automaticRestartRecovery).toBe(false);
    expect(W3_O04_B_ARCHITECTURE_CLAIMS.operationalContinuityGuaranteed).toBe(false);
    expect(W3_O04_B_ARCHITECTURE_CLAIMS.killSwitchExecutionImplemented).toBe(false);
    expect(W3_O04_B_ARCHITECTURE_CLAIMS.admissionPolicyWired).toBe(false);
    expect(W3_O04_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O04_B_ARCHITECTURE_CLAIMS.paperRestartSurvivalClaimed).toBe(false);
  });

  it('technical debt delta: TD-047 persistence foundation resolved; recovery deferred', () => {
    expect(W3_O04_B_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W3_O04_B_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W3_O04_B_TECHNICAL_DEBT_DELTA.deferred.some((item) => item.includes('restart'))).toBe(
      true,
    );
  });

  it('explicit OUT covers restart recovery and W3-O04-c', () => {
    expect(W3_O04_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['restart-recovery', 'w3-o04-c', 'second-kill-switch-engine']),
    );
  });

  it('owner consistency: each coverage row maps to existing adapter and service files', () => {
    for (const row of W3_O04_B_DURABLE_COVERAGE) {
      expect(existsSync(join(REPO_ROOT, row.prismaAdapter))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.persistenceService))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.repositoryPort))).toBe(true);
      expect(existsSync(join(REPO_ROOT, row.migration))).toBe(true);
    }
  });

  it('required reports exist for W3-O04-b', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o04-b-implementation-report.md',
      'w3-o04-b-architecture-review.md',
      'w3-o04-b-security-review.md',
      'w3-o04-b-product-review.md',
      'w3-o04-b-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});

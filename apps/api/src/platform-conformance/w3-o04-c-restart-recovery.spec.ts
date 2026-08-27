import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildArmedKillSwitchState } from '../modules/trading-session/domain/durable-kill-switch-state';
import {
  KillSwitchRestartRecoveryError,
  prepareKillSwitchStatesForRecovery,
} from '../modules/trading-session/domain/kill-switch-restart-recovery';
import { KillSwitchRecoveryStore } from '../modules/trading-session/kill-switch/kill-switch-recovery-store';
import { KillSwitchRestartRecoveryService } from '../modules/trading-session/kill-switch/kill-switch-restart-recovery.service';
import { PrismaKillSwitchStateRepository } from '../modules/trading-session/persistence/prisma-kill-switch-state.repository';
import {
  W3_O04_C_ARCHITECTURE_CLAIMS,
  W3_O04_C_EXPLICIT_OUT,
  W3_O04_C_KILL_SWITCH_OWNER,
  W3_O04_C_RECOVERED_ARTIFACT_IDS,
  W3_O04_C_SLICE_ID,
  W3_O04_C_TECHNICAL_DEBT_DELTA,
  W3_O04_C_TRANSITION_MATRIX,
} from './w3-o04-c-restart-recovery';

const REPO_ROOT = join(__dirname, '../../../..');
const recordedAt = '2026-08-27T18:00:00.000Z';

function armed(workspaceId: string) {
  const outcome = buildArmedKillSwitchState({
    workspaceId,
    actorId: 'actor-1',
    reason: 'halt',
    recordedAt,
    prior: null,
  });
  if (!outcome.ok) throw new Error('expected armed');
  return outcome.state;
}

function createPrismaMock(rows: Record<string, unknown>[]) {
  const store = new Map(rows.map((row) => [row.workspaceId as string, row]));
  return {
    workspaceKillSwitchState: {
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

describe('W3-O04-c kill switch restart recovery — unit', () => {
  it('ownership remains trading-session only', () => {
    expect(W3_O04_C_KILL_SWITCH_OWNER).toBe('trading-session');
  });

  it('corrupt armed state fails honestly', () => {
    const bad = Object.freeze({ ...armed('ws-1'), armedAt: null });
    expect(() => prepareKillSwitchStatesForRecovery([bad])).toThrow(KillSwitchRestartRecoveryError);
  });

  it('missing persisted state recovers empty without fabrication', async () => {
    const repository = new PrismaKillSwitchStateRepository(createPrismaMock([]) as never);
    const service = new KillSwitchRestartRecoveryService(repository, new KillSwitchRecoveryStore());
    const diagnostics = await service.hydrate();
    expect(diagnostics.restoredCount).toBe(0);
    expect(service.getRecoveredState('ws-1')).toBeNull();
  });
});

describe('W3-O04-c kill switch restart recovery — integration', () => {
  it('recover persisted armed state after normal restart (new store + hydrate)', async () => {
    const state = armed('ws-1');
    const prisma = createPrismaMock([
      {
        workspaceId: state.workspaceId,
        armed: state.armed,
        reason: state.reason,
        armedAt: new Date(state.armedAt!),
        armedByActorId: state.armedByActorId,
        clearedAt: null,
        clearedByActorId: null,
        correlationId: null,
        schemaVersion: 1,
        updatedAt: new Date(state.updatedAt),
      },
    ]);
    const repository = new PrismaKillSwitchStateRepository(prisma as never);
    const recoveryStore = new KillSwitchRecoveryStore();
    const service = new KillSwitchRestartRecoveryService(repository, recoveryStore);

    const diagnostics = await service.hydrate();
    expect(diagnostics.armedCount).toBe(1);
    expect(service.getRecoveredState('ws-1')?.armed).toBe(true);
    expect(W3_O04_C_ARCHITECTURE_CLAIMS.normalProcessRestartRecovery).toBe(true);
    expect(W3_O04_C_ARCHITECTURE_CLAIMS.killSwitchStateRestoredAfterRestart).toBe(true);
  });

  it('recovery idempotency: hydrate twice yields same diagnostics', async () => {
    const state = armed('ws-a');
    const prisma = createPrismaMock([
      {
        workspaceId: state.workspaceId,
        armed: true,
        reason: state.reason,
        armedAt: new Date(state.armedAt!),
        armedByActorId: state.armedByActorId,
        clearedAt: null,
        clearedByActorId: null,
        correlationId: null,
        schemaVersion: 1,
        updatedAt: new Date(state.updatedAt),
      },
    ]);
    const service = new KillSwitchRestartRecoveryService(
      new PrismaKillSwitchStateRepository(prisma as never),
      new KillSwitchRecoveryStore(),
    );
    const first = await service.hydrate();
    const second = await service.hydrate();
    expect(first).toEqual(second);
    expect(W3_O04_C_ARCHITECTURE_CLAIMS.recoveryIdempotent).toBe(true);
  });

  it('transition matrix documents persistence → recovery → still missing', () => {
    expect(W3_O04_C_TRANSITION_MATRIX.before).toContain('Persistence only (W3-O04-b)');
    expect(W3_O04_C_TRANSITION_MATRIX.after).toContain('Restart recovery (W3-O04-c)');
    expect(W3_O04_C_TRANSITION_MATRIX.stillMissing).toContain('Operational continuity (W3-O04-d)');
  });

  it('technical debt delta resolves TD-047 restart recovery foundation', () => {
    expect(W3_O04_C_TECHNICAL_DEBT_DELTA.resolved[0]).toMatch(/restart recovery/i);
    expect(W3_O04_C_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
  });

  it('explicit OUT covers operational continuity and W3-O04-d', () => {
    expect(W3_O04_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining(['operational-continuity', 'w3-o04-d', 'command-center-controls']),
    );
  });

  it('architecture claims deny operational continuity and production restart safe', () => {
    expect(W3_O04_C_SLICE_ID).toBe('W3-O04-c');
    expect(W3_O04_C_ARCHITECTURE_CLAIMS.operationalContinuity).toBe(false);
    expect(W3_O04_C_ARCHITECTURE_CLAIMS.productionRestartSafe).toBe(false);
    expect(W3_O04_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O04_C_RECOVERED_ARTIFACT_IDS.length).toBe(2);
  });

  it('required reports exist for W3-O04-c', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o04-c-implementation-report.md',
      'w3-o04-c-architecture-review.md',
      'w3-o04-c-security-review.md',
      'w3-o04-c-product-review.md',
      'w3-o04-c-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});

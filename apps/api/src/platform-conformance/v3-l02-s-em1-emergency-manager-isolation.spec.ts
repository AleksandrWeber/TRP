/**
 * V3-L02-S-EM1 — EmergencyManager isolation regression (SB-05).
 * No live venue I/O. No production credentials. Deterministic unit tests.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { EmergencyManager } from '../modules/live-trading-engine/emergency-manager';
import { KillSwitchPersistenceService } from '../modules/trading-session/kill-switch/kill-switch-persistence.service';
import { KillSwitchRecoveryStore } from '../modules/trading-session/kill-switch/kill-switch-recovery-store';
import { PrismaKillSwitchStateRepository } from '../modules/trading-session/persistence/prisma-kill-switch-state.repository';
import {
  WorkspaceLivePolicy,
  type DurableWorkspaceLivePolicyState,
} from '../modules/workspace/live-policy/durable-workspace-live-policy-state';
import { InMemoryWorkspaceLivePolicyStateRepository } from '../modules/workspace/live-policy/persistence/in-memory-workspace-live-policy-state.repository';
import { WorkspaceLivePolicyAdminService } from '../modules/workspace/live-policy/workspace-live-policy-admin.service';
import { WorkspaceLivePolicyPersistenceService } from '../modules/workspace/live-policy/workspace-live-policy-persistence.service';
import {
  V3_L02_S_EM1_CANONICAL_PATH_MODULE_ROOTS,
  V3_L02_S_EM1_FORBIDDEN_IMPORT_SEGMENTS,
  V3_L02_S_EM1_SLICE_ID,
} from './v3-l02-s-em1-emergency-manager-isolation';

const MODULES_ROOT = join(process.cwd(), 'src/modules');

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...listTsFiles(full));
    } else if (full.endsWith('.ts') && !full.endsWith('.spec.ts')) {
      out.push(full);
    }
  }
  return out;
}

function importPaths(source: string): string[] {
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!);
}

function createPrismaKillSwitchMock() {
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
  };
}

describe(`V3-L02-S-EM1 EmergencyManager isolation (${V3_L02_S_EM1_SLICE_ID})`, () => {
  it('Test E — canonical L02 path modules do not import EmergencyManager / live-trading-engine', () => {
    const violations: string[] = [];
    for (const root of V3_L02_S_EM1_CANONICAL_PATH_MODULE_ROOTS) {
      const dir = join(MODULES_ROOT, root);
      for (const file of listTsFiles(dir)) {
        const source = readFileSync(file, 'utf8');
        const rel = file.split('/modules/')[1] ?? file;
        for (const importPath of importPaths(source)) {
          const normalized = importPath.replace(/\\/g, '/');
          for (const forbidden of V3_L02_S_EM1_FORBIDDEN_IMPORT_SEGMENTS) {
            if (normalized.includes(forbidden)) {
              violations.push(`${rel} → ${importPath}`);
            }
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('Test A — order / execution cancel surfaces have no EmergencyManager dependency', () => {
    const cancelSurfaceFiles = [
      join(MODULES_ROOT, 'orders/order.service.ts'),
      join(MODULES_ROOT, 'execution-engine/execution-engine.service.ts'),
      join(MODULES_ROOT, 'canonical-order-path/canonical-order-path.service.ts'),
    ];
    for (const file of cancelSurfaceFiles) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/EmergencyManager/);
      expect(source).not.toMatch(/live-trading-engine/);
      expect(source).not.toMatch(/activateKillSwitch/);
      expect(source).not.toMatch(/cancel-all|cancelAll|Cancel All/i);
    }
  });

  it('Test B — durable Kill Switch arming does not invoke EmergencyManager / cancel-all', async () => {
    const activateSpy = vi.spyOn(EmergencyManager.prototype, 'activateKillSwitch');
    const prisma = createPrismaKillSwitchMock();
    const repository = new PrismaKillSwitchStateRepository(prisma as never);
    const service = new KillSwitchPersistenceService(repository, new KillSwitchRecoveryStore());

    const outcome = await service.persistArmed({
      workspaceId: 'ws-em1',
      actorId: 'actor-1',
      reason: 'L02-S-EM1 isolation probe',
      recordedAt: '2026-09-17T12:00:00.000Z',
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.state.armed).toBe(true);
    }

    const ksSource = readFileSync(
      join(MODULES_ROOT, 'trading-session/kill-switch/kill-switch-persistence.service.ts'),
      'utf8',
    );
    for (const importPath of importPaths(ksSource)) {
      expect(importPath).not.toMatch(/live-trading-engine|emergency-manager/i);
    }
    expect(activateSpy).not.toHaveBeenCalled();
    activateSpy.mockRestore();
  });

  it('Test C — live policy disable does not invoke EmergencyManager / cancel-all', async () => {
    const activateSpy = vi.spyOn(EmergencyManager.prototype, 'activateKillSwitch');

    class StagingRepo extends InMemoryWorkspaceLivePolicyStateRepository {
      private readonly staged = new WeakMap<object, DurableWorkspaceLivePolicyState>();
      override async saveLivePolicyState(
        state: DurableWorkspaceLivePolicyState,
        transaction?: unknown,
      ): Promise<void> {
        if (transaction) {
          this.staged.set(transaction as object, state);
          return;
        }
        await super.saveLivePolicyState(state);
      }
      commit(transaction: unknown): void {
        const state = this.staged.get(transaction as object);
        if (state) {
          void super.saveLivePolicyState(state);
          this.staged.delete(transaction as object);
        }
      }
      discard(transaction: unknown): void {
        this.staged.delete(transaction as object);
      }
    }

    const repository = new StagingRepo();
    const livePolicy = new WorkspaceLivePolicyPersistenceService(repository);
    const transactions = {
      run: async <T>(work: (tx: object) => Promise<T>): Promise<T> => {
        const tx = Object.freeze({});
        try {
          const result = await work(tx);
          repository.commit(tx);
          return result;
        } catch (error) {
          repository.discard(tx);
          throw error;
        }
      },
    };
    const audit = {
      record: vi.fn(async () => ({ id: 'audit-em1' })),
    };
    const logger = {
      child: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      }),
    };

    const admin = new WorkspaceLivePolicyAdminService(
      livePolicy,
      transactions as never,
      audit as never,
      logger as never,
    );

    await livePolicy.persistPolicy({
      workspaceId: 'ws-em1',
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
    });
    const view = await admin.disable({ workspaceId: 'ws-em1', actorUserId: 'admin-1' });
    expect(view.policy).toBe(WorkspaceLivePolicy.PAPER);
    expect(view.liveTradingAuthorized).toBe(false);
    expect(activateSpy).not.toHaveBeenCalled();

    const policySource = readFileSync(
      join(MODULES_ROOT, 'workspace/live-policy/workspace-live-policy-admin.service.ts'),
      'utf8',
    );
    for (const importPath of importPaths(policySource)) {
      expect(importPath).not.toMatch(/live-trading-engine|emergency-manager/i);
    }
    activateSpy.mockRestore();
  });

  it('Test D — TradingSession stop path does not reference EmergencyManager / cancel-all', () => {
    const sessionService = readFileSync(
      join(MODULES_ROOT, 'trading-session/trading-session.service.ts'),
      'utf8',
    );
    expect(sessionService).toMatch(/async stop\(/);
    expect(sessionService).not.toMatch(/EmergencyManager/);
    expect(sessionService).not.toMatch(/live-trading-engine/);
    expect(sessionService).not.toMatch(/activateKillSwitch/);
    expect(sessionService).not.toMatch(/cancel-all|cancelAll/i);

    // stop() only transitions session + optional runtime.stop — no order cancel-all.
    const stopBlock = sessionService.slice(
      sessionService.indexOf('async stop('),
      sessionService.indexOf('async heartbeat('),
    );
    expect(stopBlock).toMatch(/TradingSessionStatus\.STOPPED/);
    expect(stopBlock).not.toMatch(/orders\.cancel|cancel\(/);
  });

  it('AC-EM1-05/06 — EmergencyManager remains a separate capability; no new cancel-all subsystem', () => {
    const emSource = readFileSync(
      join(MODULES_ROOT, 'live-trading-engine/emergency-manager.ts'),
      'utf8',
    );
    expect(emSource).toMatch(/NON-SoT for V3-L02/);
    expect(emSource).toMatch(/Cancel All Orders/);
    // Slice did not invent a second cancel-all type/name in canonical path.
    for (const root of ['orders', 'execution-engine', 'trading-session/kill-switch']) {
      const dir = join(MODULES_ROOT, root);
      for (const file of listTsFiles(dir)) {
        const source = readFileSync(file, 'utf8');
        expect(source).not.toMatch(/class\s+\w*CancelAll\w*/);
        expect(source).not.toMatch(/newCancelAllSubsystem/);
      }
    }
  });
});

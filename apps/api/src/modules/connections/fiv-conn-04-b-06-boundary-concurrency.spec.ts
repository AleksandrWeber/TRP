/**
 * FIV-CONN-04-B-06 / boundary-concurrency — RACE-09 / RACE-10 / AC-B20 cases 2–3.
 * C-B06-05: immediate contention only — no wait/queue/timeout.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import { Conn04MigrationBoundaryService } from './conn04-migration-boundary.service';
import {
  MIGRATION_GATE_KEY_FIV_CONN_04,
  MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
  type MigrationGateGrant,
  type PrivilegedActorContext,
} from './migration-gate';
import type { MigrationGateDurableAuthority } from './migration-gate-durable-authority.port';
import type { MigrationGatePort } from './migration-gate.port';

function grant(overrides: Partial<MigrationGateGrant> = {}): MigrationGateGrant {
  return Object.freeze({
    gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
    purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
    holderId: 'job-1',
    fenceGeneration: 3,
    acquiredAt: '2026-09-18T10:00:00.000Z',
    expiresAt: '2026-09-18T10:15:00.000Z',
    authorizedWindowMs: 4 * 60 * 60 * 1000,
    ...overrides,
  });
}

function operator(overrides: Partial<PrivilegedActorContext> = {}): PrivilegedActorContext {
  return Object.freeze({
    actorId: 'job-1',
    actorKind: 'SYSTEM_JOB' as const,
    ...overrides,
  });
}

/**
 * Simulated privileged D path: requires write-proof first.
 * Spy records only if authority succeeds (N3/N7).
 */
async function attemptPrivilegedD(
  boundary: Conn04MigrationBoundaryService,
  g: MigrationGateGrant,
  dSpy: ReturnType<typeof vi.fn>,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const proof = await boundary.assertWriteAuthority(Object.freeze({}) as TransactionContext, g);
  if (!proof.ok) {
    return { ok: false, reason: proof.reason };
  }
  dSpy();
  return { ok: true };
}

describe('FIV-CONN-04-B-06 boundary concurrency (RACE-09 / RACE-10 / AC-B20)', () => {
  let port: {
    acquire: ReturnType<typeof vi.fn>;
    release: ReturnType<typeof vi.fn>;
    heartbeat: ReturnType<typeof vi.fn>;
    observe: ReturnType<typeof vi.fn>;
    validate: ReturnType<typeof vi.fn>;
  };
  let durable: { assertDurableAuthorityCas: ReturnType<typeof vi.fn> };
  let boundary: Conn04MigrationBoundaryService;
  let dSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    port = {
      acquire: vi.fn(),
      release: vi.fn(),
      heartbeat: vi.fn(),
      observe: vi.fn(),
      validate: vi.fn(),
    };
    durable = { assertDurableAuthorityCas: vi.fn() };
    dSpy = vi.fn();
    boundary = new Conn04MigrationBoundaryService(
      port as unknown as MigrationGatePort,
      durable as unknown as MigrationGateDurableAuthority,
    );
  });

  it('RACE-09 / N3 / B06-AC03: immediate acquire failure → start refuses → D spy NOT entered', async () => {
    // Immediate contention — no wait/queue/timeout (C-B06-05).
    port.acquire.mockResolvedValue({
      ok: false,
      reason: 'GATE_CONTENTION',
      observation: 'CONTENTION_DENIED',
    });

    const start = await boundary.start({ actor: operator() });
    expect(start.ok).toBe(false);
    if (!start.ok) {
      expect(start.reason).toBe('GATE_CONTENTION');
      expect(start.observation).toBe('CONTENTION_DENIED');
    }

    // No valid lease proof ⇒ do not enter D.
    if (start.ok) {
      await attemptPrivilegedD(boundary, start.grant, dSpy);
    }
    expect(dSpy).not.toHaveBeenCalled();
  });

  it('AC-B20 CASE 2 / N6: wrong-fence assertWriteAuthority rejects authority', async () => {
    durable.assertDurableAuthorityCas.mockResolvedValue(false);
    const wrong = grant({ fenceGeneration: 1 });
    const proof = await boundary.assertWriteAuthority(
      Object.freeze({}) as TransactionContext,
      wrong,
    );
    expect(proof.ok).toBe(false);
    if (!proof.ok) {
      expect(proof.reason).toBe('GATE_FENCE_MISMATCH');
      expect(proof.observation).toBe('OWNERSHIP_LOST');
    }
    expect(durable.assertDurableAuthorityCas).toHaveBeenCalledWith(expect.anything(), wrong);
  });

  it('AC-B20 CASE 3 / N7: wrong-fence D execution spy is NOT entered', async () => {
    durable.assertDurableAuthorityCas.mockResolvedValue(false);
    const wrong = grant({ fenceGeneration: 99 });
    const result = await attemptPrivilegedD(boundary, wrong, dSpy);
    expect(result.ok).toBe(false);
    expect(dSpy).not.toHaveBeenCalled();
  });

  it('RACE-10 / N4 / N8: stale grant retry cannot authorize D or release', async () => {
    const stale = grant({ fenceGeneration: 3 });
    durable.assertDurableAuthorityCas.mockResolvedValue(false);
    port.release.mockResolvedValue({
      ok: false,
      reason: 'GATE_FENCE_MISMATCH',
      observation: 'OWNERSHIP_LOST',
    });

    const dAttempt = await attemptPrivilegedD(boundary, stale, dSpy);
    expect(dAttempt.ok).toBe(false);
    expect(dSpy).not.toHaveBeenCalled();

    const release = await boundary.release({ actor: operator(), grant: stale });
    expect(release.ok).toBe(false);
  });

  it('RACE-09 chain: acquire failure yields no grant for downstream D', async () => {
    port.acquire.mockResolvedValue({
      ok: false,
      reason: 'GATE_CONTENTION',
      observation: 'CONTENTION_DENIED',
    });
    const start = await boundary.start({ actor: operator({ actorId: 'loser' }) });
    expect(start.ok).toBe(false);
    expect('grant' in start && start.ok).toBe(false);
    expect(dSpy).not.toHaveBeenCalled();
  });
});

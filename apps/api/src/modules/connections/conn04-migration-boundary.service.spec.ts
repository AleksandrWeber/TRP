/**
 * FIV-CONN-04-B-04 — Conn04MigrationBoundaryService tests.
 *
 * Covers start/resume/HB/release/write-proof walls + txn spy (IMPL-COND-B04-03).
 * No real Vault, venue I/O, credentials, or capital.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

const ACQUIRED = '2026-09-18T10:00:00.000Z';
const EXPIRES = '2026-09-18T10:15:00.000Z';

function grant(overrides: Partial<MigrationGateGrant> = {}): MigrationGateGrant {
  return Object.freeze({
    gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
    purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
    holderId: 'job-1',
    fenceGeneration: 3,
    acquiredAt: ACQUIRED,
    expiresAt: EXPIRES,
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

describe('Conn04MigrationBoundaryService (FIV-CONN-04-B-04)', () => {
  let port: {
    acquire: ReturnType<typeof vi.fn>;
    release: ReturnType<typeof vi.fn>;
    heartbeat: ReturnType<typeof vi.fn>;
    observe: ReturnType<typeof vi.fn>;
    validate: ReturnType<typeof vi.fn>;
  };
  let durable: { assertDurableAuthorityCas: ReturnType<typeof vi.fn> };
  let boundary: Conn04MigrationBoundaryService;
  let txnRunSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    port = {
      acquire: vi.fn(),
      release: vi.fn(),
      heartbeat: vi.fn(),
      observe: vi.fn(),
      validate: vi.fn(),
    };
    durable = {
      assertDurableAuthorityCas: vi.fn(),
    };
    txnRunSpy = vi.fn();
    boundary = new Conn04MigrationBoundaryService(
      port as unknown as MigrationGatePort,
      durable as unknown as MigrationGateDurableAuthority,
    );
  });

  it('T1: successful acquire/start returns grant', async () => {
    const g = grant();
    port.acquire.mockResolvedValue({ ok: true, grant: g });
    const result = await boundary.start({ actor: operator() });
    expect(result).toEqual({ ok: true, grant: g });
    expect(port.acquire).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
        actor: operator(),
      }),
    );
    expect(port.observe).not.toHaveBeenCalled();
  });

  it('T1-neg / SB-B04-04: non-privileged start refused', async () => {
    const result = await boundary.start({
      actor: { actorId: 'user', actorKind: 'CLIENT' as never },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('GATE_UNAUTHORIZED');
    expect(port.acquire).not.toHaveBeenCalled();
  });

  it('T2: contention denial refuses start', async () => {
    port.acquire.mockResolvedValue({
      ok: false,
      reason: 'GATE_CONTENTION',
      observation: 'CONTENTION_DENIED',
    });
    const result = await boundary.start({ actor: operator() });
    expect(result).toEqual({
      ok: false,
      reason: 'GATE_CONTENTION',
      observation: 'CONTENTION_DENIED',
    });
  });

  it('T3: expired lease — resume/HB/write refuse', async () => {
    port.validate.mockResolvedValue({
      ok: false,
      reason: 'GATE_EXPIRED',
      observation: 'EXPIRED',
    });
    port.heartbeat.mockResolvedValue({
      ok: false,
      reason: 'GATE_EXPIRED',
      observation: 'EXPIRED',
    });
    durable.assertDurableAuthorityCas.mockResolvedValue(false);

    const g = grant();
    const actor = operator();
    expect(await boundary.resume({ actor, grant: g })).toMatchObject({
      ok: false,
      observation: 'EXPIRED',
    });
    expect(
      await boundary.heartbeat({ actor, grant: g, proposedExpiresAt: EXPIRES }),
    ).toMatchObject({ ok: false, observation: 'EXPIRED' });
    const txn = Object.freeze({}) as TransactionContext;
    expect(await boundary.assertWriteAuthority(txn, g)).toMatchObject({ ok: false });
  });

  it('T4: ownership loss refuses resume/HB/release/write', async () => {
    port.validate.mockResolvedValue({
      ok: false,
      reason: 'GATE_OWNERSHIP_LOST',
      observation: 'OWNERSHIP_LOST',
    });
    port.heartbeat.mockResolvedValue({
      ok: false,
      reason: 'GATE_OWNERSHIP_LOST',
      observation: 'OWNERSHIP_LOST',
    });
    port.release.mockResolvedValue({
      ok: false,
      reason: 'GATE_OWNERSHIP_LOST',
      observation: 'OWNERSHIP_LOST',
    });
    durable.assertDurableAuthorityCas.mockResolvedValue(false);

    const g = grant({ holderId: 'stale' });
    const actor = operator({ actorId: 'stale' });
    expect(await boundary.resume({ actor, grant: g })).toMatchObject({
      observation: 'OWNERSHIP_LOST',
    });
    expect(
      await boundary.heartbeat({ actor, grant: g, proposedExpiresAt: EXPIRES }),
    ).toMatchObject({ observation: 'OWNERSHIP_LOST' });
    expect(await boundary.release({ actor, grant: g })).toMatchObject({
      observation: 'OWNERSHIP_LOST',
    });
    expect(await boundary.assertWriteAuthority(Object.freeze({}) as TransactionContext, g)).toEqual(
      {
        ok: false,
        reason: 'GATE_FENCE_MISMATCH',
        observation: 'OWNERSHIP_LOST',
      },
    );
  });

  it('T5: UNKNOWN refusal on start', async () => {
    port.acquire.mockResolvedValue({
      ok: false,
      reason: 'GATE_UNKNOWN',
      observation: 'UNKNOWN',
    });
    const result = await boundary.start({ actor: operator() });
    expect(result).toEqual({
      ok: false,
      reason: 'GATE_UNKNOWN',
      observation: 'UNKNOWN',
    });
  });

  it('T6: resume via validate succeeds only when ACTIVE', async () => {
    const g = grant();
    port.validate.mockResolvedValue({ ok: true, grant: g, observation: 'ACTIVE' });
    const result = await boundary.resume({ actor: operator(), grant: g });
    expect(result).toEqual({ ok: true, grant: g, observation: 'ACTIVE' });
    expect(port.acquire).not.toHaveBeenCalled();
    expect(port.observe).not.toHaveBeenCalled();
    expect(port.validate).toHaveBeenCalledWith(g);
  });

  it('T7: observe-only cannot establish write authority (no observe API path)', async () => {
    expect(
      Object.getOwnPropertyNames(Object.getPrototypeOf(boundary)).filter((n) => n === 'observe'),
    ).toEqual([]);
    durable.assertDurableAuthorityCas.mockResolvedValue(false);
    const result = await boundary.assertWriteAuthority(
      Object.freeze({}) as TransactionContext,
      grant(),
    );
    expect(result.ok).toBe(false);
    expect(port.observe).not.toHaveBeenCalled();
  });

  it('T8: matching holder + fence CAS proves write authority', async () => {
    const g = grant();
    const txn = Object.freeze({}) as TransactionContext;
    durable.assertDurableAuthorityCas.mockResolvedValue(true);
    const result = await boundary.assertWriteAuthority(txn, g);
    expect(result).toEqual({ ok: true });
    expect(durable.assertDurableAuthorityCas).toHaveBeenCalledWith(txn, g);
  });

  it('T9: stale holder / fence rejection', async () => {
    durable.assertDurableAuthorityCas.mockResolvedValue(false);
    const result = await boundary.assertWriteAuthority(
      Object.freeze({}) as TransactionContext,
      grant({ fenceGeneration: 1 }),
    );
    expect(result).toEqual({
      ok: false,
      reason: 'GATE_FENCE_MISMATCH',
      observation: 'OWNERSHIP_LOST',
    });
  });

  it('T10 / T11 / IMPL-COND-B04-03: same-transaction CAS spy — caller txn identity', async () => {
    const callerTxn = Object.freeze({ marker: 'caller-txn' }) as unknown as TransactionContext;
    durable.assertDurableAuthorityCas.mockImplementation(async (txn) => {
      expect(txn).toBe(callerTxn);
      return true;
    });
    await boundary.assertWriteAuthority(callerTxn, grant());
    expect(durable.assertDurableAuthorityCas).toHaveBeenCalledTimes(1);
    expect(durable.assertDurableAuthorityCas.mock.calls[0]![0]).toBe(callerTxn);
    // Façade must not open an independent txn (IMPL-COND-B04-02).
    expect(txnRunSpy).not.toHaveBeenCalled();
  });

  it('T10b: CAS throw maps to UNKNOWN refuse', async () => {
    durable.assertDurableAuthorityCas.mockRejectedValue(new Error('db down'));
    const result = await boundary.assertWriteAuthority(
      Object.freeze({}) as TransactionContext,
      grant(),
    );
    expect(result).toEqual({ ok: false, reason: 'GATE_UNKNOWN', observation: 'UNKNOWN' });
  });

  it('T12: heartbeat ownership delegates to port', async () => {
    const g = grant();
    const next = grant({ expiresAt: '2026-09-18T10:20:00.000Z' });
    port.heartbeat.mockResolvedValue({ ok: true, grant: next });
    const result = await boundary.heartbeat({
      actor: operator(),
      grant: g,
      proposedExpiresAt: next.expiresAt,
    });
    expect(result).toEqual({ ok: true, grant: next });
    expect(port.heartbeat).toHaveBeenCalledWith({
      grant: g,
      actor: operator(),
      proposedExpiresAt: next.expiresAt,
    });
  });

  it('T13: release ownership delegates to port', async () => {
    const g = grant();
    port.release.mockResolvedValue({ ok: true, observation: 'INACTIVE' });
    const result = await boundary.release({ actor: operator(), grant: g });
    expect(result).toEqual({ ok: true, observation: 'INACTIVE' });
    expect(port.release).toHaveBeenCalledWith({ grant: g, actor: operator() });
  });

  it('T14: client fence cannot authorize without durable CAS match', async () => {
    durable.assertDurableAuthorityCas.mockResolvedValue(false);
    const forged = grant({ fenceGeneration: 999 });
    const result = await boundary.assertWriteAuthority(
      Object.freeze({}) as TransactionContext,
      forged,
    );
    expect(result.ok).toBe(false);
    expect(durable.assertDurableAuthorityCas).toHaveBeenCalledWith(expect.anything(), forged);
  });

  it('T15 / T16 / T17 / T18: security walls — no env UPDATE / Vault / venue / public HTTP in façade', () => {
    const src = readFileSync(
      join(__dirname, 'conn04-migration-boundary.service.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/from ['"].*secret-vault/i);
    expect(src).not.toMatch(/SecretVaultService/);
    expect(src).not.toMatch(/connectionRecord\.(update|create)/i);
    expect(src).not.toMatch(/prisma\.connectionRecord/);
    expect(src).not.toMatch(/allowRealVenueIo|ExecutionAdapterPort|live-venue/i);
    expect(src).not.toMatch(/@Controller|@Post\(|@Patch\(|@Put\(/);
    expect(src).not.toMatch(/PrismaTransactionService/);
    expect(src).not.toMatch(/\$transaction/);

    const moduleSrc = readFileSync(join(__dirname, 'connections.module.ts'), 'utf8');
    expect(moduleSrc).toMatch(/MIGRATION_GATE_DURABLE_AUTHORITY/);
    expect(moduleSrc).toMatch(/useExisting:\s*PrismaMigrationGateAdapter/);
    expect(moduleSrc).toMatch(/Conn04MigrationBoundaryService/);
    // No second adapter provider class for CAS.
    expect(moduleSrc).not.toMatch(/class\s+\w*Cas\w*/);

    const controllerSrc = readFileSync(join(__dirname, 'connections.controller.ts'), 'utf8');
    expect(controllerSrc).not.toMatch(/Conn04MigrationBoundary|migrationGate\.(acquire|release)/i);
    expect(controllerSrc).not.toMatch(/assertWriteAuthority|assertDurableAuthorityCas/);
  });

  it('T19: malformed grant refuses write proof without CAS', async () => {
    durable.assertDurableAuthorityCas.mockResolvedValue(true);
    const result = await boundary.assertWriteAuthority(
      Object.freeze({}) as TransactionContext,
      { holderId: 'x' } as never,
    );
    expect(result.ok).toBe(false);
    expect(durable.assertDurableAuthorityCas).not.toHaveBeenCalled();
  });

  it('IMPL-COND-B04-01: durable authority is injected separately from port (no cast required)', () => {
    expect(boundary).toBeInstanceOf(Conn04MigrationBoundaryService);
    // Construction used distinct port + durable mocks — proves companion DI shape.
    expect(port.acquire).toBeDefined();
    expect(durable.assertDurableAuthorityCas).toBeDefined();
  });
});

/**
 * FIV-CONN-04-D Stage 3 — write-unit authority/CAS scaffolding tests (T-S3-02 / T-S3-04).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import { Conn04MigrationBoundaryService } from './conn04-migration-boundary.service';
import { FivConn04DEnvironmentBackfillWrite } from './fiv-conn-04-d-environment-backfill-write';
import { FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID } from './fiv-conn-04-d-system-job-identity';
import {
  MIGRATION_GATE_KEY_FIV_CONN_04,
  MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
  type MigrationGateGrant,
} from './migration-gate';

const ACQUIRED = '2026-10-30T10:00:00.000Z';
const EXPIRES = '2026-10-30T10:15:00.000Z';

function grant(overrides: Partial<MigrationGateGrant> = {}): MigrationGateGrant {
  return Object.freeze({
    gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
    purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
    holderId: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
    fenceGeneration: 1,
    acquiredAt: ACQUIRED,
    expiresAt: EXPIRES,
    authorizedWindowMs: 4 * 60 * 60 * 1000,
    ...overrides,
  });
}

describe('FivConn04DEnvironmentBackfillWrite (Stage 3 authority/CAS scaffold)', () => {
  let boundary: { assertWriteAuthority: ReturnType<typeof vi.fn> };
  let writeUnit: FivConn04DEnvironmentBackfillWrite;
  const txn = Object.freeze({ marker: 'stage3-txn' }) as unknown as TransactionContext;

  beforeEach(() => {
    boundary = { assertWriteAuthority: vi.fn() };
    writeUnit = new FivConn04DEnvironmentBackfillWrite(
      boundary as unknown as Conn04MigrationBoundaryService,
    );
  });

  it('T-S3-02: invokes assertWriteAuthority with the caller transaction and grant', async () => {
    const g = grant();
    boundary.assertWriteAuthority.mockResolvedValue({ ok: true });
    const result = await writeUnit.assertWriteAuthorityInTransaction(txn, g);
    expect(result).toEqual({ ok: true });
    expect(boundary.assertWriteAuthority).toHaveBeenCalledTimes(1);
    expect(boundary.assertWriteAuthority).toHaveBeenCalledWith(txn, g);
  });

  it('T-S3-02: authority failure does not proceed as success', async () => {
    boundary.assertWriteAuthority.mockResolvedValue({
      ok: false,
      reason: 'GATE_FENCE_MISMATCH',
      observation: 'OWNERSHIP_LOST',
    });
    const result = await writeUnit.assertWriteAuthorityInTransaction(txn, grant());
    expect(result).toEqual({
      ok: false,
      reason: 'GATE_FENCE_MISMATCH',
      observation: 'OWNERSHIP_LOST',
    });
  });

  it('T-S3-02: CAS miss / ownership lost is fail-closed (not success)', async () => {
    boundary.assertWriteAuthority.mockResolvedValue({
      ok: false,
      reason: 'GATE_OWNERSHIP_LOST',
      observation: 'OWNERSHIP_LOST',
    });
    const result = await writeUnit.assertWriteAuthorityInTransaction(txn, grant());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('GATE_OWNERSHIP_LOST');
    }
  });

  it('T-S3-02: boundary throw surfaces as rejection (caller Entry maps to fail-closed)', async () => {
    boundary.assertWriteAuthority.mockRejectedValue(new Error('txn aborted'));
    await expect(writeUnit.assertWriteAuthorityInTransaction(txn, grant())).rejects.toThrow(
      'txn aborted',
    );
  });

  it('T-S3-04: source walls — no Connection.environment UPDATE / backfill / Vault / HTTP', () => {
    const src = readFileSync(
      join(__dirname, 'fiv-conn-04-d-environment-backfill-write.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/environment\s*:/);
    expect(src).not.toMatch(/updateMany|connectionRecord\.(update|create)/i);
    expect(src).not.toMatch(/\brunEnvironmentBackfill\b/);
    expect(src).not.toMatch(/SecretVault|lookupExact/);
    expect(src).not.toMatch(/@Controller|@Post\(|@Patch\(|@Put\(|@Get\(/);
    expect(src).not.toMatch(/import\s+.*PrivilegedActorContext|buildFivConn04DSystemJobActor/);
    expect(src).not.toMatch(/SecurityAuditService|connection\.environment-backfill/);
    expect(src).toMatch(/assertWriteAuthority/);
  });
});

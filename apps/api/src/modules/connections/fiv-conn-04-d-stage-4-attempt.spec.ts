/**
 * FIV-CONN-04-D Stage 4 PS-A — integrated per-attempt proof path
 * (Connection → ID validation → Vault → occupancy → C → B-04).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import { SecretPurpose } from '../secret-vault/secret-purpose';
import { SecretState } from '../secret-vault/secret-state';
import type { FivConn04DVaultMetadataPort } from '../secret-vault/fiv-conn-04-d-vault-metadata.port';
import { Conn04MigrationBoundaryService } from './conn04-migration-boundary.service';
import { FivConn04DEnvironmentBackfillWrite } from './fiv-conn-04-d-environment-backfill-write';
import { FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID } from './fiv-conn-04-d-system-job-identity';
import { Conn04SystemJobMigrationEntry } from './fiv-conn-04-d-system-job-migration-entry';
import {
  MIGRATION_GATE_KEY_FIV_CONN_04,
  MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
  type MigrationGateGrant,
} from './migration-gate';

const ACQUIRED = '2026-10-31T10:00:00.000Z';
const EXPIRES = '2026-10-31T10:15:00.000Z';

function grant(): MigrationGateGrant {
  return Object.freeze({
    gateKey: MIGRATION_GATE_KEY_FIV_CONN_04,
    purpose: MIGRATION_GATE_PURPOSE_FIV_CONN_04_MIGRATION_BACKFILL,
    holderId: FIV_CONN_04_D_SYSTEM_JOB_ACTOR_ID,
    fenceGeneration: 1,
    acquiredAt: ACQUIRED,
    expiresAt: EXPIRES,
    authorizedWindowMs: 4 * 60 * 60 * 1000,
  });
}

function eligibleConnectionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'conn-1',
    workspaceId: 'ws-a',
    provider: 'binance',
    connectionType: 'EXCHANGE',
    environment: null,
    vaultSecretId: 'vault-1',
    status: 'ACTIVE',
    ...overrides,
  };
}

function okVaultMeta() {
  return {
    ok: true as const,
    metadata: Object.freeze({
      id: 'vault-1',
      workspaceId: 'ws-a',
      purpose: SecretPurpose.TradingLive,
      state: SecretState.Connected,
    }),
  };
}

describe('Conn04SystemJobMigrationEntry Stage 4 PS-A proveStage4AttemptWriteAuthority', () => {
  let boundary: Conn04MigrationBoundaryService;
  let writeUnit: { assertWriteAuthorityInTransaction: ReturnType<typeof vi.fn> };
  let transactions: { run: ReturnType<typeof vi.fn> };
  let vaultMetadata: { lookupExact: ReturnType<typeof vi.fn> };
  let findFirst: ReturnType<typeof vi.fn>;
  let entry: Conn04SystemJobMigrationEntry;

  beforeEach(() => {
    boundary = {} as Conn04MigrationBoundaryService;
    writeUnit = {
      assertWriteAuthorityInTransaction: vi.fn().mockResolvedValue({ ok: true }),
    };
    transactions = {
      run: vi.fn(async (work: (tx: object) => Promise<unknown>) => work({ marker: 's4-txn' })),
    };
    vaultMetadata = {
      lookupExact: vi.fn().mockResolvedValue(okVaultMeta()),
    };
    findFirst = vi.fn();
    entry = new Conn04SystemJobMigrationEntry(
      boundary,
      writeUnit as unknown as FivConn04DEnvironmentBackfillWrite,
      transactions as unknown as PrismaTransactionService,
      vaultMetadata as unknown as FivConn04DVaultMetadataPort,
      { connectionRecord: { findFirst } } as never,
    );
  });

  it('loads trusted Connection, validates IDs, Vault → occupancy → C → B-04 in order on success', async () => {
    const callOrder: string[] = [];
    findFirst.mockImplementation(async (args: { select?: Record<string, boolean> }) => {
      if (args.select && 'provider' in args.select) {
        callOrder.push('connection-load');
        return eligibleConnectionRow();
      }
      callOrder.push('occupancy');
      return null;
    });
    vaultMetadata.lookupExact.mockImplementation(async () => {
      callOrder.push('vault');
      return okVaultMeta();
    });
    writeUnit.assertWriteAuthorityInTransaction.mockImplementation(async () => {
      callOrder.push('b04');
      return { ok: true };
    });

    const result = await entry.proveStage4AttemptWriteAuthority({
      connectionId: 'conn-1',
      workspaceId: 'ws-a',
      grant: grant(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.classification.eligibleLive).toBe(true);
    expect(result.classification.disposition).toBe('ELIGIBLE_LIVE');
    expect(result.occupancy).toEqual({ status: 'verified_vacant' });
    expect(result.writeProof).toEqual({ ok: true });
    expect(callOrder).toEqual(['connection-load', 'vault', 'occupancy', 'b04']);
    expect(vaultMetadata.lookupExact).toHaveBeenCalledWith({
      workspaceId: 'ws-a',
      vaultSecretId: 'vault-1',
    });
  });

  it('blank Connection vaultSecretId fails with PRE_PORT_INVALID_IDENTIFIERS and zero Port I/O', async () => {
    findFirst.mockResolvedValueOnce(eligibleConnectionRow({ vaultSecretId: '   ' }));
    const result = await entry.proveStage4AttemptWriteAuthority({
      connectionId: 'conn-1',
      grant: grant(),
    });
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        stop: 'PRE_PORT_INVALID_IDENTIFIERS',
      }),
    );
    expect(vaultMetadata.lookupExact).not.toHaveBeenCalled();
    expect(writeUnit.assertWriteAuthorityInTransaction).not.toHaveBeenCalled();
  });

  it('missing Connection stops before Vault/occupancy/C/B-04', async () => {
    findFirst.mockResolvedValueOnce(null);
    const result = await entry.proveStage4AttemptWriteAuthority({
      connectionId: 'missing',
      grant: grant(),
    });
    expect(result).toEqual({ ok: false, stop: 'CONNECTION_NOT_FOUND' });
    expect(vaultMetadata.lookupExact).not.toHaveBeenCalled();
    expect(writeUnit.assertWriteAuthorityInTransaction).not.toHaveBeenCalled();
  });

  it('Connection DB throw maps to CONNECTION_UNAVAILABLE with zero Port I/O', async () => {
    findFirst.mockRejectedValueOnce(new Error('db'));
    const result = await entry.proveStage4AttemptWriteAuthority({
      connectionId: 'conn-1',
      grant: grant(),
    });
    expect(result).toEqual({ ok: false, stop: 'CONNECTION_UNAVAILABLE' });
    expect(vaultMetadata.lookupExact).not.toHaveBeenCalled();
  });

  it('rejects workspace mismatch binding (no field mixing across Connections)', async () => {
    findFirst.mockResolvedValueOnce(null); // no row for conn-1 in ws-other
    const result = await entry.proveStage4AttemptWriteAuthority({
      connectionId: 'conn-1',
      workspaceId: 'ws-other',
      grant: grant(),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.stop).toBe('CONNECTION_NOT_FOUND');
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'conn-1', workspaceId: 'ws-other' },
      }),
    );
    expect(vaultMetadata.lookupExact).not.toHaveBeenCalled();
  });

  it.each([
    ['NOT_FOUND', 'VAULT_NOT_FOUND'],
    ['UNAVAILABLE', 'VAULT_UNAVAILABLE'],
    ['INVALID', 'VAULT_INVALID'],
  ] as const)('Vault %s stops before occupancy/C/B-04 as %s', async (reason, stop) => {
    findFirst.mockResolvedValueOnce(eligibleConnectionRow());
    vaultMetadata.lookupExact.mockResolvedValue({ ok: false, reason });
    const occupancySpy = findFirst;
    const result = await entry.proveStage4AttemptWriteAuthority({
      connectionId: 'conn-1',
      grant: grant(),
    });
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        stop,
      }),
    );
    // Only the Connection load findFirst; no occupancy query
    expect(occupancySpy).toHaveBeenCalledTimes(1);
    expect(writeUnit.assertWriteAuthorityInTransaction).not.toHaveBeenCalled();
  });

  it('occupancy unavailable fails closed via C before B-04 (never vacant)', async () => {
    findFirst
      .mockResolvedValueOnce(eligibleConnectionRow())
      .mockRejectedValueOnce(new Error('occupancy read fail'));
    const result = await entry.proveStage4AttemptWriteAuthority({
      connectionId: 'conn-1',
      grant: grant(),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.stop).toBe('C_NOT_ELIGIBLE');
    expect(result.occupancy).toEqual({ status: 'unavailable' });
    expect(result.classification?.disposition).toBe('BLOCKED_OCCUPANCY_UNAVAILABLE');
    expect(result.classification?.eligibleLive).toBe(false);
    expect(writeUnit.assertWriteAuthorityInTransaction).not.toHaveBeenCalled();
  });

  it('occupied slot yields C non-eligible and never reaches B-04', async () => {
    findFirst
      .mockResolvedValueOnce(eligibleConnectionRow())
      .mockResolvedValueOnce({ id: 'conn-peer' });
    const result = await entry.proveStage4AttemptWriteAuthority({
      connectionId: 'conn-1',
      grant: grant(),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.stop).toBe('C_NOT_ELIGIBLE');
    expect(result.occupancy).toEqual({ status: 'occupied', occupantId: 'conn-peer' });
    expect(result.classification?.eligibleLive).toBe(false);
    expect(writeUnit.assertWriteAuthorityInTransaction).not.toHaveBeenCalled();
  });

  it('C non-eligible (e.g. already live) stops before B-04 after Vault+occupancy', async () => {
    findFirst
      .mockResolvedValueOnce(eligibleConnectionRow({ environment: 'live' }))
      .mockResolvedValueOnce(null);
    const result = await entry.proveStage4AttemptWriteAuthority({
      connectionId: 'conn-1',
      grant: grant(),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.stop).toBe('C_NOT_ELIGIBLE');
    expect(vaultMetadata.lookupExact).toHaveBeenCalledTimes(1);
    expect(writeUnit.assertWriteAuthorityInTransaction).not.toHaveBeenCalled();
  });

  it('B-04 deny after eligible C is preserved (no alternate write path)', async () => {
    findFirst.mockResolvedValueOnce(eligibleConnectionRow()).mockResolvedValueOnce(null);
    writeUnit.assertWriteAuthorityInTransaction.mockResolvedValue({
      ok: false,
      reason: 'GATE_UNAUTHORIZED',
    });
    const result = await entry.proveStage4AttemptWriteAuthority({
      connectionId: 'conn-1',
      grant: grant(),
    });
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        stop: 'B04_DENIED',
      }),
    );
    expect(writeUnit.assertWriteAuthorityInTransaction).toHaveBeenCalledTimes(1);
  });

  it('independent attempts do not reuse prior eligibility (fresh Vault each time)', async () => {
    findFirst
      .mockResolvedValueOnce(eligibleConnectionRow())
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(eligibleConnectionRow())
      .mockResolvedValueOnce(null);
    vaultMetadata.lookupExact
      .mockResolvedValueOnce(okVaultMeta())
      .mockResolvedValueOnce({ ok: false, reason: 'NOT_FOUND' });

    const first = await entry.proveStage4AttemptWriteAuthority({
      connectionId: 'conn-1',
      grant: grant(),
    });
    const second = await entry.proveStage4AttemptWriteAuthority({
      connectionId: 'conn-1',
      grant: grant(),
    });

    expect(first.ok).toBe(true);
    expect(second).toEqual(expect.objectContaining({ ok: false, stop: 'VAULT_NOT_FOUND' }));
    expect(vaultMetadata.lookupExact).toHaveBeenCalledTimes(2);
    expect(writeUnit.assertWriteAuthorityInTransaction).toHaveBeenCalledTimes(1);
  });

  it('source walls: no environment UPDATE / runEnvironmentBackfill / SecretVaultService.list in Stage 4 Entry', () => {
    const entrySrc = readFileSync(
      join(__dirname, 'fiv-conn-04-d-system-job-migration-entry.ts'),
      'utf8',
    );
    const occSrc = readFileSync(join(__dirname, 'fiv-conn-04-d-live-slot-occupancy.ts'), 'utf8');
    expect(entrySrc).not.toMatch(/environment\s*:\s*['`]live['`]/);
    expect(entrySrc).not.toMatch(/runEnvironmentBackfill/);
    expect(entrySrc).not.toMatch(/SecretVaultService/);
    expect(entrySrc).not.toMatch(/\.list\(/);
    expect(occSrc).not.toMatch(/runEnvironmentBackfill/);
    expect(occSrc).not.toMatch(/SecretVaultService/);
    // Stage 4 proves authority only — no Connection.environment mutation API
    expect(entrySrc).not.toMatch(/connectionRecord\.update/);
  });
});

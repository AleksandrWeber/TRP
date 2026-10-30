/**
 * VMP-1 — Entry internal Vault metadata seam + Connections export walls
 * (T-VMP-06, 07, 08, 10, 11, 12, 15).
 */

import { MODULE_METADATA } from '@nestjs/common/constants';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import {
  FIV_CONN_04_D_VAULT_METADATA_PORT,
  type FivConn04DVaultMetadataPort,
} from '../secret-vault/fiv-conn-04-d-vault-metadata.port';
import { Conn04MigrationBoundaryService } from './conn04-migration-boundary.service';
import { ConnectionsModule } from './connections.module';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { FivConn04DEnvironmentBackfillWrite } from './fiv-conn-04-d-environment-backfill-write';
import { Conn04SystemJobMigrationEntry } from './fiv-conn-04-d-system-job-migration-entry';
import { SecretPurpose } from '../secret-vault/secret-purpose';
import { SecretState } from '../secret-vault/secret-state';

function moduleExports(): unknown[] {
  const raw = Reflect.getMetadata(MODULE_METADATA.EXPORTS, ConnectionsModule) as unknown;
  return Array.isArray(raw) ? raw : [];
}

function moduleImports(): unknown[] {
  const raw = Reflect.getMetadata(MODULE_METADATA.IMPORTS, ConnectionsModule) as unknown;
  return Array.isArray(raw) ? raw : [];
}

describe('Conn04SystemJobMigrationEntry Vault metadata seam (VMP-1)', () => {
  let boundary: Conn04MigrationBoundaryService;
  let writeUnit: FivConn04DEnvironmentBackfillWrite;
  let transactions: PrismaTransactionService;
  let vaultMetadata: {
    lookupExact: ReturnType<typeof vi.fn>;
  };
  let entry: Conn04SystemJobMigrationEntry;

  beforeEach(() => {
    boundary = {} as Conn04MigrationBoundaryService;
    writeUnit = {} as FivConn04DEnvironmentBackfillWrite;
    transactions = {} as PrismaTransactionService;
    vaultMetadata = {
      lookupExact: vi.fn(),
    };
    entry = new Conn04SystemJobMigrationEntry(
      boundary,
      writeUnit,
      transactions,
      vaultMetadata as unknown as FivConn04DVaultMetadataPort,
    );
  });

  it('T-VMP-06: blank/missing IDs fail closed with zero port I/O', async () => {
    expect(
      await entry.lookupVaultMetadataForConnection({
        workspaceId: '  ',
        vaultSecretId: 'vault-1',
      }),
    ).toEqual({ ok: false, reason: 'INVALID' });
    expect(
      await entry.lookupVaultMetadataForConnection({
        workspaceId: 'ws-a',
        vaultSecretId: null,
      }),
    ).toEqual({ ok: false, reason: 'INVALID' });
    expect(
      await entry.lookupVaultMetadataForConnection({
        workspaceId: 'ws-a',
        vaultSecretId: '',
      }),
    ).toEqual({ ok: false, reason: 'INVALID' });
    expect(
      await entry.lookupVaultMetadataForConnection({
        workspaceId: 'ws-a',
        vaultSecretId: '   ',
      }),
    ).toEqual({ ok: false, reason: 'INVALID' });
    expect(vaultMetadata.lookupExact).not.toHaveBeenCalled();
  });

  it('T-VMP-07: binding uses same-Connection fields only (no cross-Connection mix API)', async () => {
    vaultMetadata.lookupExact.mockResolvedValue({
      ok: true,
      metadata: {
        id: 'vault-a',
        workspaceId: 'ws-a',
        purpose: SecretPurpose.TradingLive,
        state: SecretState.Connected,
      },
    });
    const connection = Object.freeze({
      workspaceId: 'ws-a',
      vaultSecretId: 'vault-a',
    });
    await entry.lookupVaultMetadataForConnection(connection);
    expect(vaultMetadata.lookupExact).toHaveBeenCalledTimes(1);
    expect(vaultMetadata.lookupExact).toHaveBeenCalledWith({
      workspaceId: 'ws-a',
      vaultSecretId: 'vault-a',
    });

    const src = readFileSync(
      join(__dirname, 'fiv-conn-04-d-system-job-migration-entry.ts'),
      'utf8',
    );
    expect(src).toMatch(/lookupVaultMetadataForConnection/);
    expect(src).not.toMatch(
      /lookupVaultMetadataForConnection\([^)]*workspaceId\s*:\s*string[^)]*vaultSecretId/,
    );
    // Seam accepts a single Connection binding object — not independent override pair.
    expect(src).toMatch(
      /lookupVaultMetadataForConnection\(\s*connection:\s*Conn04VaultMetadataConnectionBinding/,
    );
  });

  it('T-VMP-08: propagates UNAVAILABLE / INVALID / NOT_FOUND without inventing success', async () => {
    for (const reason of ['NOT_FOUND', 'UNAVAILABLE', 'INVALID'] as const) {
      vaultMetadata.lookupExact.mockResolvedValueOnce({ ok: false, reason });
      expect(
        await entry.lookupVaultMetadataForConnection({
          workspaceId: 'ws-a',
          vaultSecretId: 'vault-1',
        }),
      ).toEqual({ ok: false, reason });
    }
  });

  it('T-VMP-12: Entry does not inject SecretVaultService / repository for D freshness', () => {
    const src = readFileSync(
      join(__dirname, 'fiv-conn-04-d-system-job-migration-entry.ts'),
      'utf8',
    );
    expect(src).toMatch(/@Inject\(FIV_CONN_04_D_VAULT_METADATA_PORT\)/);
    expect(src).toMatch(/fiv-conn-04-d-vault-metadata\.port/);
    expect(src).not.toMatch(/SecretVaultService/);
    expect(src).not.toMatch(/SECRET_VAULT_REPOSITORY/);
    expect(src).not.toMatch(/SecretVaultModule/);
    expect(src).not.toMatch(/\.list\(/);
    expect(src).not.toMatch(/runEnvironmentBackfill/);
  });

  it('T-VMP-15: internal seam is callable and trims Connection-derived IDs', async () => {
    vaultMetadata.lookupExact.mockResolvedValue({
      ok: true,
      metadata: {
        id: 'vault-1',
        workspaceId: 'ws-a',
        purpose: SecretPurpose.TradingLive,
        state: SecretState.Connected,
      },
    });
    const result = await entry.lookupVaultMetadataForConnection({
      workspaceId: '  ws-a  ',
      vaultSecretId: '  vault-1  ',
    });
    expect(result.ok).toBe(true);
    expect(vaultMetadata.lookupExact).toHaveBeenCalledWith({
      workspaceId: 'ws-a',
      vaultSecretId: 'vault-1',
    });
  });
});

describe('ConnectionsModule VMP-1 wiring / export wall', () => {
  it('T-VMP-10: ConnectionsModule imports metadata module and does not re-export port / Entry / seam', async () => {
    const { FivConn04DVaultMetadataModule } =
      await import('../secret-vault/fiv-conn-04-d-vault-metadata.module');
    expect(moduleImports()).toContain(FivConn04DVaultMetadataModule);
    const exports = moduleExports();
    expect(exports).not.toContain(FIV_CONN_04_D_VAULT_METADATA_PORT);
    expect(exports).not.toContain(Conn04SystemJobMigrationEntry);
    expect(exports).not.toContain('lookupVaultMetadataForConnection');
  });

  it('T-VMP-11: public controller / service surfaces do not reference the metadata port', () => {
    const controllerSrc = readFileSync(join(__dirname, 'connections.controller.ts'), 'utf8');
    const serviceSrc = readFileSync(join(__dirname, 'connections.service.ts'), 'utf8');
    expect(controllerSrc).not.toMatch(/FIV_CONN_04_D_VAULT_METADATA_PORT/);
    expect(controllerSrc).not.toMatch(/FivConn04DVaultMetadata/);
    expect(controllerSrc).not.toMatch(/lookupVaultMetadataForConnection/);
    expect(serviceSrc).not.toMatch(/FIV_CONN_04_D_VAULT_METADATA_PORT/);
    expect(serviceSrc).not.toMatch(/lookupVaultMetadataForConnection/);
    expect(ConnectionsController.name).toBe('ConnectionsController');
    expect(ConnectionsService.name).toBe('ConnectionsService');
  });
});

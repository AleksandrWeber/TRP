/**
 * VMP-1 — FivConn04DVaultMetadataModule export wall (T-VMP-09, T-VMP-10).
 */

import { MODULE_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { FIV_CONN_04_D_VAULT_METADATA_PORT } from './fiv-conn-04-d-vault-metadata.port';
import { FivConn04DVaultMetadataModule } from './fiv-conn-04-d-vault-metadata.module';
import { FivConn04DVaultMetadataService } from './fiv-conn-04-d-vault-metadata.service';
import { PrismaSecretVaultRepository } from './prisma-secret-vault.repository';
import { SECRET_VAULT_REPOSITORY } from './secret-vault.repository.token';
import { SecretVaultModule } from './secret-vault.module';
import { SecretVaultService } from './secret-vault.service';
import { VaultAccessControl } from './vault-access-control';

function moduleExports(moduleClass: object): unknown[] {
  const raw = Reflect.getMetadata(MODULE_METADATA.EXPORTS, moduleClass) as unknown;
  return Array.isArray(raw) ? raw : [];
}

function moduleProviders(moduleClass: object): unknown[] {
  const raw = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, moduleClass) as unknown;
  return Array.isArray(raw) ? raw : [];
}

describe('FivConn04DVaultMetadataModule (VMP-1 export wall)', () => {
  it('T-VMP-09: exports only the metadata port token', () => {
    const exports = moduleExports(FivConn04DVaultMetadataModule);
    expect(exports).toEqual([FIV_CONN_04_D_VAULT_METADATA_PORT]);
    expect(exports).not.toContain(SECRET_VAULT_REPOSITORY);
    expect(exports).not.toContain(PrismaSecretVaultRepository);
    expect(exports).not.toContain(FivConn04DVaultMetadataService);
    expect(exports).not.toContain(SecretVaultService);
    expect(exports).not.toContain(VaultAccessControl);
  });

  it('T-VMP-09: registers private repository + service + port alias as providers', () => {
    const providers = moduleProviders(FivConn04DVaultMetadataModule);
    expect(
      providers.some(
        (p) =>
          typeof p === 'object' &&
          p !== null &&
          'provide' in p &&
          (p as { provide: unknown }).provide === SECRET_VAULT_REPOSITORY,
      ),
    ).toBe(true);
    expect(providers).toContain(FivConn04DVaultMetadataService);
    expect(
      providers.some(
        (p) =>
          typeof p === 'object' &&
          p !== null &&
          'provide' in p &&
          (p as { provide: unknown }).provide === FIV_CONN_04_D_VAULT_METADATA_PORT,
      ),
    ).toBe(true);
  });

  it('T-VMP-10: SecretVaultModule does not export the metadata port or repository', () => {
    const exports = moduleExports(SecretVaultModule);
    expect(exports).toEqual([SecretVaultService]);
    expect(exports).not.toContain(FIV_CONN_04_D_VAULT_METADATA_PORT);
    expect(exports).not.toContain(SECRET_VAULT_REPOSITORY);
    expect(exports).not.toContain(FivConn04DVaultMetadataService);
  });
});

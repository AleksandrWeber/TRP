/**
 * FIV-CONN-04-D — Dedicated Vault metadata Nest module (Option A / VMP-1).
 * Exports the metadata port token only. Repository remains module-private.
 * SecretVaultModule is unchanged and does not export this port.
 */

import { Module } from '@nestjs/common';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { FIV_CONN_04_D_VAULT_METADATA_PORT } from './fiv-conn-04-d-vault-metadata.port';
import { FivConn04DVaultMetadataService } from './fiv-conn-04-d-vault-metadata.service';
import { PrismaSecretVaultRepository } from './prisma-secret-vault.repository';
import { SECRET_VAULT_REPOSITORY } from './secret-vault.repository.token';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: SECRET_VAULT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaSecretVaultRepository(prisma),
      inject: [PrismaService],
    },
    FivConn04DVaultMetadataService,
    {
      provide: FIV_CONN_04_D_VAULT_METADATA_PORT,
      useExisting: FivConn04DVaultMetadataService,
    },
  ],
  exports: [FIV_CONN_04_D_VAULT_METADATA_PORT],
})
export class FivConn04DVaultMetadataModule {}

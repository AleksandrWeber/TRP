import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule, PrismaService } from '../../storage/prisma/prisma.module';
import { SecurityAuditModule } from '../security-audit';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { PrismaSecretVaultRepository } from './prisma-secret-vault.repository';
import {
  SECRET_VAULT_CLOCK,
  SECRET_VAULT_REPOSITORY,
  VAULT_WRAPPING_KEY_SOURCE,
} from './secret-vault.repository.token';
import { SecretVaultService, SYSTEM_CLOCK } from './secret-vault.service';
import { VaultAccessControl } from './vault-access-control';
import { envWrappingKeySource } from './wrapping-key';

/**
 * Credential Vault bounded context (V3-S03-c).
 * Owns customer vendor secrets, lifecycle, validation, and encryption at rest.
 * No HTTP. No Exchange / AI / Notification consumers. No Vault UI.
 * Wrapping key is resolved lazily; missing key does not fail module boot.
 */
@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, WorkspaceModule, SecurityAuditModule],
  providers: [
    {
      provide: SECRET_VAULT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaSecretVaultRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: SECRET_VAULT_CLOCK,
      useValue: SYSTEM_CLOCK,
    },
    {
      provide: VAULT_WRAPPING_KEY_SOURCE,
      useFactory: (config: ConfigService) =>
        envWrappingKeySource(() => config.get<string>('VAULT_WRAPPING_KEY')),
      inject: [ConfigService],
    },
    VaultAccessControl,
    SecretVaultService,
  ],
  exports: [SecretVaultService],
})
export class SecretVaultModule {}

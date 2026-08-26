import { Injectable } from '@nestjs/common';
import { HoldableSecretType } from '../secret-vault/holdable-secret-type';
import { SecretVaultService } from '../secret-vault';
import type { Role } from '../identity/role';

export type OpenRouterResolvedKey = Readonly<{
  vaultSecretId: string;
  apiKey: string;
}>;

/**
 * Workspace-scoped OpenRouter key resolution (W2-S05-a).
 *
 * Resolves only the owning workspace Vault secret. Never returns another
 * workspace's credentials. Never logs or echoes the plaintext key.
 */
@Injectable()
export class OpenRouterKeyResolution {
  constructor(private readonly vault: SecretVaultService) {}

  async resolve(input: {
    workspaceId: string;
    actorUserId: string;
    actorRole: Role;
    expectedVaultSecretId: string;
  }): Promise<OpenRouterResolvedKey | null> {
    const metadata = await this.vault.get({
      actorWorkspaceId: input.actorUserId,
      actorRole: input.actorRole,
      workspaceId: input.workspaceId,
      type: HoldableSecretType.OpenRouter,
    });
    if (metadata === null || metadata.id !== input.expectedVaultSecretId) {
      return null;
    }

    const fields = await this.vault.retrieve({
      actorWorkspaceId: input.actorUserId,
      actorRole: input.actorRole,
      workspaceId: input.workspaceId,
      type: HoldableSecretType.OpenRouter,
    });
    const apiKey = fields.apiKey?.trim() ?? '';
    if (apiKey === '') {
      return null;
    }

    return {
      vaultSecretId: metadata.id,
      apiKey,
    };
  }
}

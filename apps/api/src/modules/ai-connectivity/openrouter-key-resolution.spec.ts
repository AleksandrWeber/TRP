import { describe, expect, it } from 'vitest';
import { HoldableSecretType } from '../secret-vault/holdable-secret-type';
import { Role } from '../identity/role';
import { OpenRouterKeyResolution } from './openrouter-key-resolution';

describe('OpenRouterKeyResolution (W2-S05-a)', () => {
  it('resolves only the owning workspace OpenRouter Vault secret', async () => {
    const calls: Array<{ workspaceId: string; type: string }> = [];
    const vault = {
      get: async (input: { workspaceId: string; type: string }) => {
        calls.push({ workspaceId: input.workspaceId, type: input.type });
        if (input.workspaceId !== 'workspace-a') return null;
        return { id: 'vault-or-1' };
      },
      retrieve: async (input: { workspaceId: string; type: string }) => {
        calls.push({ workspaceId: input.workspaceId, type: input.type });
        if (input.workspaceId !== 'workspace-a') {
          throw new Error('cross-workspace retrieve must not happen');
        }
        return { apiKey: ' sk-or-workspace-a ' };
      },
    };
    const resolution = new OpenRouterKeyResolution(vault as never);

    const resolved = await resolution.resolve({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      expectedVaultSecretId: 'vault-or-1',
    });
    const foreign = await resolution.resolve({
      workspaceId: 'workspace-b',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      expectedVaultSecretId: 'vault-or-1',
    });

    expect(resolved).toEqual({ vaultSecretId: 'vault-or-1', apiKey: 'sk-or-workspace-a' });
    expect(foreign).toBeNull();
    expect(calls.every((call) => call.type === HoldableSecretType.OpenRouter)).toBe(true);
    expect(calls.some((call) => call.workspaceId === 'workspace-b')).toBe(true);
  });

  it('rejects a mismatched vault secret id', async () => {
    const vault = {
      get: async () => ({ id: 'vault-or-other' }),
      retrieve: async () => {
        throw new Error('retrieve must not run');
      },
    };
    const resolution = new OpenRouterKeyResolution(vault as never);
    await expect(
      resolution.resolve({
        workspaceId: 'workspace-a',
        actorUserId: 'user-a',
        actorRole: Role.Admin,
        expectedVaultSecretId: 'vault-or-1',
      }),
    ).resolves.toBeNull();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { Role } from '../../identity/role';
import { HoldableSecretType } from '../../secret-vault/holdable-secret-type';
import { SecretPurpose } from '../../secret-vault/secret-purpose';
import {
  VaultIsolationError,
  VaultNotStoredError,
  VaultRevokedError,
} from '../../secret-vault/vault-errors';
import { TelegramBotTokenResolver } from './telegram-bot-token.resolver';

const TOKEN = '123456:RESOLVER-TEST-TOKEN';

describe('TelegramBotTokenResolver (REM-01-s2)', () => {
  it('retrieves the workspace Telegram notification botToken with the request actor', async () => {
    const retrieve = vi.fn(async () => ({ botToken: TOKEN }));
    const resolver = new TelegramBotTokenResolver({ retrieve } as never);
    const result = await resolver.resolve({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Trader,
    });
    expect(result).toEqual({ ok: true, botToken: TOKEN });
    expect(retrieve).toHaveBeenCalledWith({
      actorWorkspaceId: 'user-a',
      actorRole: Role.Trader,
      workspaceId: 'workspace-a',
      type: HoldableSecretType.Telegram,
      purpose: SecretPurpose.Notification,
    });
  });

  it('fails closed when the actor is missing and does not retrieve', async () => {
    const retrieve = vi.fn();
    const resolver = new TelegramBotTokenResolver({ retrieve } as never);
    await expect(resolver.resolve({ workspaceId: 'workspace-a' })).resolves.toEqual({
      ok: false,
      detail: 'telegram_invalid_request',
    });
    await expect(
      resolver.resolve({ workspaceId: 'workspace-a', actorUserId: 'user-a' }),
    ).resolves.toEqual({
      ok: false,
      detail: 'telegram_invalid_request',
    });
    expect(retrieve).not.toHaveBeenCalled();
  });

  it('maps Vault isolation, missing, and revoked secrets without echoing the token', async () => {
    const retrieve = vi
      .fn()
      .mockRejectedValueOnce(new VaultIsolationError())
      .mockRejectedValueOnce(new VaultNotStoredError())
      .mockRejectedValueOnce(new VaultRevokedError());
    const resolver = new TelegramBotTokenResolver({ retrieve } as never);
    const query = {
      workspaceId: 'workspace-b',
      actorUserId: 'user-b',
      actorRole: Role.Admin,
    };
    for (let i = 0; i < 3; i += 1) {
      const result = await resolver.resolve(query);
      expect(result).toEqual({ ok: false, detail: 'telegram_invalid_request' });
      expect(JSON.stringify(result)).not.toContain(TOKEN);
    }
  });

  it('does not return an empty botToken', async () => {
    const retrieve = vi.fn(async () => ({ botToken: '   ' }));
    const resolver = new TelegramBotTokenResolver({ retrieve } as never);
    await expect(
      resolver.resolve({
        workspaceId: 'workspace-a',
        actorUserId: 'user-a',
        actorRole: Role.Admin,
      }),
    ).resolves.toEqual({ ok: false, detail: 'telegram_invalid_request' });
  });

  it('scopes retrieve to the delivery workspace, not another workspace id', async () => {
    const retrieve = vi.fn(async () => ({ botToken: TOKEN }));
    const resolver = new TelegramBotTokenResolver({ retrieve } as never);
    await resolver.resolve({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Trader,
    });
    expect(retrieve).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-a',
        actorWorkspaceId: 'user-a',
      }),
    );
    expect(retrieve).not.toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'workspace-b' }),
    );
  });
});

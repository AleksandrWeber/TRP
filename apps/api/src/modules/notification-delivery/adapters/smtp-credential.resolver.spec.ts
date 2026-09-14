import { describe, expect, it, vi } from 'vitest';
import { Role } from '../../identity/role';
import { HoldableSecretType } from '../../secret-vault/holdable-secret-type';
import { SecretPurpose } from '../../secret-vault/secret-purpose';
import {
  VaultIsolationError,
  VaultNotStoredError,
  VaultRevokedError,
} from '../../secret-vault/vault-errors';
import { SmtpCredentialResolver } from './smtp-credential.resolver';

const PASSWORD = 'smtp-resolver-secret-password';

const FIELDS = {
  host: 'smtp.example.com',
  port: '587',
  username: 'mailer',
  password: PASSWORD,
  sender: 'alerts@example.com',
};

describe('SmtpCredentialResolver', () => {
  it('retrieves workspace SMTP notification fields with the request actor', async () => {
    const retrieve = vi.fn(async () => FIELDS);
    const resolver = new SmtpCredentialResolver({ retrieve } as never);
    const result = await resolver.resolve({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Trader,
    });
    expect(result).toEqual({ ok: true, credential: FIELDS });
    expect(retrieve).toHaveBeenCalledWith({
      actorWorkspaceId: 'user-a',
      actorRole: Role.Trader,
      workspaceId: 'workspace-a',
      type: HoldableSecretType.Smtp,
      purpose: SecretPurpose.Notification,
    });
  });

  it('fails closed when the actor is missing and does not retrieve', async () => {
    const retrieve = vi.fn();
    const resolver = new SmtpCredentialResolver({ retrieve } as never);
    await expect(resolver.resolve({ workspaceId: 'workspace-a' })).resolves.toEqual({
      ok: false,
      detail: 'smtp_invalid_request',
    });
    expect(retrieve).not.toHaveBeenCalled();
  });

  it('maps missing Vault SMTP to smtp_not_configured without echoing the password', async () => {
    const retrieve = vi
      .fn()
      .mockRejectedValueOnce(new VaultNotStoredError())
      .mockRejectedValueOnce(new VaultRevokedError());
    const resolver = new SmtpCredentialResolver({ retrieve } as never);
    const query = {
      workspaceId: 'workspace-b',
      actorUserId: 'user-b',
      actorRole: Role.Admin,
    };
    for (let i = 0; i < 2; i += 1) {
      const result = await resolver.resolve(query);
      expect(result).toEqual({ ok: false, detail: 'smtp_not_configured' });
      expect(JSON.stringify(result)).not.toContain(PASSWORD);
    }
  });

  it('maps Vault isolation without leaking workspace existence', async () => {
    const retrieve = vi.fn().mockRejectedValue(new VaultIsolationError());
    const resolver = new SmtpCredentialResolver({ retrieve } as never);
    const result = await resolver.resolve({
      workspaceId: 'workspace-b',
      actorUserId: 'user-b',
      actorRole: Role.Admin,
    });
    expect(result).toEqual({ ok: false, detail: 'smtp_invalid_request' });
    expect(JSON.stringify(result)).not.toContain(PASSWORD);
  });

  it('scopes retrieve to the delivery workspace', async () => {
    const retrieve = vi.fn(async () => FIELDS);
    const resolver = new SmtpCredentialResolver({ retrieve } as never);
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

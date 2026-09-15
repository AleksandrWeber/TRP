import { describe, expect, it, vi } from 'vitest';
import { Role } from '../../identity/role';
import { HoldableSecretType } from '../../secret-vault/holdable-secret-type';
import { SecretPurpose } from '../../secret-vault/secret-purpose';
import { SecretState } from '../../secret-vault/secret-state';
import { VaultNotStoredError } from '../../secret-vault/vault-errors';
import { SlackWebhookCredentialResolver } from './slack-webhook-credential.resolver';

describe('SlackWebhookCredentialResolver', () => {
  it('reports configured when Vault metadata is Connected', async () => {
    const get = vi.fn(async () => Object.freeze({ state: SecretState.Connected }));
    const resolver = new SlackWebhookCredentialResolver({ get, retrieve: vi.fn() } as never);
    await expect(
      resolver.isConfigured({
        workspaceId: 'ws-a',
        actorUserId: 'user-a',
        actorRole: Role.Admin,
      }),
    ).resolves.toBe(true);
    expect(get).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-a',
        type: HoldableSecretType.SlackWebhook,
        purpose: SecretPurpose.Notification,
      }),
    );
  });

  it('retrieves webhook URL at send without inventing a second store', async () => {
    const retrieve = vi.fn(async () =>
      Object.freeze({
        webhookUrl: 'https://hooks.slack.com/services/TEAM/HOOK/TOKEN',
      }),
    );
    const resolver = new SlackWebhookCredentialResolver({ get: vi.fn(), retrieve } as never);
    const result = await resolver.resolve({
      workspaceId: 'ws-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
    });
    expect(result).toEqual({
      ok: true,
      credential: { webhookUrl: 'https://hooks.slack.com/services/TEAM/HOOK/TOKEN' },
    });
    expect(retrieve).toHaveBeenCalledWith(
      expect.objectContaining({
        actorWorkspaceId: 'user-a',
        workspaceId: 'ws-a',
        type: HoldableSecretType.SlackWebhook,
        purpose: SecretPurpose.Notification,
      }),
    );
  });

  it('fail-closes when Vault has no secret or URL is blocked', async () => {
    const missing = new SlackWebhookCredentialResolver({
      get: vi.fn(),
      retrieve: vi.fn(async () => {
        throw new VaultNotStoredError('missing');
      }),
    } as never);
    await expect(
      missing.resolve({
        workspaceId: 'ws-a',
        actorUserId: 'user-a',
        actorRole: Role.Admin,
      }),
    ).resolves.toEqual({ ok: false, detail: 'slack_webhook_not_configured' });

    const blocked = new SlackWebhookCredentialResolver({
      get: vi.fn(),
      retrieve: vi.fn(async () =>
        Object.freeze({ webhookUrl: 'https://evil.example/services/TEAM/HOOK/TOKEN' }),
      ),
    } as never);
    await expect(
      blocked.resolve({
        workspaceId: 'ws-a',
        actorUserId: 'user-a',
        actorRole: Role.Admin,
      }),
    ).resolves.toEqual({ ok: false, detail: 'slack_webhook_blocked_url' });
  });
});

import { describe, expect, it, vi } from 'vitest';
import { Role } from '../../identity/role';
import { ProductionDiscordWebhookNotificationAdapter } from './production-discord-webhook-notification.adapter';
import type { DiscordWebhookCredentialResolver } from './discord-webhook-credential.resolver';

const VALID_URL = 'https://discord.com/api/webhooks/123456789012345678/AbCdEfGhIjKlMnOpQrStUvWxYz';

function resolverOk(): DiscordWebhookCredentialResolver {
  return {
    isConfigured: vi.fn(async () => true),
    resolve: vi.fn(async () =>
      Object.freeze({
        ok: true as const,
        credential: Object.freeze({ webhookUrl: VALID_URL }),
      }),
    ),
  } as unknown as DiscordWebhookCredentialResolver;
}

describe('ProductionDiscordWebhookNotificationAdapter', () => {
  it('posts JSON content and treats HTTP 204 as success', async () => {
    const fetchFn = vi.fn(async () => ({
      status: 204,
      text: async () => '',
    }));
    const adapter = new ProductionDiscordWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      fetchFn,
    );
    const result = await adapter.send({
      chatId: '',
      subject: 'Test',
      body: 'Hello',
      workspaceId: 'ws-1',
      actorUserId: 'user-1',
      actorRole: Role.Admin,
    });
    expect(result).toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledWith(
      VALID_URL,
      expect.objectContaining({
        method: 'POST',
        redirect: 'error',
        headers: { 'content-type': 'application/json' },
      }),
    );
    const [, init] = fetchFn.mock.calls[0] as unknown as [string, { body: string }];
    const body = JSON.parse(init.body) as { content: string };
    expect(body.content).toContain('Test');
  });

  it('does not treat HTTP 200 as Connected-eligible success', async () => {
    const adapter = new ProductionDiscordWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      async () => ({
        status: 200,
        text: async () => '{"id":"1"}',
      }),
    );
    expect(
      await adapter.send({
        chatId: '',
        subject: 't',
        body: 'b',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'discord_webhook_invalid_response' });
  });

  it('classifies vendor failures, timeouts, and redirects', async () => {
    const notFound = new ProductionDiscordWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      async () => ({
        status: 404,
        text: async () => 'Unknown Webhook',
      }),
    );
    expect(
      await notFound.send({
        chatId: '',
        subject: 't',
        body: 'b',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'discord_webhook_not_found' });

    const rateLimited = new ProductionDiscordWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      async () => ({
        status: 429,
        text: async () => 'rate',
      }),
    );
    expect(
      await rateLimited.send({
        chatId: '',
        subject: 't',
        body: 'b',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'discord_webhook_rate_limited' });

    const timeout = new ProductionDiscordWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      async () => {
        const error = new Error('aborted');
        error.name = 'AbortError';
        throw error;
      },
    );
    expect(
      await timeout.send({
        chatId: '',
        subject: 't',
        body: 'b',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'discord_webhook_timeout' });

    const redirect = new ProductionDiscordWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      async () => {
        throw new Error('redirect not allowed');
      },
    );
    expect(
      await redirect.send({
        chatId: '',
        subject: 't',
        body: 'b',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'discord_webhook_redirect_rejected' });
  });

  it('fails closed when credentials are missing', async () => {
    const adapter = new ProductionDiscordWebhookNotificationAdapter(
      {
        isConfigured: vi.fn(async () => false),
        resolve: vi.fn(async () =>
          Object.freeze({ ok: false as const, detail: 'discord_webhook_not_configured' }),
        ),
      } as unknown as DiscordWebhookCredentialResolver,
      undefined,
      vi.fn(),
    );
    expect(
      await adapter.send({
        chatId: '',
        subject: 't',
        body: 'b',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'discord_webhook_not_configured' });
  });
});

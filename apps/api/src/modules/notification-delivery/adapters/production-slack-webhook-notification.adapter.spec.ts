import { describe, expect, it, vi } from 'vitest';
import { Role } from '../../identity/role';
import { ProductionSlackWebhookNotificationAdapter } from './production-slack-webhook-notification.adapter';
import type { SlackWebhookCredentialResolver } from './slack-webhook-credential.resolver';

const VALID_URL = 'https://hooks.slack.com/services/TEAM/HOOK/TOKEN';

function resolverOk(): SlackWebhookCredentialResolver {
  return {
    isConfigured: vi.fn(async () => true),
    resolve: vi.fn(async () =>
      Object.freeze({
        ok: true as const,
        credential: Object.freeze({ webhookUrl: VALID_URL }),
      }),
    ),
  } as unknown as SlackWebhookCredentialResolver;
}

describe('ProductionSlackWebhookNotificationAdapter', () => {
  it('posts JSON and treats HTTP 200 ok as success', async () => {
    const fetchFn = vi.fn(async () => ({
      status: 200,
      text: async () => 'ok',
    }));
    const adapter = new ProductionSlackWebhookNotificationAdapter(resolverOk(), undefined, fetchFn);
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
    expect(fetchFn).toHaveBeenCalled();
    const [, init] = fetchFn.mock.calls[0] as unknown as [string, { body: string }];
    const body = JSON.parse(init.body) as { text: string };
    expect(body.text).toContain('Test');
  });

  it('classifies vendor failures, timeouts, and redirects', async () => {
    const notFound = new ProductionSlackWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      async () => ({
        status: 404,
        text: async () => 'invalid_token',
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
    ).toEqual({ ok: false, detail: 'slack_webhook_not_found' });

    const timeout = new ProductionSlackWebhookNotificationAdapter(
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
    ).toEqual({ ok: false, detail: 'slack_webhook_timeout' });

    const redirect = new ProductionSlackWebhookNotificationAdapter(
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
    ).toEqual({ ok: false, detail: 'slack_webhook_redirect_rejected' });
  });

  it('rejects non-ok response bodies and missing credentials', async () => {
    const badBody = new ProductionSlackWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      async () => ({
        status: 200,
        text: async () => 'nope',
      }),
    );
    expect(
      await badBody.send({
        chatId: '',
        subject: 't',
        body: 'b',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'slack_webhook_invalid_response' });

    const missing = new ProductionSlackWebhookNotificationAdapter();
    expect(
      await missing.send({
        chatId: '',
        subject: 't',
        body: 'b',
        workspaceId: 'ws-1',
      }),
    ).toEqual({ ok: false, detail: 'slack_webhook_invalid_request' });
  });
});

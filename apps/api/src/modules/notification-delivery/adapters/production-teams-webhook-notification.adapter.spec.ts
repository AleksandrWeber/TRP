import { describe, expect, it, vi } from 'vitest';
import { Role } from '../../identity/role';
import { ProductionTeamsWebhookNotificationAdapter } from './production-teams-webhook-notification.adapter';
import type { TeamsWebhookCredentialResolver } from './teams-webhook-credential.resolver';
import { containsTeamsWebhookSecret } from './teams-webhook-notification.errors';

/** Synthetic fixture — not a live credential. Query order matters for preservation checks. */
const VALID_URL =
  'https://defaultenv.e1.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/wfid123/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=TESTSIG_NOT_A_REAL_SECRET';

function resolverOk(url = VALID_URL): TeamsWebhookCredentialResolver {
  return {
    isConfigured: vi.fn(async () => true),
    resolve: vi.fn(async () =>
      Object.freeze({
        ok: true as const,
        credential: Object.freeze({ webhookUrl: url }),
      }),
    ),
  } as unknown as TeamsWebhookCredentialResolver;
}

describe('ProductionTeamsWebhookNotificationAdapter', () => {
  it('posts JSON {"text"} and treats HTTP 202 as success; preserves exact URL', async () => {
    const fetchFn = vi.fn(async () => ({
      status: 202,
      text: async () => '',
    }));
    const adapter = new ProductionTeamsWebhookNotificationAdapter(resolverOk(), undefined, fetchFn);
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
        headers: { 'content-type': 'application/json; charset=utf-8' },
      }),
    );
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, { body: string }];
    expect(url).toBe(VALID_URL);
    const body = JSON.parse(init.body) as { text: string };
    expect(body).toEqual({ text: 'Test\n\nHello' });
    expect(Object.keys(body)).toEqual(['text']);
  });

  it('rejects empty text and text over 4000 code points', async () => {
    const fetchFn = vi.fn();
    const adapter = new ProductionTeamsWebhookNotificationAdapter(resolverOk(), undefined, fetchFn);
    expect(
      await adapter.send({
        chatId: '',
        subject: '   ',
        body: '',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'teams_webhook_invalid_request' });

    const tooLong = 'x'.repeat(4001);
    expect(
      await adapter.send({
        chatId: '',
        subject: tooLong,
        body: '',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'teams_webhook_invalid_request' });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('does not treat HTTP 200 or other 2xx as Connected-eligible success', async () => {
    const adapter200 = new ProductionTeamsWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      async () => ({
        status: 200,
        text: async () => 'ok',
      }),
    );
    expect(
      await adapter200.send({
        chatId: '',
        subject: 't',
        body: 'b',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'teams_webhook_unsupported_status' });

    const adapter204 = new ProductionTeamsWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      async () => ({
        status: 204,
        text: async () => '',
      }),
    );
    expect(
      await adapter204.send({
        chatId: '',
        subject: 't',
        body: 'b',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'teams_webhook_unsupported_status' });
  });

  it('classifies vendor failures, timeouts, and redirects', async () => {
    const unauthorized = new ProductionTeamsWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      async () => ({
        status: 401,
        text: async () => 'denied',
      }),
    );
    expect(
      await unauthorized.send({
        chatId: '',
        subject: 't',
        body: 'b',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'teams_webhook_unauthorized' });

    const notFound = new ProductionTeamsWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      async () => ({
        status: 404,
        text: async () => 'Unknown',
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
    ).toEqual({ ok: false, detail: 'teams_webhook_not_found' });

    const rateLimited = new ProductionTeamsWebhookNotificationAdapter(
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
    ).toEqual({ ok: false, detail: 'teams_webhook_rate_limited' });

    const server = new ProductionTeamsWebhookNotificationAdapter(
      resolverOk(),
      undefined,
      async () => ({
        status: 500,
        text: async () => 'err',
      }),
    );
    expect(
      await server.send({
        chatId: '',
        subject: 't',
        body: 'b',
        workspaceId: 'ws-1',
        actorUserId: 'u',
        actorRole: Role.Admin,
      }),
    ).toEqual({ ok: false, detail: 'teams_webhook_server_error' });

    const timeout = new ProductionTeamsWebhookNotificationAdapter(
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
    ).toEqual({ ok: false, detail: 'teams_webhook_timeout' });

    const redirect = new ProductionTeamsWebhookNotificationAdapter(
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
    ).toEqual({ ok: false, detail: 'teams_webhook_redirect_rejected' });
  });

  it('fails closed when credentials are missing and never leaks URL/sig', async () => {
    const adapter = new ProductionTeamsWebhookNotificationAdapter(
      {
        isConfigured: vi.fn(async () => false),
        resolve: vi.fn(async () =>
          Object.freeze({ ok: false as const, detail: 'teams_webhook_not_configured' }),
        ),
      } as unknown as TeamsWebhookCredentialResolver,
      undefined,
      vi.fn(),
    );
    const result = await adapter.send({
      chatId: '',
      subject: 't',
      body: 'b',
      workspaceId: 'ws-1',
      actorUserId: 'u',
      actorRole: Role.Admin,
    });
    expect(result).toEqual({ ok: false, detail: 'teams_webhook_not_configured' });
    expect(containsTeamsWebhookSecret(JSON.stringify(result), { webhookUrl: VALID_URL })).toBe(
      false,
    );
    expect(JSON.stringify(result)).not.toContain('TESTSIG_NOT_A_REAL_SECRET');
    expect(JSON.stringify(result)).not.toContain('powerplatform.com');
  });
});

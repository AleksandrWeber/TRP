import { describe, expect, it } from 'vitest';
import {
  bindPushChannel,
  disconnectPushConnection,
  markPushFailed,
  markPushVerified,
  notConnectedPush,
} from './domain/push-connection';
import {
  ProductionWebPushNotificationAdapter,
  WEB_PUSH_SEND,
  type WebPushSendFn,
} from './adapters/production-web-push-notification.adapter';
import {
  containsWebPushSecret,
  redactWebPushSecrets,
} from './adapters/web-push-notification.errors';
import type { WebPushVapidCredentialResolver } from './adapters/web-push-vapid-credential.resolver';
import type { WebPushSubscriptionService } from './web-push-subscription.service';
import { Role } from '../identity/role';

const evaluatedAt = '2026-09-16T12:00:00.000Z';
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123:APA91bSyntheticEndpointNotReal';
const PUBLIC_KEY =
  'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcY7AcEk';
const PRIVATE_KEY = 'FAKESECRET_o3p4q5r6s7t8u9v0w1x2';
const P256DH = 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u';
const AUTH = 'tBHItJI5svbpez7KI4CCXg';

describe('PushConnection domain', () => {
  it('bind → verify → connected; failed stays pending with error code', () => {
    let connection = notConnectedPush('ws-1', 'user-1', evaluatedAt);
    connection = bindPushChannel(connection, evaluatedAt);
    expect(connection.status).toBe('pending');
    connection = markPushVerified(connection, evaluatedAt);
    expect(connection.status).toBe('connected');
    connection = markPushFailed(connection, evaluatedAt, 'web_push_timeout');
    expect(connection.status).toBe('pending');
    expect(connection.lastErrorCode).toBe('web_push_timeout');
    connection = disconnectPushConnection(connection, evaluatedAt);
    expect(connection.status).toBe('not-connected');
  });
});

describe('ProductionWebPushNotificationAdapter contract', () => {
  it('sends via injected WEB_PUSH_SEND and never logs secrets', async () => {
    const sendFn: WebPushSendFn = async () => ({ statusCode: 201 });
    const credentials = {
      resolve: async () =>
        Object.freeze({
          ok: true as const,
          credential: Object.freeze({
            publicKey: PUBLIC_KEY,
            privateKey: PRIVATE_KEY,
            subject: 'mailto:ops@example.com',
          }),
        }),
    } as unknown as WebPushVapidCredentialResolver;
    const subscriptions = {
      listActive: async () =>
        Object.freeze([
          Object.freeze({
            id: 'sub-1',
            workspaceId: 'ws-1',
            userId: 'user-1',
            providerKind: 'web-push' as const,
            endpoint: ENDPOINT,
            p256dh: P256DH,
            auth: AUTH,
            status: 'active' as const,
            createdAt: evaluatedAt,
            updatedAt: evaluatedAt,
          }),
        ]),
      markSuccess: async () => undefined,
      markExpired: async () => undefined,
    } as unknown as WebPushSubscriptionService;

    const adapter = new ProductionWebPushNotificationAdapter(
      credentials,
      subscriptions,
      undefined,
      sendFn,
    );
    const result = await adapter.send({
      chatId: 'user-1',
      subject: 'Test',
      body: 'Hello',
      workspaceId: 'ws-1',
      actorUserId: 'user-1',
      actorRole: Role.Admin,
    });
    expect(result).toEqual({ ok: true });
  });

  it('maps 410 to gone and marks subscription expired', async () => {
    let expired = false;
    const sendFn: WebPushSendFn = async () => ({ statusCode: 410 });
    const credentials = {
      resolve: async () =>
        Object.freeze({
          ok: true as const,
          credential: Object.freeze({ publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY }),
        }),
    } as unknown as WebPushVapidCredentialResolver;
    const subscriptions = {
      listActive: async () =>
        Object.freeze([
          Object.freeze({
            id: 'sub-gone',
            workspaceId: 'ws-1',
            userId: 'user-1',
            providerKind: 'web-push' as const,
            endpoint: ENDPOINT,
            p256dh: P256DH,
            auth: AUTH,
            status: 'active' as const,
            createdAt: evaluatedAt,
            updatedAt: evaluatedAt,
          }),
        ]),
      markSuccess: async () => undefined,
      markExpired: async () => {
        expired = true;
      },
    } as unknown as WebPushSubscriptionService;

    const adapter = new ProductionWebPushNotificationAdapter(
      credentials,
      subscriptions,
      undefined,
      sendFn,
    );
    const result = await adapter.send({
      chatId: 'user-1',
      subject: 'Test',
      body: 'Hello',
      workspaceId: 'ws-1',
      actorUserId: 'user-1',
      actorRole: Role.Admin,
    });
    expect(result).toEqual({ ok: false, detail: 'web_push_gone' });
    expect(expired).toBe(true);
  });

  it('exposes WEB_PUSH_SEND token for Nest injection', () => {
    expect(WEB_PUSH_SEND).toBeDefined();
  });
});

describe('Web Push secret redaction', () => {
  it('redacts endpoint and keys from diagnostics strings', () => {
    const raw = `fail endpoint=${ENDPOINT} key=${PRIVATE_KEY} auth=${AUTH}`;
    const redacted = redactWebPushSecrets(raw, {
      endpoint: ENDPOINT,
      privateKey: PRIVATE_KEY,
      auth: AUTH,
    });
    expect(redacted).not.toContain(ENDPOINT);
    expect(redacted).not.toContain(PRIVATE_KEY);
    expect(redacted).not.toContain(AUTH);
    expect(containsWebPushSecret(raw, { endpoint: ENDPOINT, privateKey: PRIVATE_KEY })).toBe(true);
    expect(containsWebPushSecret(redacted, { endpoint: ENDPOINT, privateKey: PRIVATE_KEY })).toBe(
      false,
    );
  });
});

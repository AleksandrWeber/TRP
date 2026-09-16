import { describe, expect, it, vi } from 'vitest';
import {
  createWebPushPinnedHttpsAgent,
  isNonPublicOutboundIp,
  validateWebPushEndpointOutbound,
  validateWebPushEndpointUrl,
  type WebPushDnsResolveFn,
  type WebPushResolvedAddress,
} from './web-push-endpoint-guard';
import { classifyWebPushHttpStatus } from '../modules/notification-delivery/adapters/web-push-notification.errors';
import {
  ProductionWebPushNotificationAdapter,
  type WebPushSendFn,
} from '../modules/notification-delivery/adapters/production-web-push-notification.adapter';
import type { WebPushVapidCredentialResolver } from '../modules/notification-delivery/adapters/web-push-vapid-credential.resolver';
import type { WebPushSubscriptionService } from '../modules/notification-delivery/web-push-subscription.service';
import { Role } from '../modules/identity/role';

/** Synthetic fixture — not a live Push service credential. */
const VALID = 'https://fcm.googleapis.com/fcm/send/abc123:APA91bExampleSyntheticEndpointNotReal';
const PUBLIC_V4: WebPushResolvedAddress = Object.freeze({ address: '8.8.8.8', family: 4 as const });

function reasonOf(target: string): string | undefined {
  const result = validateWebPushEndpointUrl(target);
  return result.ok ? undefined : result.reason;
}

async function outboundReason(
  target: string,
  resolveDns: WebPushDnsResolveFn,
): Promise<string | undefined> {
  const result = await validateWebPushEndpointOutbound(target, { resolveDns });
  return result.ok ? undefined : result.reason;
}

function resolveTo(...addresses: WebPushResolvedAddress[]): WebPushDnsResolveFn {
  return async () => Object.freeze(addresses);
}

describe('Web Push endpoint URL guard (syntactic)', () => {
  it('accepts HTTPS push endpoints and preserves the exact URL', () => {
    const result = validateWebPushEndpointUrl(VALID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.preservedUrl).toBe(VALID);
      expect(result.url.protocol).toBe('https:');
    }
  });

  it('accepts default HTTPS port and rejects non-443 custom ports', () => {
    expect(validateWebPushEndpointUrl('https://push.example.com/v1/send/token').ok).toBe(true);
    expect(validateWebPushEndpointUrl('https://push.example.com:443/v1/send/token').ok).toBe(true);
    expect(reasonOf('https://push.example.com:8443/v1/send/token')).toBe('blocked_port');
  });

  it('rejects HTTP scheme', () => {
    expect(reasonOf('http://push.example.com/v1/send/token')).toBe('blocked_scheme');
  });

  it('rejects localhost, loopback, private, link-local, and metadata destinations', () => {
    expect(reasonOf('https://localhost/push')).toBe('blocked_address');
    expect(reasonOf('https://app.localhost/push')).toBe('blocked_address');
    expect(reasonOf('https://127.0.0.1/push')).toBe('blocked_address');
    expect(reasonOf('https://10.0.0.8/push')).toBe('blocked_address');
    expect(reasonOf('https://192.168.1.1/push')).toBe('blocked_address');
    expect(reasonOf('https://172.16.5.1/push')).toBe('blocked_address');
    expect(reasonOf('https://169.254.169.254/latest')).toBe('blocked_address');
    expect(reasonOf('https://metadata.google.internal/')).toBe('blocked_address');
  });

  it('rejects IP literal hostnames (public and private) — policy is hostname-only', () => {
    expect(reasonOf('https://8.8.8.8/push')).toBe('blocked_ip_literal');
    expect(reasonOf('https://10.0.0.1/push')).toBe('blocked_address');
    expect(reasonOf('https://[2001:4860:4860::8888]/push')).toBe('blocked_ip_literal');
    // Loopback IPv6 may be caught by base SSRF or by IP-literal ban — either rejects.
    expect(['blocked_address', 'blocked_ip_literal']).toContain(reasonOf('https://[::1]/push'));
  });

  it('rejects userinfo and fragment', () => {
    expect(reasonOf('https://user:pass@push.example.com/v1/send')).toBe('userinfo');
    expect(reasonOf(`${VALID}#frag`)).toBe('fragment');
  });

  it('rejects empty, invalid, and oversized URLs', () => {
    expect(reasonOf('')).toBe('invalid');
    expect(reasonOf('   ')).toBe('invalid');
    expect(reasonOf('not-a-url')).toBe('invalid');
    expect(reasonOf(`https://push.example.com/${'a'.repeat(4100)}`)).toBe('too_long');
  });

  it('trims surrounding whitespace before validation', () => {
    const padded = `  ${VALID}  `;
    const result = validateWebPushEndpointUrl(padded);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.preservedUrl).toBe(VALID);
    }
  });
});

describe('Web Push endpoint outbound guard (DNS + public resolution)', () => {
  it('accepts public hostname resolving to public IPv4', async () => {
    const result = await validateWebPushEndpointOutbound(VALID, {
      resolveDns: resolveTo(PUBLIC_V4),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pinnedAddresses).toEqual([PUBLIC_V4]);
      expect(result.hostname).toBe('fcm.googleapis.com');
    }
  });

  it('rejects hostname resolving to loopback IPv4', async () => {
    expect(await outboundReason(VALID, resolveTo({ address: '127.0.0.1', family: 4 }))).toBe(
      'blocked_resolved_address',
    );
  });

  it('rejects hostname resolving to private IPv4', async () => {
    expect(await outboundReason(VALID, resolveTo({ address: '10.0.0.8', family: 4 }))).toBe(
      'blocked_resolved_address',
    );
    expect(await outboundReason(VALID, resolveTo({ address: '192.168.1.1', family: 4 }))).toBe(
      'blocked_resolved_address',
    );
    expect(await outboundReason(VALID, resolveTo({ address: '172.16.5.1', family: 4 }))).toBe(
      'blocked_resolved_address',
    );
  });

  it('rejects hostname resolving to link-local IPv4', async () => {
    expect(await outboundReason(VALID, resolveTo({ address: '169.254.1.1', family: 4 }))).toBe(
      'blocked_resolved_address',
    );
  });

  it('rejects hostname resolving to metadata IPv4', async () => {
    expect(await outboundReason(VALID, resolveTo({ address: '169.254.169.254', family: 4 }))).toBe(
      'blocked_resolved_address',
    );
  });

  it('rejects hostname resolving to loopback IPv6', async () => {
    expect(await outboundReason(VALID, resolveTo({ address: '::1', family: 6 }))).toBe(
      'blocked_resolved_address',
    );
  });

  it('rejects hostname resolving to private (ULA) IPv6', async () => {
    expect(
      await outboundReason(VALID, resolveTo({ address: 'fd12:3456:789a::1', family: 6 })),
    ).toBe('blocked_resolved_address');
    expect(await outboundReason(VALID, resolveTo({ address: 'fc00::1', family: 6 }))).toBe(
      'blocked_resolved_address',
    );
  });

  it('rejects hostname resolving to link-local IPv6', async () => {
    expect(await outboundReason(VALID, resolveTo({ address: 'fe80::1', family: 6 }))).toBe(
      'blocked_resolved_address',
    );
  });

  it('rejects multiple DNS results when any address is blocked', async () => {
    expect(
      await outboundReason(VALID, resolveTo(PUBLIC_V4, { address: '10.0.0.1', family: 4 })),
    ).toBe('blocked_resolved_address');
  });

  it('rejects DNS failure', async () => {
    expect(
      await outboundReason(VALID, async () => {
        throw new Error('ENOTFOUND');
      }),
    ).toBe('dns_failure');
  });

  it('rejects empty DNS result', async () => {
    expect(await outboundReason(VALID, async () => Object.freeze([]))).toBe('dns_empty');
  });

  it('rejects malformed resolver result', async () => {
    expect(
      await outboundReason(VALID, async () =>
        Object.freeze([{ address: 'not-an-ip', family: 4 as const }]),
      ),
    ).toBe('dns_malformed');
    expect(
      await outboundReason(VALID, async () =>
        Object.freeze([{ address: '8.8.8.8', family: 99 as unknown as 4 }]),
      ),
    ).toBe('dns_malformed');
  });

  it('classifies non-public resolved IP helpers', () => {
    expect(isNonPublicOutboundIp('8.8.8.8', 4)).toBe(false);
    expect(isNonPublicOutboundIp('127.0.0.1', 4)).toBe(true);
    expect(isNonPublicOutboundIp('::1', 6)).toBe(true);
    expect(isNonPublicOutboundIp('2001:4860:4860::8888', 6)).toBe(false);
    expect(isNonPublicOutboundIp('::ffff:127.0.0.1', 6)).toBe(true);
  });
});

describe('Web Push pinned HTTPS agent', () => {
  it('lookup returns only validated public addresses', () => {
    const agent = createWebPushPinnedHttpsAgent([
      PUBLIC_V4,
      { address: '2001:4860:4860::8888', family: 6 },
    ]);
    const lookup = agent.options.lookup;
    expect(typeof lookup).toBe('function');
    if (typeof lookup !== 'function') return;

    let v4: string | undefined;
    lookup('fcm.googleapis.com', { family: 4 }, (err, address, family) => {
      expect(err).toBeNull();
      v4 = String(address);
      expect(family).toBe(4);
    });
    expect(v4).toBe('8.8.8.8');

    let v6: string | undefined;
    lookup('fcm.googleapis.com', { family: 6 }, (err, address, family) => {
      expect(err).toBeNull();
      v6 = String(address);
      expect(family).toBe(6);
    });
    expect(v6).toBe('2001:4860:4860::8888');
    agent.destroy();
  });

  it('lookup with all:true returns address objects (Node 18+ https.Agent)', () => {
    const agent = createWebPushPinnedHttpsAgent([
      PUBLIC_V4,
      { address: '2001:4860:4860::8888', family: 6 },
    ]);
    const lookup = agent.options.lookup;
    expect(typeof lookup).toBe('function');
    if (typeof lookup !== 'function') return;

    let addresses: Array<{ address: string; family: number }> | undefined;
    lookup('fcm.googleapis.com', { all: true }, ((err: Error | null, result: unknown) => {
      expect(err).toBeNull();
      addresses = result as Array<{ address: string; family: number }>;
    }) as (err: Error | null, address: string, family: number) => void);
    expect(addresses).toEqual([
      { address: '8.8.8.8', family: 4 },
      { address: '2001:4860:4860::8888', family: 6 },
    ]);
    agent.destroy();
  });
});

describe('Web Push redirect / send-path outbound validation', () => {
  it('treats HTTP redirects as fail-closed (not transport acceptance)', () => {
    expect(classifyWebPushHttpStatus(301)).not.toBe('ok');
    expect(classifyWebPushHttpStatus(302)).not.toBe('ok');
    expect(classifyWebPushHttpStatus(307)).not.toBe('ok');
    expect(classifyWebPushHttpStatus(308)).not.toBe('ok');
  });

  it('send path validates DNS immediately before outbound delivery', async () => {
    const resolveDns = vi.fn(async () => Object.freeze([PUBLIC_V4]));
    let sawAgent = false;
    const sendFn: WebPushSendFn = async (_sub, _payload, options) => {
      sawAgent = Boolean(options.agent);
      return { statusCode: 201 };
    };
    const credentials = {
      resolve: async () =>
        Object.freeze({
          ok: true as const,
          credential: Object.freeze({
            publicKey: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u',
            privateKey: 'fake-test-private-key-not-real',
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
            endpoint: VALID,
            p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u',
            auth: 'tBHItJI5svbpez7KI4CCXg',
            status: 'active' as const,
            createdAt: '2026-09-16T12:00:00.000Z',
            updatedAt: '2026-09-16T12:00:00.000Z',
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
      resolveDns,
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
    expect(resolveDns).toHaveBeenCalledWith('fcm.googleapis.com');
    expect(sawAgent).toBe(true);
  });

  it('send path rejects when DNS resolves to private address', async () => {
    const resolveDns = vi.fn(async () =>
      Object.freeze([{ address: '10.0.0.1', family: 4 as const }]),
    );
    const sendFn = vi.fn(async () => ({ statusCode: 201 }));
    const credentials = {
      resolve: async () =>
        Object.freeze({
          ok: true as const,
          credential: Object.freeze({
            publicKey: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u',
            privateKey: 'fake-test-private-key-not-real',
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
            endpoint: VALID,
            p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u',
            auth: 'tBHItJI5svbpez7KI4CCXg',
            status: 'active' as const,
            createdAt: '2026-09-16T12:00:00.000Z',
            updatedAt: '2026-09-16T12:00:00.000Z',
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
      resolveDns,
    );
    const result = await adapter.send({
      chatId: 'user-1',
      subject: 'Test',
      body: 'Hello',
      workspaceId: 'ws-1',
      actorUserId: 'user-1',
      actorRole: Role.Admin,
    });
    expect(result).toEqual({ ok: false, detail: 'web_push_blocked_endpoint' });
    expect(sendFn).not.toHaveBeenCalled();
  });
});

describe('Web Push registration path DNS validation', () => {
  it('refuses persistence when outbound DNS policy fails', async () => {
    const { WebPushSubscriptionService } =
      await import('../modules/notification-delivery/web-push-subscription.service');
    const upsert = vi.fn();
    const service = new WebPushSubscriptionService(
      { upsert, listActive: async () => [] } as never,
      async () => Object.freeze([{ address: '127.0.0.1', family: 4 as const }]),
    );
    await expect(
      service.upsert({
        workspaceId: 'ws-1',
        userId: 'user-1',
        endpoint: VALID,
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u',
        auth: 'tBHItJI5svbpez7KI4CCXg',
      }),
    ).rejects.toThrow(/not allowed/);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('persists only after public DNS validation succeeds', async () => {
    const { WebPushSubscriptionService } =
      await import('../modules/notification-delivery/web-push-subscription.service');
    const upsert = vi.fn(async (input: { endpoint: string }) =>
      Object.freeze({
        id: 'sub-1',
        workspaceId: 'ws-1',
        userId: 'user-1',
        providerKind: 'web-push' as const,
        endpoint: input.endpoint,
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u',
        auth: 'tBHItJI5svbpez7KI4CCXg',
        status: 'active' as const,
        createdAt: '2026-09-16T12:00:00.000Z',
        updatedAt: '2026-09-16T12:00:00.000Z',
      }),
    );
    const service = new WebPushSubscriptionService(
      { upsert, listActive: async () => [] } as never,
      resolveTo(PUBLIC_V4),
    );
    const view = await service.upsert({
      workspaceId: 'ws-1',
      userId: 'user-1',
      endpoint: VALID,
      p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u',
      auth: 'tBHItJI5svbpez7KI4CCXg',
    });
    expect(upsert).toHaveBeenCalledOnce();
    expect(view.id).toBe('sub-1');
    expect(JSON.stringify(view)).not.toContain(VALID);
  });
});

import { describe, expect, it } from 'vitest';
import { loadSecurityPlatformConfig } from './security-config';
import {
  INVALID_HEADER_MESSAGE,
  INVALID_HOST_MESSAGE,
  REQUEST_TOO_LARGE_MESSAGE,
  registerSecurityPlatformHttpHooks,
} from './security-platform.http';

type Hook = (...args: never[]) => Promise<unknown>;

function createServerHarness(env: NodeJS.ProcessEnv = {}) {
  const hooks = new Map<string, Hook>();
  const server = {
    addHook(name: string, hook: Hook) {
      hooks.set(name, hook);
    },
  };

  registerSecurityPlatformHttpHooks(
    server as never,
    loadSecurityPlatformConfig({
      NODE_ENV: 'test',
      API_MAX_REQUEST_BODY_BYTES: '1024',
      ...env,
    }),
  );

  return { hooks };
}

function createReply() {
  const body: { value?: unknown; status?: number } = {};
  const headers = new Map<string, string | number | string[]>();
  return {
    body,
    reply: {
      code(status: number) {
        body.status = status;
        return {
          send(value: unknown) {
            body.value = value;
          },
        };
      },
      removeHeader(name: string) {
        headers.delete(name.toLowerCase());
      },
      header(name: string, value: string) {
        headers.set(name.toLowerCase(), value);
      },
      getHeader(name: string) {
        return headers.get(name.toLowerCase());
      },
    },
    headers,
  };
}

describe('security-platform HTTP hardening (V3-S04-b)', () => {
  it('rejects a declared request body beyond the platform limit before parsing', async () => {
    const { hooks } = createServerHarness();
    const { body, reply } = createReply();

    await hooks.get('onRequest')?.(
      {
        query: {},
        headers: { host: 'localhost', 'content-length': '1025' },
      } as never,
      reply as never,
    );

    expect(body).toEqual({
      status: 413,
      value: { statusCode: 413, message: REQUEST_TOO_LARGE_MESSAGE },
    });
  });

  it('rejects an untrusted Host header', async () => {
    const { hooks } = createServerHarness();
    const { body, reply } = createReply();

    await hooks.get('onRequest')?.(
      {
        query: {},
        headers: { host: 'attacker.example' },
      } as never,
      reply as never,
    );

    expect(body).toEqual({
      status: 400,
      value: { statusCode: 400, message: INVALID_HOST_MESSAGE },
    });
  });

  it('rejects CRLF header smuggling values', async () => {
    const { hooks } = createServerHarness();
    const { body, reply } = createReply();

    await hooks.get('onRequest')?.(
      {
        query: {},
        headers: { host: 'localhost', 'x-client-input': 'ok\r\nSet-Cookie: forged=true' },
      } as never,
      reply as never,
    );

    expect(body).toEqual({
      status: 400,
      value: { statusCode: 400, message: INVALID_HEADER_MESSAGE },
    });
  });

  it('maps Fastify body-too-large errors to the platform message', async () => {
    const { hooks } = createServerHarness();
    const { body, reply } = createReply();

    await hooks.get('onError')?.(
      { query: {}, headers: { host: 'localhost' } } as never,
      reply as never,
      { statusCode: 413, code: 'FST_ERR_CTP_BODY_TOO_LARGE' } as never,
    );

    expect(body).toEqual({
      status: 413,
      value: { statusCode: 413, message: REQUEST_TOO_LARGE_MESSAGE },
    });
  });

  it('removes disclosure headers and applies no-store when an endpoint has no cache policy', async () => {
    const { hooks } = createServerHarness();
    const { reply, headers } = createReply();
    headers.set('server', 'Fastify');
    headers.set('x-powered-by', 'NestJS');

    const payload = '{"ok":true}';
    const result = await hooks.get('onSend')?.(
      { query: {}, headers: { host: 'localhost' } } as never,
      reply as never,
      payload as never,
    );

    expect(result).toBe(payload);
    expect(headers.get('server')).toBeUndefined();
    expect(headers.get('x-powered-by')).toBeUndefined();
    expect(headers.get('cache-control')).toBe('no-store');
  });

  it('temporarily refuses repeated sensitive requests at the HTTP edge', async () => {
    const { hooks } = createServerHarness({
      API_SENSITIVE_RATE_LIMIT: '10',
    });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { body, reply } = createReply();
      await hooks.get('onRequest')?.(
        {
          ip: '203.0.113.10',
          url: '/v1/auth/login',
          query: {},
          headers: { host: 'localhost' },
        } as never,
        reply as never,
      );
      expect(body.status).toBeUndefined();
    }

    const { body, reply, headers } = createReply();
    await hooks.get('onRequest')?.(
      {
        ip: '203.0.113.10',
        url: '/v1/auth/login',
        query: {},
        headers: { host: 'localhost' },
      } as never,
      reply as never,
    );

    expect(body).toEqual({
      status: 429,
      value: { statusCode: 429, message: 'Too many requests. Please try again later.' },
    });
    expect(headers.get('retry-after')).toBe('60');
  });

  it('temporarily refuses repeated general requests at the HTTP edge', async () => {
    const { hooks } = createServerHarness({
      API_PLATFORM_RATE_LIMIT: '10',
    });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { body, reply } = createReply();
      await hooks.get('onRequest')?.(
        {
          ip: '203.0.113.11',
          url: '/v1/people',
          query: {},
          headers: { host: 'localhost', 'x-forwarded-for': '203.0.113.11' },
        } as never,
        reply as never,
      );
      expect(body.status).toBeUndefined();
    }

    const { body, reply, headers } = createReply();
    await hooks.get('onRequest')?.(
      {
        ip: '203.0.113.11',
        url: '/v1/orders',
        query: {},
        headers: { host: 'localhost', 'x-forwarded-for': '203.0.113.11' },
      } as never,
      reply as never,
    );

    expect(body).toEqual({
      status: 429,
      value: { statusCode: 429, message: 'Too many requests. Please try again later.' },
    });
    expect(headers.get('retry-after')).toBe('60');
  });
});

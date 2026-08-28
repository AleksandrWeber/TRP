import { Body, Controller, Get, HttpException, Post } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import helmet from '@fastify/helmet';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Logger } from '../logging/logger';
import { LOGGER } from '../logging/logger.token';
import { LoggingModule } from '../logging/logging.module';
import { ValidationModule } from '../validation';
import { createBrowserSecurityPolicy } from './browser-security';
import { ABUSE_LIMIT_MESSAGE } from './platform-abuse-protection';
import { loadSecurityPlatformConfig } from './security-config';
import {
  REQUEST_TOO_LARGE_MESSAGE,
  registerSecurityPlatformHttpHooks,
} from './security-platform.http';
import { SecurityPlatformModule } from './security-platform.module';
import {
  MONITORING_HEALTH_STATE_REPOSITORY,
  type MonitoringHealthStateRepository,
} from './monitoring-health/domain/monitoring-health-state.repository';

function createEmptyMonitoringHealthRepository(): MonitoringHealthStateRepository {
  return {
    async saveMonitoringHealthState() {},
    async loadMonitoringHealthState() {
      return null;
    },
    async listAllMonitoringHealthStates() {
      return Object.freeze([]);
    },
  };
}

function createSecurityPlatformTestModule(logger: RecordingLogger) {
  return Test.createTestingModule({
    imports: [LoggingModule, ValidationModule, SecurityPlatformModule],
    controllers: [SecurityPlatformTestController],
    providers: [{ provide: LOGGER, useValue: logger }],
  })
    .overrideProvider(MONITORING_HEALTH_STATE_REPOSITORY)
    .useValue(createEmptyMonitoringHealthRepository());
}

class RecordingLogger implements Logger {
  readonly entries: Array<{ level: string; message: string }> = [];

  child(): Logger {
    return this;
  }

  debug(): void {}
  info(message: string): void {
    this.entries.push({ level: 'info', message });
  }
  warn(message: string): void {
    this.entries.push({ level: 'warn', message });
  }
  error(message: string): void {
    this.entries.push({ level: 'error', message });
  }
}

@Controller('security-platform-test')
class SecurityPlatformTestController {
  @Get('boom')
  boom(): never {
    throw new Error('PrismaClientKnownRequestError at node_modules/.prisma/client');
  }

  @Get('http-error')
  httpError(): never {
    throw new HttpException('Forbidden resource', 403);
  }

  @Get('echo')
  echo(): { ok: true } {
    return { ok: true };
  }

  @Post('echo')
  echoPost(@Body() _body: unknown): { ok: true } {
    return { ok: true };
  }
}

describe('security-platform HTTP integration (V3-S04-a)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const logger = new RecordingLogger();
    const moduleRef = await createSecurityPlatformTestModule(logger).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({
        bodyLimit: 512,
      }),
    );
    await app.register(helmet, {
      global: true,
      ...createBrowserSecurityPolicy({ NODE_ENV: 'production' }),
    });
    registerSecurityPlatformHttpHooks(
      app.getHttpAdapter().getInstance(),
      loadSecurityPlatformConfig({
        NODE_ENV: 'test',
        API_MAX_REQUEST_BODY_BYTES: '512',
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('sanitizes unhandled errors without framework leakage', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/security-platform-test/boom',
    });

    expect(response.statusCode).toBe(500);
    const body = response.json() as { message: string };
    expect(body.message).toBe('Internal server error');
    expect(response.body).not.toContain('Prisma');
    expect(response.body).not.toContain('stack');
  });

  it('keeps safe HttpException messages', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/security-platform-test/http-error',
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      statusCode: 403,
      message: 'Forbidden resource',
    });
  });

  it('rejects conflicting duplicate query parameters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/security-platform-test/echo?role=admin&role=reader',
    });

    expect(response.statusCode).toBe(400);
    const body = response.json() as { field: string; message: string };
    expect(body.field).toBe('role');
    expect(body.message).toContain('duplicate query parameters');
  });

  it('rejects an oversized request body with a sanitized platform message', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/security-platform-test/echo',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ data: 'x'.repeat(600) }),
    });

    expect(response.statusCode).toBe(413);
    expect(response.json()).toEqual({
      statusCode: 413,
      message: REQUEST_TOO_LARGE_MESSAGE,
    });
    expect(response.body).not.toContain('FST_ERR');
  });

  it('removes technology disclosures and prevents response caching', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/security-platform-test/echo',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers.server).toBeUndefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('applies browser protections to every platform response', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/security-platform-test/echo',
    });

    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['permissions-policy']).toContain('camera=()');
    expect(response.headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
  });
});

describe('security-platform abuse flood integration (V3-S04-d)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const logger = new RecordingLogger();
    const moduleRef = await createSecurityPlatformTestModule(logger).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({
        bodyLimit: 512,
        trustProxy: true,
      }),
    );
    await app.register(helmet, {
      global: true,
      ...createBrowserSecurityPolicy({ NODE_ENV: 'production' }),
    });
    registerSecurityPlatformHttpHooks(
      app.getHttpAdapter().getInstance(),
      loadSecurityPlatformConfig({
        NODE_ENV: 'test',
        API_MAX_REQUEST_BODY_BYTES: '512',
        API_PLATFORM_RATE_LIMIT: '10',
        API_SENSITIVE_RATE_LIMIT: '3',
        API_PLATFORM_RATE_WINDOW_MS: '60000',
        API_SENSITIVE_RATE_WINDOW_MS: '60000',
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects an untrusted Host before abuse checks run', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/security-platform-test/echo',
      headers: { host: 'attacker.example' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('loads the low-quota abuse policy used by this harness', () => {
    expect(
      loadSecurityPlatformConfig({
        NODE_ENV: 'test',
        API_PLATFORM_RATE_LIMIT: '10',
        API_SENSITIVE_RATE_LIMIT: '3',
      }).platformAbusePolicy,
    ).toEqual({
      general: { limit: 10, windowMs: 60_000 },
      sensitive: { limit: 3, windowMs: 60_000 },
    });
  });

  it('returns 429 with retry-after after the general platform quota is exceeded', async () => {
    const floodHeaders = {
      host: 'localhost',
      'x-forwarded-for': '203.0.113.10',
    };

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const allowed = await app.inject({
        method: 'GET',
        url: '/security-platform-test/echo',
        headers: floodHeaders,
      });
      expect(allowed.statusCode).toBe(200);
    }

    const throttled = await app.inject({
      method: 'GET',
      url: '/security-platform-test/echo',
      headers: floodHeaders,
    });

    expect(throttled.statusCode).toBe(429);
    expect(throttled.headers['retry-after']).toBe('60');
    expect(throttled.json()).toEqual({
      statusCode: 429,
      message: ABUSE_LIMIT_MESSAGE,
    });
    expect(throttled.body).not.toContain('stack');
  });

  it('returns 429 for sensitive auth paths before route handlers run', async () => {
    const floodHeaders = {
      host: 'localhost',
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.20',
    };
    const loginPayload = JSON.stringify({ email: 'a@example.com', password: 'wrong' });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const allowed = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        headers: floodHeaders,
        payload: loginPayload,
      });
      expect(allowed.statusCode).not.toBe(429);
    }

    const throttled = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: floodHeaders,
      payload: loginPayload,
    });

    expect(throttled.statusCode).toBe(429);
    expect(throttled.headers['retry-after']).toBe('60');
    expect(throttled.json()).toEqual({
      statusCode: 429,
      message: ABUSE_LIMIT_MESSAGE,
    });
  });
});

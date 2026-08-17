import { normalizeIncomingQuery, PARAMETER_POLLUTION_MESSAGE } from './request-normalization';
import type { Logger } from '../logging/logger';
import type { SecurityAuditService } from '../modules/security-audit/security-audit.service';
import type { SecurityPlatformConfig } from './security-config';
import { ABUSE_LIMIT_MESSAGE, PlatformAbuseProtector } from './platform-abuse-protection';
import { emitPlatformSecurityEvent } from './security-event';

const PERMISSIONS_POLICY = 'camera=(), geolocation=(), microphone=(), payment=(), usb=()';

type SecurityPlatformRequest = {
  query: unknown;
  ip: string;
  url: string;
  socket?: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
};

type SecurityPlatformReply = {
  code: (status: number) => { send: (body: unknown) => unknown };
  removeHeader: (name: string) => unknown;
  header: (name: string, value: string) => unknown;
  getHeader: (name: string) => string | number | string[] | undefined;
};

type PlatformHttpError = {
  statusCode?: number;
  code?: string;
};

type SecurityPlatformHttpServer = {
  addHook(
    name: 'onRequest',
    hook: (request: SecurityPlatformRequest, reply: SecurityPlatformReply) => Promise<void>,
  ): void;
  addHook(
    name: 'onSend',
    hook: (
      request: SecurityPlatformRequest,
      reply: SecurityPlatformReply,
      payload: unknown,
    ) => Promise<unknown>,
  ): void;
  addHook(
    name: 'onError',
    hook: (
      request: SecurityPlatformRequest,
      reply: SecurityPlatformReply,
      error: PlatformHttpError,
    ) => Promise<void>,
  ): void;
};

function isBodyTooLargeError(error: PlatformHttpError): boolean {
  return error.statusCode === 413 || error.code === 'FST_ERR_CTP_BODY_TOO_LARGE';
}

export const REQUEST_TOO_LARGE_MESSAGE = 'Request body is too large';
export const INVALID_HOST_MESSAGE = 'Request host is not allowed';
export const INVALID_HEADER_MESSAGE = 'Request contains an invalid header value';

function normalizeHost(host: string): string {
  const value = host.trim().toLowerCase();
  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    return end >= 0 ? value.slice(0, end + 1) : value;
  }
  return value.split(':', 1)[0] ?? '';
}

function hasControlCharacters(value: string): boolean {
  return /[\r\n\0]/.test(value);
}

function requestIsTooLarge(request: SecurityPlatformRequest, maxBytes: number): boolean {
  const raw = request.headers['content-length'];
  const contentLength = Array.isArray(raw) ? raw[0] : raw;
  if (!contentLength) return false;
  const value = Number(contentLength);
  return Number.isFinite(value) && value > maxBytes;
}

function requestHasUnsafeHeaderValue(request: SecurityPlatformRequest): boolean {
  return Object.values(request.headers).some((value) => {
    const values = Array.isArray(value) ? value : [value];
    return values.some((item) => typeof item === 'string' && hasControlCharacters(item));
  });
}

function requestHostIsAllowed(
  request: SecurityPlatformRequest,
  allowedHosts: readonly string[],
): boolean {
  const raw = request.headers.host;
  if (Array.isArray(raw) || typeof raw !== 'string') return false;
  return allowedHosts.includes(normalizeHost(raw));
}

function resolveClientIp(request: SecurityPlatformRequest): string {
  if (typeof request.ip === 'string' && request.ip.length > 0) {
    return request.ip;
  }

  const forwarded = request.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof forwardedValue === 'string' && forwardedValue.length > 0) {
    return forwardedValue.split(',')[0]?.trim() || 'unknown';
  }

  const remoteAddress = request.socket?.remoteAddress;
  if (typeof remoteAddress === 'string' && remoteAddress.length > 0) {
    return remoteAddress;
  }

  return 'unknown';
}

function rejectRequest(reply: SecurityPlatformReply, message: string): Promise<unknown> {
  return reply.code(400).send({
    statusCode: 400,
    message,
  }) as Promise<unknown>;
}

/**
 * Register S04-a/S04-b platform-wide HTTP normalization and hardening.
 */
export function registerSecurityPlatformHttpHooks(
  server: SecurityPlatformHttpServer,
  config: Pick<
    SecurityPlatformConfig,
    'allowedHosts' | 'maxRequestBodyBytes' | 'platformAbusePolicy'
  >,
  options: Readonly<{ logger?: Logger; audit?: SecurityAuditService }> = {},
): void {
  const abuseProtector = new PlatformAbuseProtector(config.platformAbusePolicy);
  const logger = options.logger;
  const audit = options.audit;

  server.addHook(
    'onRequest',
    async (request: SecurityPlatformRequest, reply: SecurityPlatformReply) => {
      if (!requestHostIsAllowed(request, config.allowedHosts)) {
        await rejectRequest(reply, INVALID_HOST_MESSAGE);
        return;
      }

      if (requestHasUnsafeHeaderValue(request)) {
        await rejectRequest(reply, INVALID_HEADER_MESSAGE);
        return;
      }

      if (requestIsTooLarge(request, config.maxRequestBodyBytes)) {
        await reply.code(413).send({
          statusCode: 413,
          message: REQUEST_TOO_LARGE_MESSAGE,
        });
        return;
      }

      const abuseDecision = abuseProtector.check(resolveClientIp(request), request.url || '/');
      if (!abuseDecision.allowed) {
        reply.header('retry-after', String(abuseDecision.retryAfterSeconds));
        if (logger) {
          emitPlatformSecurityEvent(
            logger.child('PlatformAbuseProtector'),
            {
              type: 'platform.abuse.throttled',
              ip: resolveClientIp(request),
              path: request.url || '/',
              statusCode: 429,
            },
            audit,
          );
        }
        await reply.code(429).send({
          statusCode: 429,
          message: ABUSE_LIMIT_MESSAGE,
        });
        return;
      }

      const query = request.query;
      if (!query || typeof query !== 'object' || Array.isArray(query)) {
        return;
      }

      const normalized = normalizeIncomingQuery(query as Record<string, unknown>);
      if (!normalized.ok) {
        await reply.code(400).send({
          statusCode: 400,
          message: PARAMETER_POLLUTION_MESSAGE,
          field: normalized.field,
        });
        return;
      }

      request.query = normalized.query;
    },
  );

  server.addHook('onSend', async (_request, reply, payload) => {
    reply.removeHeader('server');
    reply.removeHeader('x-powered-by');
    if (reply.getHeader('cache-control') === undefined) {
      reply.header('cache-control', 'no-store');
    }
    if (reply.getHeader('permissions-policy') === undefined) {
      reply.header('permissions-policy', PERMISSIONS_POLICY);
    }
    return payload;
  });

  server.addHook('onError', async (_request, reply, error) => {
    if (!isBodyTooLargeError(error)) {
      return;
    }

    await reply.code(413).send({
      statusCode: 413,
      message: REQUEST_TOO_LARGE_MESSAGE,
    });
  });
}

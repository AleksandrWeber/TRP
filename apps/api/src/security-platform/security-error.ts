import { HttpException, HttpStatus } from '@nestjs/common';
import { shapePlatformDeny } from './anti-enumeration';
import type { SecurityPlatformConfig } from './security-config';

const INTERNAL_MESSAGE = 'Internal server error';
const FRAMEWORK_MARKERS = [
  'prisma',
  'nestjs',
  'fastify',
  'typeorm',
  'sequelize',
  'node_modules',
] as const;

export type SanitizedClientError = Readonly<{
  statusCode: number;
  message: string | string[];
  error?: string;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function containsFrameworkMarker(value: string): boolean {
  const lower = value.toLowerCase();
  return FRAMEWORK_MARKERS.some((marker) => lower.includes(marker));
}

function sanitizeMessage(value: unknown, exposeDetail: boolean): string | string[] {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMessage(item, exposeDetail)).map(String);
  }

  if (typeof value !== 'string') {
    return exposeDetail ? String(value) : INTERNAL_MESSAGE;
  }

  if (containsFrameworkMarker(value)) {
    return INTERNAL_MESSAGE;
  }

  if (!exposeDetail) {
    return INTERNAL_MESSAGE;
  }

  return value;
}

function messageText(message: string | string[]): string {
  return Array.isArray(message) ? message.join(' ') : message;
}

function applyPlatformDenyShape(error: SanitizedClientError): SanitizedClientError {
  const shaped = shapePlatformDeny(error.statusCode, messageText(error.message));
  if (!shaped) {
    return error;
  }

  return {
    statusCode: shaped.statusCode,
    message: shaped.message,
  };
}

/**
 * Remove stack traces, framework banners, and other customer-leaking fields.
 */
export function sanitizeClientError(
  exception: unknown,
  config: Pick<SecurityPlatformConfig, 'exposeErrorDetail'>,
): SanitizedClientError {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const body = exception.getResponse();

    if (typeof body === 'string') {
      return applyPlatformDenyShape({
        statusCode: status,
        message: sanitizeMessage(body, config.exposeErrorDetail),
        error: status === HttpStatus.BAD_REQUEST ? 'Bad Request' : undefined,
      });
    }

    if (isRecord(body)) {
      const message = body.message ?? exception.message;
      const errorLabel = typeof body.error === 'string' ? body.error : undefined;
      return applyPlatformDenyShape({
        statusCode: status,
        message: sanitizeMessage(message, config.exposeErrorDetail),
        ...(errorLabel && config.exposeErrorDetail ? { error: errorLabel } : {}),
      });
    }

    return applyPlatformDenyShape({
      statusCode: status,
      message: sanitizeMessage(exception.message, config.exposeErrorDetail),
    });
  }

  if (exception instanceof Error) {
    if (config.exposeErrorDetail && exception.message.trim().length > 0) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: sanitizeMessage(exception.message, true),
      };
    }
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: INTERNAL_MESSAGE,
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: INTERNAL_MESSAGE,
  };
}

export function errorResponseLeaksInternals(body: unknown): boolean {
  const serialized = JSON.stringify(body);
  if (serialized.includes('"stack"')) return true;
  return containsFrameworkMarker(serialized);
}

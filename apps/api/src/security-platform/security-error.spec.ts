import { HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { PLATFORM_ACCESS_DENIED_MESSAGE } from './anti-enumeration';
import { errorResponseLeaksInternals, sanitizeClientError } from './security-error';

describe('security-error (V3-S04-a)', () => {
  it('sanitizes framework leakage in production posture', () => {
    const body = sanitizeClientError(
      new InternalServerErrorException('PrismaClientKnownRequestError at node_modules/.prisma'),
      { exposeErrorDetail: false },
    );

    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('Internal server error');
    expect(errorResponseLeaksInternals(body)).toBe(false);
  });

  it('shapes existence-oracle deny responses at the platform edge', () => {
    const body = sanitizeClientError(new HttpException('User not found', HttpStatus.NOT_FOUND), {
      exposeErrorDetail: true,
    });

    expect(body.statusCode).toBe(403);
    expect(body.message).toBe(PLATFORM_ACCESS_DENIED_MESSAGE);
  });

  it('preserves non-oracle HttpException messages in development', () => {
    const body = sanitizeClientError(
      new HttpException('Forbidden resource', HttpStatus.FORBIDDEN),
      {
        exposeErrorDetail: true,
      },
    );

    expect(body.statusCode).toBe(403);
    expect(body.message).toBe('Forbidden resource');
  });

  it('never returns stack traces in serialized bodies', () => {
    const error = new Error('boom');
    error.stack = 'Error: boom\n    at node_modules/nestjs/core';
    const body = sanitizeClientError(error, { exposeErrorDetail: true });
    expect(errorResponseLeaksInternals(body)).toBe(false);
    expect(JSON.stringify(body)).not.toContain('node_modules');
  });

  it('always redacts framework markers even when error detail is enabled', () => {
    const body = sanitizeClientError(new Error('Prisma timeout in node_modules'), {
      exposeErrorDetail: true,
    });
    expect(body.message).toBe('Internal server error');
  });
});

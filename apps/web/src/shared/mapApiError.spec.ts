import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractBackendMessage, mapHttpError, toUserFacingError } from './mapApiError';

describe('mapHttpError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps 400 to a generic validation message and logs raw body', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const raw = JSON.stringify({
      statusCode: 400,
      error: 'Bad Request',
      message: ['datasetId must be a string'],
    });

    expect(mapHttpError(400, raw)).toBe('Please check your input.');
    expect(spy).toHaveBeenCalled();
  });

  it('maps 400 password policy errors to product language', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(
      mapHttpError(
        400,
        JSON.stringify({
          statusCode: 400,
          errors: [
            {
              code: 'isProductPassword',
              message: 'Password must include a letter and a number.',
              field: 'password',
              value: '[redacted]',
            },
          ],
        }),
      ),
    ).toBe('Password must include a letter and a number.');
  });

  it('maps recovery and current-password 400s to operator language', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(
      mapHttpError(
        400,
        JSON.stringify({ message: 'This recovery link is invalid or has expired.' }),
      ),
    ).toBe('This recovery link is invalid or has expired.');
    expect(mapHttpError(400, JSON.stringify({ message: 'Current password is incorrect.' }))).toBe(
      'Current password is incorrect.',
    );
  });

  it('maps experiment 404 without exposing JSON', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const raw = JSON.stringify({
      statusCode: 404,
      error: 'Not Found',
      message: 'Experiment abc not found',
    });

    expect(mapHttpError(404, raw)).toBe('Experiment not found.');
    expect(mapHttpError(404, raw)).not.toContain('{');
  });

  it('maps workspace 404 without exposing JSON', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(mapHttpError(404, JSON.stringify({ message: 'Workspace not found' }))).toBe(
      'Workspace not found.',
    );
  });

  it('maps session 404 to operator language', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(mapHttpError(404, JSON.stringify({ message: 'Session not found.' }))).toBe(
      'That sign-in is no longer listed.',
    );
  });

  it('maps generic 404', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(mapHttpError(404, JSON.stringify({ message: 'Dataset missing' }))).toBe(
      'Requested resource was not found.',
    );
  });

  it('maps already-archived 404', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(mapHttpError(404, JSON.stringify({ message: 'Resource already archived' }))).toBe(
      'Already archived.',
    );
  });

  it('maps 409 duplicate account without exposing JSON', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(
      mapHttpError(409, JSON.stringify({ message: 'User with email already exists: a@b.com' })),
    ).toBe('An account with this email already exists.');
  });

  it('maps deployment idempotency 409 without exposing JSON', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(
      mapHttpError(
        409,
        JSON.stringify({
          message: 'idempotency key reused with a different strategy deployment command',
        }),
      ),
    ).toBe('This deployment request was already submitted with different details.');
  });

  it('maps Gate FAIL 422 without override copy', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(
      mapHttpError(
        422,
        JSON.stringify({
          message: 'runtime enforcement rejected deployment: certification_missing',
        }),
      ),
    ).toBe('Runtime Validation failed. The Gate did not PASS. There is no override.');
  });

  it('maps orchestration rejection 422 without implying Session start', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(
      mapHttpError(422, JSON.stringify({ message: 'strategy_ineligible, eligibility:symbol' })),
    ).toBe('Orchestration was rejected. Session was not started.');
  });

  it('maps 500 without exposing JSON', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const raw = JSON.stringify({ statusCode: 500, message: 'Internal server error' });
    expect(mapHttpError(500, raw)).toBe('Unexpected server error. Please try again later.');
  });
});

describe('extractBackendMessage / toUserFacingError', () => {
  it('extracts message from Nest-style JSON', () => {
    expect(extractBackendMessage('{"message":"hello","statusCode":404}')).toBe('hello');
  });

  it('sanitizes raw JSON Error messages', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const err = new Error(JSON.stringify({ statusCode: 404, message: 'Experiment xyz not found' }));
    expect(toUserFacingError(err, 'fallback')).toBe('Experiment not found.');
  });
});

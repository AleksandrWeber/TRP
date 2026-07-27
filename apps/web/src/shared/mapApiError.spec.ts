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

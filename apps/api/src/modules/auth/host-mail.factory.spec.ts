import { describe, expect, it } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { createHostMail, publicAppOrigin } from './host-mail.factory';
import { UnconfiguredHostMail } from './host-mail';

describe('host mail factory (V3-S01-e)', () => {
  it('is unconfigured when MAIL_HOST is empty', () => {
    const config = { get: () => undefined } as unknown as ConfigService;
    expect(createHostMail(config)).toBeInstanceOf(UnconfiguredHostMail);
    expect(createHostMail(config).isConfigured()).toBe(false);
  });

  it('uses PUBLIC_APP_URL then CORS origin for reset links', () => {
    const withApp = {
      get: (key: string) => (key === 'PUBLIC_APP_URL' ? 'https://app.example/' : undefined),
    } as unknown as ConfigService;
    expect(publicAppOrigin(withApp)).toBe('https://app.example');

    const withCors = {
      get: (key: string) =>
        key === 'CORS_ORIGIN' ? 'http://localhost:5173,http://127.0.0.1:5173' : undefined,
    } as unknown as ConfigService;
    expect(publicAppOrigin(withCors)).toBe('http://localhost:5173');
  });
});

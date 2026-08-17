import { describe, expect, it } from 'vitest';
import { createBrowserSecurityHeaders } from './browser-security';

describe('browser security headers', () => {
  it('keeps cookie-authenticated API access and Vite live reload available in development', () => {
    const headers = createBrowserSecurityHeaders('development', 'http://localhost:3000');
    expect(headers['Content-Security-Policy']).toContain('http://localhost:3000');
    expect(headers['Content-Security-Policy']).toContain('ws://localhost:5173');
    expect(headers['Content-Security-Policy']).toContain("'unsafe-inline'");
  });

  it('uses a strict production policy without development exceptions', () => {
    const headers = createBrowserSecurityHeaders('production', 'https://api.example.com');
    expect(headers['Content-Security-Policy']).toContain('https://api.example.com');
    expect(headers['Content-Security-Policy']).not.toContain('ws://localhost:5173');
    expect(headers['Content-Security-Policy']).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });
});

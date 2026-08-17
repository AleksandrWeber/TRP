/**
 * Browser response protection for Vite development and preview.
 *
 * Development allows Vite live reload only. Production does not inherit
 * development script or websocket allowances.
 */
export function createBrowserSecurityHeaders(
  mode: string,
  apiUrl = 'http://localhost:3000',
): Record<string, string> {
  const isProduction = mode === 'production';
  const apiOrigin = new URL(apiUrl).origin;
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src 'self'${isProduction ? ` ${apiOrigin}` : ` ${apiOrigin} ws://localhost:5173`}`,
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "object-src 'none'",
    `script-src 'self'${isProduction ? '' : " 'unsafe-inline'"}`,
    "style-src 'self' 'unsafe-inline'",
  ];

  return {
    'Content-Security-Policy': directives.join('; '),
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

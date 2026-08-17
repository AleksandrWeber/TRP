export type BrowserSecurityPolicy = Readonly<{
  contentSecurityPolicy: Readonly<{
    directives: Readonly<Record<string, readonly string[]>>;
  }>;
  crossOriginEmbedderPolicy: false;
  crossOriginOpenerPolicy: Readonly<{ policy: 'same-origin' }>;
  crossOriginResourcePolicy: Readonly<{ policy: 'cross-origin' }>;
  frameguard: Readonly<{ action: 'deny' }>;
  hidePoweredBy: true;
  noSniff: true;
  originAgentCluster: true;
  permittedCrossDomainPolicies: Readonly<{ permittedPolicies: 'none' }>;
  referrerPolicy: Readonly<{ policy: 'no-referrer' }>;
  hsts: Readonly<{ maxAge: number; includeSubDomains: true; preload: false }> | false;
}>;

const PRODUCTION_DIRECTIVES = {
  'base-uri': ["'self'"],
  'connect-src': ["'self'"],
  'default-src': ["'self'"],
  'font-src': ["'self'", 'data:'],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'object-src': ["'none'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
} as const;

const DEVELOPMENT_DIRECTIVES = {
  ...PRODUCTION_DIRECTIVES,
  'connect-src': ["'self'", 'http://localhost:3000', 'ws://localhost:5173'],
  'script-src': ["'self'", "'unsafe-inline'"],
} as const;

/**
 * Browser-facing response defaults inherited by every API response.
 *
 * Development keeps only the Vite live-reload allowances. Production never
 * inherits those allowances.
 */
export function createBrowserSecurityPolicy(
  env: NodeJS.ProcessEnv = process.env,
): BrowserSecurityPolicy {
  const isProduction = (env.NODE_ENV ?? 'development').trim().toLowerCase() === 'production';

  return {
    contentSecurityPolicy: {
      directives: isProduction ? PRODUCTION_DIRECTIVES : DEVELOPMENT_DIRECTIVES,
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    // cross-origin keeps cookie-authenticated SPA requests working across web/API origins.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: isProduction ? { maxAge: 31_536_000, includeSubDomains: true, preload: false } : false,
  };
}

function parseBooleanFlag(value: string | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === 'true';
}

/**
 * Fail closed when production would run without browser protections.
 */
export function collectBrowserSecurityIssues(env: NodeJS.ProcessEnv = process.env): string[] {
  const issues: string[] = [];
  const isProduction = (env.NODE_ENV ?? 'development').trim().toLowerCase() === 'production';

  if (isProduction && parseBooleanFlag(env.SECURITY_DISABLE_BROWSER_POLICY)) {
    issues.push('SECURITY_DISABLE_BROWSER_POLICY is forbidden when NODE_ENV=production');
  }

  if (isProduction) {
    const policy = createBrowserSecurityPolicy(env);
    const directives = policy.contentSecurityPolicy.directives;
    if (directives['frame-ancestors']?.includes("'none'") !== true) {
      issues.push('Production browser policy must deny framing');
    }
    if (policy.frameguard.action !== 'deny') {
      issues.push('Production browser policy must use frame denial');
    }
    if (!policy.noSniff) {
      issues.push('Production browser policy must enable MIME sniffing protection');
    }
  }

  return issues;
}

export const BROWSER_SECURITY_HEADER_NAMES = [
  'content-security-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
  'permissions-policy',
  'referrer-policy',
  'x-content-type-options',
  'x-frame-options',
] as const;

/**
 * Browser policies that Vite serves in development/preview.
 * This mirrors the API stance without giving production Vite live-reload access.
 */
export function createWebBrowserSecurityHeaders(
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

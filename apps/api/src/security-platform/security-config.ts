import { verifyConfigurationValidity } from '../modules/health/configuration-validity';
import { collectBrowserSecurityIssues } from './browser-security';

/**
 * Resolved platform security configuration (V3-S04-a).
 * Loaded once at bootstrap; not a customer-facing settings product.
 */
export type SecurityPlatformConfig = Readonly<{
  nodeEnv: string;
  isProduction: boolean;
  allowInsecureMode: boolean;
  exposeErrorDetail: boolean;
  maxRequestBodyBytes: number;
  requestTimeoutMs: number;
  allowedHosts: readonly string[];
  platformAbusePolicy: Readonly<{
    general: Readonly<{ limit: number; windowMs: number }>;
    sensitive: Readonly<{ limit: number; windowMs: number }>;
  }>;
}>;

export type SecurityPlatformVerificationResult = Readonly<{
  valid: boolean;
  issues: readonly string[];
}>;

function parseBooleanFlag(value: string | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === 'true';
}

const DEFAULT_MAX_REQUEST_BODY_BYTES = 1_048_576;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const MIN_REQUEST_BODY_BYTES = 1_024;
const MAX_REQUEST_BODY_BYTES = 10_485_760;
const MIN_REQUEST_TIMEOUT_MS = 1_000;
const MAX_REQUEST_TIMEOUT_MS = 120_000;
const DEFAULT_GENERAL_QUOTA = 120;
const DEFAULT_SENSITIVE_QUOTA = 10;
const DEFAULT_ABUSE_WINDOW_MS = 60_000;

function parseBoundedInteger(
  value: string | undefined,
  defaultValue: number,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    return defaultValue;
  }
  return parsed;
}

function parseAllowedHosts(value: string | undefined, isProduction: boolean): readonly string[] {
  const configured = (value ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length > 0) {
    return [...new Set(configured)];
  }

  return isProduction ? [] : ['localhost', '127.0.0.1', '[::1]'];
}

/**
 * Load centralized security configuration from the process environment.
 */
export function loadSecurityPlatformConfig(
  env: NodeJS.ProcessEnv = process.env,
): SecurityPlatformConfig {
  const nodeEnv = (env.NODE_ENV ?? 'development').trim().toLowerCase();
  const isProduction = nodeEnv === 'production';
  const allowInsecureMode = parseBooleanFlag(env.SECURITY_ALLOW_INSECURE_MODE);
  const disableErrorSanitization = parseBooleanFlag(env.SECURITY_DISABLE_ERROR_SANITIZATION);

  return {
    nodeEnv,
    isProduction,
    allowInsecureMode,
    exposeErrorDetail: !isProduction && !allowInsecureMode && !disableErrorSanitization,
    maxRequestBodyBytes: parseBoundedInteger(
      env.API_MAX_REQUEST_BODY_BYTES,
      DEFAULT_MAX_REQUEST_BODY_BYTES,
      MIN_REQUEST_BODY_BYTES,
      MAX_REQUEST_BODY_BYTES,
    ),
    requestTimeoutMs: parseBoundedInteger(
      env.API_REQUEST_TIMEOUT_MS,
      DEFAULT_REQUEST_TIMEOUT_MS,
      MIN_REQUEST_TIMEOUT_MS,
      MAX_REQUEST_TIMEOUT_MS,
    ),
    allowedHosts: parseAllowedHosts(env.API_ALLOWED_HOSTS, isProduction),
    platformAbusePolicy: {
      general: {
        limit: parseBoundedInteger(env.API_PLATFORM_RATE_LIMIT, DEFAULT_GENERAL_QUOTA, 10, 10_000),
        windowMs: parseBoundedInteger(
          env.API_PLATFORM_RATE_WINDOW_MS,
          DEFAULT_ABUSE_WINDOW_MS,
          1_000,
          3_600_000,
        ),
      },
      sensitive: {
        limit: parseBoundedInteger(env.API_SENSITIVE_RATE_LIMIT, DEFAULT_SENSITIVE_QUOTA, 3, 1_000),
        windowMs: parseBoundedInteger(
          env.API_SENSITIVE_RATE_WINDOW_MS,
          DEFAULT_ABUSE_WINDOW_MS,
          1_000,
          3_600_000,
        ),
      },
    },
  };
}

export type NestThrottlerOptions = Readonly<{
  ttl: number;
  limit: number;
}>;

/**
 * Align Nest ThrottlerGuard with the platform general abuse quota.
 * Optional API_THROTTLE_* overrides remain for operators who need a stricter backup guard.
 */
export function resolveNestThrottlerOptions(
  env: NodeJS.ProcessEnv = process.env,
): NestThrottlerOptions {
  const general = loadSecurityPlatformConfig(env).platformAbusePolicy.general;
  const overrideLimit = env.API_THROTTLE_LIMIT?.trim();
  const overrideTtl = env.API_THROTTLE_TTL_MS?.trim();

  return {
    ttl: overrideTtl
      ? parseBoundedInteger(overrideTtl, general.windowMs, 1_000, 3_600_000)
      : general.windowMs,
    limit: overrideLimit
      ? parseBoundedInteger(overrideLimit, general.limit, 10, 10_000)
      : general.limit,
  };
}

/**
 * Verify platform security posture without mutating configuration.
 */
export function verifySecurityPlatformConfig(
  env: NodeJS.ProcessEnv = process.env,
): SecurityPlatformVerificationResult {
  const config = loadSecurityPlatformConfig(env);
  const issues = collectSecurityPlatformIssues(config, env);
  return {
    valid: issues.length === 0,
    issues,
  };
}

export function collectSecurityPlatformIssues(
  config: SecurityPlatformConfig,
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const issues = [...verifyConfigurationValidity(env).issues];

  if (config.isProduction && config.allowInsecureMode) {
    issues.push('SECURITY_ALLOW_INSECURE_MODE is forbidden when NODE_ENV=production');
  }

  if (config.isProduction && parseBooleanFlag(env.SECURITY_DISABLE_ERROR_SANITIZATION)) {
    issues.push('SECURITY_DISABLE_ERROR_SANITIZATION is forbidden when NODE_ENV=production');
  }

  if (config.isProduction && config.allowedHosts.length === 0) {
    issues.push('API_ALLOWED_HOSTS must list the public API hosts when NODE_ENV=production');
  }

  issues.push(...collectBrowserSecurityIssues(env));

  return issues;
}

export class SecurityPlatformBootError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Security platform bootstrap refused: ${issues.join('; ')}`);
    this.name = 'SecurityPlatformBootError';
    this.issues = issues;
  }
}

/**
 * Fail closed before the HTTP server accepts traffic when production posture is insecure.
 */
export function assertSecurityPlatformBoot(
  env: NodeJS.ProcessEnv = process.env,
): SecurityPlatformConfig {
  const config = loadSecurityPlatformConfig(env);
  const issues = collectSecurityPlatformIssues(config, env);

  if (issues.length > 0 && config.isProduction) {
    throw new SecurityPlatformBootError(issues);
  }

  return config;
}

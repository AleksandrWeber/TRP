import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FALLBACK_VERSION = '0.1.0';

/**
 * Resolve the running application version.
 * Prefer APP_VERSION, then apps/api package.json, then a stable fallback.
 */
export function resolveApplicationVersion(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): string {
  const fromEnv = env.APP_VERSION?.trim();
  if (fromEnv) return fromEnv;

  try {
    const raw = readFileSync(join(cwd, 'package.json'), 'utf8');
    const version = (JSON.parse(raw) as { version?: unknown }).version;
    if (typeof version === 'string' && version.trim() !== '') {
      return version.trim();
    }
  } catch {
    // package.json may be unavailable in some runtime layouts
  }

  return FALLBACK_VERSION;
}

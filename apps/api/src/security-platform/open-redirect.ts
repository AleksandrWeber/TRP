export type OpenRedirectFailureReason = 'external' | 'protocol_relative' | 'invalid';

export type OpenRedirectValidationResult =
  | Readonly<{ ok: true; target: string }>
  | Readonly<{ ok: false; reason: OpenRedirectFailureReason }>;

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, '');
}

/**
 * Allow relative in-app paths or explicitly allowlisted absolute origins only (V3-S04-b).
 */
export function validateOpenRedirectTarget(
  target: string,
  allowedOrigins: readonly string[],
): OpenRedirectValidationResult {
  const trimmed = target.trim();
  if (!trimmed) {
    return { ok: false, reason: 'invalid' };
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return { ok: true, target: trimmed };
  }

  if (trimmed.startsWith('//')) {
    return { ok: false, reason: 'protocol_relative' };
  }

  try {
    const url = new URL(trimmed);
    const origin = normalizeOrigin(`${url.protocol}//${url.host}`);
    const allowed = allowedOrigins.map(normalizeOrigin);
    if (allowed.includes(origin)) {
      return { ok: true, target: trimmed };
    }
    return { ok: false, reason: 'external' };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}

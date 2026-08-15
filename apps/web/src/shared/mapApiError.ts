/**
 * Maps HTTP API failures to short user-facing messages.
 * Raw backend JSON must never be shown in the UI.
 */

function looksLikeJson(value: string): boolean {
  const trimmed = value.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
}

export function extractBackendMessage(bodyText: string): string | null {
  const trimmed = bodyText.trim();
  if (!trimmed) return null;

  try {
    const body = JSON.parse(trimmed) as {
      message?: string | string[];
      error?: string;
    };
    if (typeof body.message === 'string' && body.message.trim()) return body.message.trim();
    if (Array.isArray(body.message) && body.message.length > 0) {
      return body.message.map(String).join(', ');
    }
    if (typeof body.error === 'string' && body.error.trim()) return body.error.trim();
  } catch {
    // not JSON — fall through
  }

  if (looksLikeJson(trimmed)) return null;
  return trimmed;
}

export function mapHttpError(status: number, bodyText: string): string {
  console.error('[api]', status, bodyText);

  const backend = extractBackendMessage(bodyText);
  const lower = (backend ?? '').toLowerCase();

  if (status === 400) return 'Please check your input.';
  if (status === 401) return 'Unauthorized';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 409) {
    if (lower.includes('idempotency')) {
      return 'This deployment request was already submitted with different details.';
    }
    if (lower.includes('already approved') || lower.includes('immutable')) {
      return 'This deployment is already approved and cannot be changed.';
    }
    if (lower.includes('active_venue_exists')) {
      return 'An active Cluster already exists for this exchange.';
    }
    if (lower.includes('scope_id_exists')) {
      return 'A Cluster with this identity already exists.';
    }
    if (lower.includes('scope_archived')) {
      return 'This Cluster is archived and cannot be changed.';
    }
    if (lower.includes('binding_id_exists')) {
      return 'That account binding already exists.';
    }
    return 'An account with this email already exists.';
  }

  if (status === 422) {
    if (lower.includes('runtime enforcement') || lower.includes('validation')) {
      return 'Runtime Validation failed. The Gate did not PASS. There is no override.';
    }
    if (
      lower.includes('orchestration') ||
      lower.includes('ineligible') ||
      lower.includes('missing_market_state') ||
      lower.includes('handoff')
    ) {
      return 'Orchestration was rejected. Session was not started.';
    }
    if (backend && !looksLikeJson(backend)) return backend;
    return 'This request could not be processed.';
  }

  if (status === 404) {
    if (
      lower.includes('already archived') ||
      (lower.includes('archived') && lower.includes('already'))
    ) {
      return 'Already archived.';
    }
    if (lower.includes('experiment') && lower.includes('not found')) {
      return 'Experiment not found.';
    }
    if (lower.includes('workspace') && lower.includes('not found')) {
      return 'Workspace not found.';
    }
    if (lower.includes('exchange scope') || lower.includes('cluster')) {
      return 'Cluster not found.';
    }
    return 'Requested resource was not found.';
  }

  if (status >= 500) {
    return 'Unexpected server error. Please try again later.';
  }

  if (backend && !looksLikeJson(backend)) {
    return backend;
  }

  return `Request failed (${status}).`;
}

/** Sanitize an Error (or unknown) so UI never renders raw JSON bodies. */
export function toUserFacingError(err: unknown, fallback: string): string {
  if (!(err instanceof Error) || !err.message.trim()) return fallback;
  const message = err.message.trim();
  if (!looksLikeJson(message)) return message;

  console.error('[api] unmapped JSON error', message);
  const backend = extractBackendMessage(message);
  if (backend) {
    const lower = backend.toLowerCase();
    if (lower.includes('experiment') && lower.includes('not found')) return 'Experiment not found.';
    if (lower.includes('already archived')) return 'Already archived.';
  }
  return fallback;
}

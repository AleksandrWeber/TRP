/**
 * Approved OpenRouter connectivity states (W2-S05-a).
 *
 * Connected means only that OpenRouter accepted the vaulted key for a
 * connectivity probe. It does not mean prompts execute, chat works, or an
 * AI Platform exists.
 */

export const OPENROUTER_CONNECTIVITY_STATUSES = [
  'NOT_CONFIGURED',
  'CONFIGURED',
  'CONNECTED',
  'CONNECTION_FAILED',
  'DISABLED',
] as const;

export type OpenRouterConnectivityStatus = (typeof OPENROUTER_CONNECTIVITY_STATUSES)[number];

export function isOpenRouterConnectivityStatus(
  value: string,
): value is OpenRouterConnectivityStatus {
  return (OPENROUTER_CONNECTIVITY_STATUSES as readonly string[]).includes(value);
}

export function assertOpenRouterConnectivityStatus(value: string): OpenRouterConnectivityStatus {
  if (!isOpenRouterConnectivityStatus(value)) {
    throw new Error(`Rejected OpenRouter connectivity state: ${value}`);
  }
  return value;
}

/**
 * Maps Connection Management status + credential presence onto the approved
 * OpenRouter connectivity projection. All other connection statuses collapse
 * into one of the five approved states; unknown values fail closed.
 */
export function projectOpenRouterConnectivityStatus(input: {
  connectionType: string;
  provider: string;
  status: string;
  credentialsStored: boolean;
}): OpenRouterConnectivityStatus | null {
  if (input.connectionType !== 'AI' || input.provider !== 'OPENROUTER') {
    return null;
  }

  switch (input.status) {
    case 'DISABLED':
      return 'DISABLED';
    case 'REVOKED':
      return 'NOT_CONFIGURED';
    case 'CONNECTED':
      return 'CONNECTED';
    case 'VALIDATION_FAILED':
    case 'AUTHENTICATION_FAILED':
    case 'HANDSHAKE_TIMEOUT':
    case 'PROVIDER_UNAVAILABLE':
      return 'CONNECTION_FAILED';
    case 'DISCONNECTED':
    case 'PENDING_VALIDATION':
      return input.credentialsStored ? 'CONFIGURED' : 'NOT_CONFIGURED';
    default:
      return input.credentialsStored ? 'CONFIGURED' : 'NOT_CONFIGURED';
  }
}

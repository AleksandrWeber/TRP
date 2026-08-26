/**
 * Operator-visible OpenRouter connectivity projection (W2-S05-a).
 *
 * Connected means only that a vaulted OpenRouter key passed a connectivity
 * probe. It does not mean prompt execution, chat, conversation history, or
 * AI Platform Complete.
 */

import {
  projectOpenRouterConnectivityStatus,
  type OpenRouterConnectivityStatus,
} from './openrouter-connectivity.status';

export type OpenRouterLastTestOutcome = 'succeeded' | 'failed';

export type OpenRouterLastTestFailureReason =
  'AUTHENTICATION_FAILED' | 'PROVIDER_UNAVAILABLE' | 'TIMEOUT' | 'VALIDATION_FAILED';

export type OpenRouterLastTestResult = Readonly<{
  outcome: OpenRouterLastTestOutcome;
  failureReason: OpenRouterLastTestFailureReason | null;
  vendorVisibleMessage: string;
  testedAt: string;
}>;

export type OpenRouterConnectivityView = Readonly<{
  status: OpenRouterConnectivityStatus;
  lastTestResult: OpenRouterLastTestResult | null;
}>;

export function projectOpenRouterConnectivity(
  connectionType: string,
  provider: string,
  status: string,
  credentialsStored: boolean,
  lastTestResult: OpenRouterLastTestResult | null,
): OpenRouterConnectivityView | null {
  const projected = projectOpenRouterConnectivityStatus({
    connectionType,
    provider,
    status,
    credentialsStored,
  });
  if (projected === null) {
    return null;
  }
  return {
    status: projected,
    lastTestResult,
  };
}

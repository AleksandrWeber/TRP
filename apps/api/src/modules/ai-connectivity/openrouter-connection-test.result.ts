/**
 * OpenRouter connection test outcomes (W2-S05-a).
 *
 * Connected means only that OpenRouter accepted the vaulted API key for a
 * connectivity probe. It does not mean prompts execute or chat works.
 */

export const OPENROUTER_CONNECTION_TEST_OUTCOMES = [
  'CONNECTED',
  'VALIDATION_FAILED',
  'HANDSHAKE_TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'AUTHENTICATION_FAILED',
] as const;

export type OpenRouterConnectionTestOutcome = (typeof OPENROUTER_CONNECTION_TEST_OUTCOMES)[number];

export type OpenRouterConnectionTestResult = Readonly<{
  outcome: OpenRouterConnectionTestOutcome;
  vendorVisibleMessage: string;
}>;

export function vendorVisibleMessageFor(outcome: OpenRouterConnectionTestOutcome): string {
  switch (outcome) {
    case 'CONNECTED':
      return 'OpenRouter accepted the workspace API key.';
    case 'AUTHENTICATION_FAILED':
      return 'OpenRouter rejected the API key.';
    case 'PROVIDER_UNAVAILABLE':
      return 'OpenRouter was unreachable.';
    case 'HANDSHAKE_TIMEOUT':
      return 'OpenRouter connectivity test timed out.';
    case 'VALIDATION_FAILED':
      return 'OpenRouter connectivity test failed.';
  }
}

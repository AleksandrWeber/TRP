/**
 * RC-27 Epic 2 — ExchangeRiskPolicy (immutable versioned policy inputs).
 *
 * Task alias: ExchangePolicyInputs.
 * Consumed by platform Risk Engine — never a Risk Decision processor.
 */

import {
  EXCHANGE_POLICY_INPUT_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  assertPositiveVersion,
  deepFreeze,
} from './exchange-scope-domain-shared';
import { assertNextVersionMonotonic, assertNoVersionOverwrite } from './exchange-scope-version';

export type ExchangeRiskPolicyLimits = Readonly<{
  maxExposureLabel: string;
  maxOrderNotionalLabel: string;
  notes: string;
}>;

export type ExchangeRiskPolicy = Readonly<{
  exchangeRiskPolicyId: string;
  exchangeScopeId: string;
  workspaceId: string;
  policyVersion: number;
  limits: ExchangeRiskPolicyLimits;
  publishedAt: string;
  publishedBy: string;
  authorityClass: typeof EXCHANGE_POLICY_INPUT_AUTHORITY_CLASS;
  isRiskDecision: false;
  approvesRisk: false;
  mutable: false;
}>;

export type CreateExchangeRiskPolicyInput = Readonly<{
  exchangeRiskPolicyId: string;
  exchangeScopeId: string;
  workspaceId: string;
  policyVersion: number;
  limits: Readonly<{
    maxExposureLabel: string;
    maxOrderNotionalLabel: string;
    notes?: string;
  }>;
  publishedAt: string;
  publishedBy: string;
}>;

/**
 * Create an immutable policy-input record.
 * Never decides risk, trips Kill Switch, or submits orders.
 */
export function createExchangeRiskPolicy(input: CreateExchangeRiskPolicyInput): ExchangeRiskPolicy {
  return deepFreeze({
    exchangeRiskPolicyId: assertNonEmptyString(input.exchangeRiskPolicyId, 'exchangeRiskPolicyId'),
    exchangeScopeId: assertNonEmptyString(input.exchangeScopeId, 'exchangeScopeId'),
    workspaceId: assertNonEmptyString(input.workspaceId, 'workspaceId'),
    policyVersion: assertPositiveVersion(input.policyVersion, 'policyVersion'),
    limits: Object.freeze({
      maxExposureLabel: assertNonEmptyString(
        input.limits.maxExposureLabel,
        'limits.maxExposureLabel',
      ),
      maxOrderNotionalLabel: assertNonEmptyString(
        input.limits.maxOrderNotionalLabel,
        'limits.maxOrderNotionalLabel',
      ),
      notes: assertNonEmptyString(input.limits.notes ?? 'policy input only', 'limits.notes'),
    }),
    publishedAt: assertIsoTimestamp(input.publishedAt, 'publishedAt'),
    publishedBy: assertNonEmptyString(input.publishedBy, 'publishedBy'),
    authorityClass: EXCHANGE_POLICY_INPUT_AUTHORITY_CLASS,
    isRiskDecision: false as const,
    approvesRisk: false as const,
    mutable: false as const,
  });
}

/**
 * Publish the next policy version (append-only). Overwrite prohibited.
 */
export function publishNextExchangeRiskPolicy(
  args: Readonly<{
    history: readonly ExchangeRiskPolicy[];
    next: Omit<CreateExchangeRiskPolicyInput, 'policyVersion'> &
      Readonly<{ policyVersion: number }>;
  }>,
): Readonly<{
  next: ExchangeRiskPolicy;
  history: readonly ExchangeRiskPolicy[];
}> {
  const { history, next: nextInput } = args;
  assertNextVersionMonotonic(
    history.map((row) => ({ version: row.policyVersion })),
    nextInput.policyVersion,
  );

  for (const row of history) {
    if (
      row.workspaceId !== nextInput.workspaceId ||
      row.exchangeScopeId !== nextInput.exchangeScopeId
    ) {
      throw new Error('publishNextExchangeRiskPolicy history must share workspace + scope');
    }
  }

  const next = createExchangeRiskPolicy(nextInput);
  return Object.freeze({
    next,
    history: Object.freeze([...history, next]),
  });
}

export { assertNoVersionOverwrite };

/** Product / task alias for ExchangeRiskPolicy. */
export type ExchangePolicyInputs = ExchangeRiskPolicy;
export const createExchangePolicyInputs = createExchangeRiskPolicy;

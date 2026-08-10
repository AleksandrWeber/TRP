/**
 * RC-26 Epic 4 — OrchestrationPlanVersion (immutable version identity).
 *
 * Every orchestration plan publication is a new version. No overwrite.
 */

import {
  TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
  assertIsoTimestamp,
  assertNonEmptyString,
  assertPositiveVersion,
  deepFreeze,
} from './trading-orchestrator-domain-shared';

export type OrchestrationPlanVersion = Readonly<{
  orchestrationPlanId: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
  authorityClass: typeof TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS;
  mutable: false;
}>;

export type CreateOrchestrationPlanVersionInput = Readonly<{
  orchestrationPlanId: string;
  version: number;
  publishedAt: string;
  publishedBy: string;
}>;

/**
 * Create an immutable plan version identity.
 * Corrections require a new version — never mutate this object.
 */
export function createOrchestrationPlanVersion(
  input: CreateOrchestrationPlanVersionInput,
): OrchestrationPlanVersion {
  return deepFreeze({
    orchestrationPlanId: assertNonEmptyString(input.orchestrationPlanId, 'orchestrationPlanId'),
    version: assertPositiveVersion(input.version),
    publishedAt: assertIsoTimestamp(input.publishedAt, 'publishedAt'),
    publishedBy: assertNonEmptyString(input.publishedBy, 'publishedBy'),
    authorityClass: TRADING_ORCHESTRATOR_DOMAIN_AUTHORITY_CLASS,
    mutable: false as const,
  });
}

/**
 * Assert a candidate version does not overwrite an existing version number.
 */
export function assertNoPlanVersionOverwrite(
  history: readonly { readonly version: number }[],
  nextVersion: number,
): void {
  assertPositiveVersion(nextVersion);
  if (history.some((row) => row.version === nextVersion)) {
    throw new Error(
      `OrchestrationPlan version overwrite forbidden: version ${nextVersion} already exists`,
    );
  }
}

/**
 * Assert next version is exactly max(history)+1 (or 1 when empty).
 */
export function assertNextPlanVersionMonotonic(
  history: readonly { readonly version: number }[],
  nextVersion: number,
): void {
  assertNoPlanVersionOverwrite(history, nextVersion);
  const max = history.reduce((acc, row) => Math.max(acc, row.version), 0);
  const expected = max + 1;
  if (nextVersion !== expected) {
    throw new Error(
      `OrchestrationPlan version must be monotonic: expected ${expected}, received ${nextVersion}`,
    );
  }
}

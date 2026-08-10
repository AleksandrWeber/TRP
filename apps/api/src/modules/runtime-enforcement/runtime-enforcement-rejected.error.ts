/**
 * RC-23 Epic 4 — deterministic rejection when Runtime Enforcement returns INVALID.
 *
 * Carries machine-readable reasons from the Gate. Does not invent Library rules.
 */

import type { EnforcementDecision, EnforcementReasonCode } from './ports/runtime-enforcement.port';

export class RuntimeEnforcementRejectedError extends Error {
  readonly name = 'RuntimeEnforcementRejectedError';
  readonly validation = 'INVALID' as const;
  readonly reasons: readonly EnforcementReasonCode[];
  readonly decision: EnforcementDecision;

  constructor(decision: EnforcementDecision) {
    const codes = decision.reasons.join(',');
    super(
      codes
        ? `runtime enforcement rejected deployment: ${codes}`
        : 'runtime enforcement rejected deployment',
    );
    this.reasons = decision.reasons;
    this.decision = decision;
  }
}

export function isRuntimeEnforcementRejectedError(
  error: unknown,
): error is RuntimeEnforcementRejectedError {
  return error instanceof RuntimeEnforcementRejectedError;
}

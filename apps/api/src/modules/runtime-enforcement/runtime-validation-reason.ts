/**
 * PC-04 — presentation labels for the locked RC-23 reason catalog.
 * Does not add reasons. Does not change Gate authority.
 */

import type { EnforcementReasonCode } from './ports/runtime-enforcement.port';

export const RUNTIME_VALIDATION_REASON_LABELS: Readonly<Record<EnforcementReasonCode, string>> =
  Object.freeze({
    strategy_not_found: 'The strategy family was not found in Strategy Library.',
    strategy_version_not_found: 'The strategy version was not found in Strategy Library.',
    identity_ambiguous: 'The request does not identify a unique Strategy Version.',
    certification_missing: 'Certification is missing for this Strategy Version.',
    certification_not_admitted: 'Certification was not admitted.',
    certification_not_active: 'Certification is not active.',
    certification_deprecated: 'Certification is deprecated.',
    certification_archived: 'Certification is archived.',
    eligibility_missing: 'Eligibility is missing for this Strategy Version.',
    eligibility_ineligible: 'This Strategy Version is not eligible.',
    envelope_missing: 'The Library tactical envelope is missing.',
    envelope_not_immutable: 'The Library tactical envelope is not immutable.',
    scope_not_allowed: 'The Exchange Scope is not allowed by the envelope.',
    envelope_violation: 'The tactic point violates the Library tactical envelope.',
    workspace_mismatch: 'The Strategy Version does not belong to this workspace.',
  });

export function runtimeValidationReasonLabel(reason: string): string {
  if (reason in RUNTIME_VALIDATION_REASON_LABELS) {
    return RUNTIME_VALIDATION_REASON_LABELS[reason as EnforcementReasonCode];
  }
  return reason;
}

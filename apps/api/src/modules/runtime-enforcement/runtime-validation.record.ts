/**
 * PC-04 — product-visible record of a Runtime Enforcement Gate invocation.
 *
 * Not a second validation authority. PASS/FAIL remains EnforcementDecision.
 * Not Library SoT. Not Deployment. Not Session.
 */

import type {
  EnforcementDecision,
  EnforcementPurpose,
  EnforcementReasonCode,
} from './ports/runtime-enforcement.port';

export type RuntimeValidationRecord = Readonly<{
  validationId: string;
  workspaceId: string;
  progress: 'complete';
  outcome: EnforcementDecision['outcome'];
  validation: EnforcementDecision['validation'];
  reasons: readonly EnforcementReasonCode[];
  libraryEntryId: string | null;
  strategyFamilyId: string | null;
  strategyVersion: string | null;
  strategyName: string | null;
  purpose: EnforcementPurpose;
  exchangeScopeId: string | null;
  certificationStatus: string | null;
  eligibilityOutcome: EnforcementDecision['eligibilityOutcome'] | null;
  checkedAt: string;
  createdAt: string;
}>;

export type RuntimeValidationHistoryQuery = Readonly<{
  workspaceId: string;
  limit?: number;
}>;

export type RuntimeValidationHistoryPage = Readonly<{
  items: readonly RuntimeValidationRecord[];
}>;

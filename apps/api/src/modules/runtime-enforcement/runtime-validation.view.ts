import type { RuntimeValidationRecord } from './runtime-validation.record';

export type RuntimeValidationView = {
  validationId: string;
  workspaceId: string;
  progress: RuntimeValidationRecord['progress'];
  outcome: RuntimeValidationRecord['outcome'];
  validation: RuntimeValidationRecord['validation'];
  reasons: readonly string[];
  libraryEntryId: string | null;
  strategyFamilyId: string | null;
  strategyVersion: string | null;
  strategyName: string | null;
  purpose: RuntimeValidationRecord['purpose'];
  exchangeScopeId: string | null;
  certificationStatus: string | null;
  eligibilityOutcome: RuntimeValidationRecord['eligibilityOutcome'];
  checkedAt: string;
  createdAt: string;
};

export type RuntimeValidationHistoryView = {
  items: RuntimeValidationView[];
};

export function toRuntimeValidationView(record: RuntimeValidationRecord): RuntimeValidationView {
  return {
    validationId: record.validationId,
    workspaceId: record.workspaceId,
    progress: record.progress,
    outcome: record.outcome,
    validation: record.validation,
    reasons: [...record.reasons],
    libraryEntryId: record.libraryEntryId,
    strategyFamilyId: record.strategyFamilyId,
    strategyVersion: record.strategyVersion,
    strategyName: record.strategyName,
    purpose: record.purpose,
    exchangeScopeId: record.exchangeScopeId,
    certificationStatus: record.certificationStatus,
    eligibilityOutcome: record.eligibilityOutcome,
    checkedAt: record.checkedAt,
    createdAt: record.createdAt,
  };
}

export function toRuntimeValidationHistoryView(
  items: readonly RuntimeValidationRecord[],
): RuntimeValidationHistoryView {
  return {
    items: items.map(toRuntimeValidationView),
  };
}

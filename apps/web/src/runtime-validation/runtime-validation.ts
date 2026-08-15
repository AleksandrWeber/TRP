import type { StrategyLibraryRecordView } from '../shared/api';

export function runtimeValidationOutcomeLabel(outcome: string): string {
  return outcome === 'pass' ? 'PASS' : 'FAIL';
}

export function runtimeValidationReasonLabel(reason: string): string {
  switch (reason) {
    case 'strategy_not_found':
      return 'The strategy family was not found in Strategy Library.';
    case 'strategy_version_not_found':
      return 'The strategy version was not found in Strategy Library.';
    case 'identity_ambiguous':
      return 'The request does not identify a unique Strategy Version.';
    case 'certification_missing':
      return 'Certification is missing for this Strategy Version.';
    case 'certification_not_admitted':
      return 'Certification was not admitted.';
    case 'certification_not_active':
      return 'Certification is not active.';
    case 'certification_deprecated':
      return 'Certification is deprecated.';
    case 'certification_archived':
      return 'Certification is archived.';
    case 'eligibility_missing':
      return 'Eligibility is missing for this Strategy Version.';
    case 'eligibility_ineligible':
      return 'This Strategy Version is not eligible.';
    case 'envelope_missing':
      return 'The Library tactical envelope is missing.';
    case 'envelope_not_immutable':
      return 'The Library tactical envelope is not immutable.';
    case 'scope_not_allowed':
      return 'The Exchange Scope is not allowed by the envelope.';
    case 'envelope_violation':
      return 'The tactic point violates the Library tactical envelope.';
    case 'workspace_mismatch':
      return 'The Strategy Version does not belong to this workspace.';
    default:
      return reason;
  }
}

export function buildRuntimeValidationRequest(
  entry: StrategyLibraryRecordView | null,
  exchangeScopeId: string,
) {
  if (!entry) {
    throw new Error('Select a Strategy Version.');
  }
  const scope = exchangeScopeId.trim();
  return {
    libraryEntryId: entry.version.libraryEntryId,
    strategyFamilyId: entry.strategy.strategyFamilyId,
    strategyVersion: entry.version.version,
    purpose: 'deployment_bind' as const,
    ...(scope ? { exchangeScopeId: scope } : {}),
  };
}

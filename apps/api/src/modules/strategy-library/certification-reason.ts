import type { CertificationReasonCode } from './ports/strategy-library-certification.port';

/**
 * Map domain factory errors onto CertifyResult reason codes (API Contract §5.3).
 * Does not invent certification rules.
 */
export function mapCertificationDomainError(error: unknown): CertificationReasonCode {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('certifiedby is required') || lower.includes('human operator')) {
    return 'certified_by_required';
  }
  if (lower.includes('missing required evidence type: backtesting')) {
    return 'missing_evidence_backtesting';
  }
  if (lower.includes('missing required evidence type: walk-forward')) {
    return 'missing_evidence_walk_forward';
  }
  if (
    lower.includes('requires evidence') ||
    lower.includes('missing required evidence') ||
    lower.includes('unknown certification evidence')
  ) {
    return 'missing_evidence';
  }
  if (
    lower.includes('already has an active certification') ||
    lower.includes('duplicate strategyversion')
  ) {
    return 'version_already_certified';
  }
  if (lower.includes('duplicate libraryentryid')) {
    return 'duplicate_library_entry';
  }
  if (
    lower.includes('envelope') ||
    lower.includes('allowedmarkets') ||
    lower.includes('allowedsymbols') ||
    lower.includes('riskpertrade') ||
    lower.includes('maxpositions')
  ) {
    return 'invalid_envelope';
  }
  if (lower.includes('immutable') || lower.includes('unfrozen')) {
    return 'unfrozen_identity';
  }
  return 'invalid_candidate';
}

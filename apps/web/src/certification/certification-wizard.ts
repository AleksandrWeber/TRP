import type { Strategy } from '../shared/api';

export const CERTIFICATION_WIZARD_STEPS = ['candidate', 'evidence', 'confirm'] as const;

export type CertificationWizardStep = (typeof CERTIFICATION_WIZARD_STEPS)[number];

export const REQUIRED_EVIDENCE_TYPES = ['backtesting', 'walk-forward'] as const;
export const OPTIONAL_EVIDENCE_TYPES = [
  'monte-carlo',
  'paper-trading',
  'statistical-validation',
] as const;

export type EvidenceDraft = {
  type: string;
  sourceId: string;
};

export type CertificationWizardDraft = {
  candidate: Strategy | null;
  version: string;
  notes: string;
  evidence: EvidenceDraft[];
};

export function nextWizardStep(step: CertificationWizardStep): CertificationWizardStep {
  if (step === 'candidate') return 'evidence';
  if (step === 'evidence') return 'confirm';
  return 'confirm';
}

export function previousWizardStep(step: CertificationWizardStep): CertificationWizardStep {
  if (step === 'confirm') return 'evidence';
  if (step === 'evidence') return 'candidate';
  return 'candidate';
}

export function defaultEnvelopeFromCandidate(strategy: Strategy) {
  return {
    envelopeVersion: '1',
    allowedMarkets: ['crypto-spot'],
    allowedExchangeScopeIds: ['binance-spot'],
    allowedSymbols: [strategy.tradingPair],
    allowedTimeframes: [strategy.timeframe],
    riskPerTrade: { min: 0.25, max: 1, step: 0.25 },
    maxPositions: { min: 1, max: 3 },
  };
}

export function researchContentHash(strategyId: string, version: string): string {
  return `research:${strategyId}:${version}`;
}

export function evidenceChecklistComplete(evidence: readonly EvidenceDraft[]): boolean {
  const types = new Set(evidence.filter((item) => item.sourceId.trim()).map((item) => item.type));
  return REQUIRED_EVIDENCE_TYPES.every((type) => types.has(type));
}

export function buildCertifyRequest(draft: CertificationWizardDraft) {
  const candidate = draft.candidate;
  if (!candidate) {
    throw new Error('Select a research candidate.');
  }
  const version = draft.version.trim() || '1.0.0';
  const envelope = defaultEnvelopeFromCandidate(candidate);
  const evidence = draft.evidence
    .filter((item) => item.sourceId.trim())
    .map((item, index) => ({
      evidenceId: `ev-${item.type}-${index + 1}`,
      type: item.type,
      sourceRef: {
        owner: item.type === 'backtesting' ? 'backtesting' : item.type,
        id: item.sourceId.trim(),
      },
    }));

  return {
    family: {
      name: candidate.name,
      description: candidate.description || undefined,
      registryRef: candidate.id,
    },
    version: {
      version,
      contentHash: researchContentHash(candidate.id, version),
      market: 'crypto-spot',
      supportedExchangeScopeIds: envelope.allowedExchangeScopeIds,
      supportedTimeframes: envelope.allowedTimeframes,
      supportedSymbols: envelope.allowedSymbols,
    },
    evidence,
    tacticalEnvelope: envelope,
    notes: draft.notes.trim() || undefined,
  };
}

export function certificationOutcomeLabel(outcome: string): string {
  if (outcome === 'certified') return 'Certified';
  if (outcome === 'conflict') return 'Conflict';
  return 'Rejected';
}

export function certificationReasonLabel(reason: string): string {
  switch (reason) {
    case 'missing_evidence':
      return 'Required evidence is missing.';
    case 'missing_evidence_backtesting':
      return 'Backtesting evidence is required.';
    case 'missing_evidence_walk_forward':
      return 'Walk-forward evidence is required.';
    case 'invalid_envelope':
      return 'The tactical envelope is invalid or incompatible.';
    case 'unfrozen_identity':
      return 'The candidate identity is not frozen.';
    case 'version_already_certified':
      return 'This family version is already certified.';
    case 'duplicate_library_entry':
      return 'A library entry with this identity already exists.';
    case 'certified_by_required':
      return 'A human operator must certify.';
    case 'invalid_candidate':
      return 'The candidate could not be admitted.';
    default:
      return reason;
  }
}

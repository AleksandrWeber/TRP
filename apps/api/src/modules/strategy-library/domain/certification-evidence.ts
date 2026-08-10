/**
 * RC-22 Epic 3 — CertificationEvidence.
 *
 * Immutable references to Research / validation artifacts that justify certification.
 * Evidence bodies remain owned by Research Lab (or Paper path producers).
 * Library stores pointers only — no result-warehouse duplication.
 */

export const CERTIFICATION_EVIDENCE_TYPES = Object.freeze([
  'backtesting',
  'walk-forward',
  'monte-carlo',
  'paper-trading',
  'statistical-validation',
] as const);

export type CertificationEvidenceType = (typeof CERTIFICATION_EVIDENCE_TYPES)[number];

/** Evidence types required to admit a certification (when those Lab gates are active). */
export const REQUIRED_CERTIFICATION_EVIDENCE_TYPES = Object.freeze([
  'backtesting',
  'walk-forward',
] as const satisfies readonly CertificationEvidenceType[]);

export type EvidenceSourceRef = Readonly<{
  /** Owning research / paper surface (not Strategy Library). */
  owner:
    | 'research-lab'
    | 'backtesting'
    | 'walk-forward'
    | 'monte-carlo'
    | 'paper-trading'
    | 'statistical-validation';
  /** Foreign identity in the owning store. */
  id: string;
}>;

export type CertificationEvidence = Readonly<{
  evidenceId: string;
  type: CertificationEvidenceType;
  sourceRef: EvidenceSourceRef;
  /** Optional non-authoritative snapshot snippet — never the SoT body. */
  summary: string | null;
}>;

export type CreateCertificationEvidenceInput = Readonly<{
  evidenceId: string;
  type: CertificationEvidenceType | string;
  sourceRef: Readonly<{ owner: string; id: string }>;
  summary?: string | null;
}>;

export function isCertificationEvidenceType(value: string): value is CertificationEvidenceType {
  return (CERTIFICATION_EVIDENCE_TYPES as readonly string[]).includes(value);
}

export function createCertificationEvidence(
  input: CreateCertificationEvidenceInput,
): CertificationEvidence {
  const evidenceId = input.evidenceId.trim();
  if (!evidenceId) {
    throw new Error('evidenceId is required');
  }
  if (!isCertificationEvidenceType(String(input.type))) {
    throw new Error(`unknown certification evidence type: ${input.type}`);
  }
  const ownerRaw = input.sourceRef.owner.trim();
  if (!ownerRaw) {
    throw new Error('sourceRef.owner is required');
  }
  const allowedOwners = [
    'research-lab',
    'backtesting',
    'walk-forward',
    'monte-carlo',
    'paper-trading',
    'statistical-validation',
  ] as const;
  if (!(allowedOwners as readonly string[]).includes(ownerRaw)) {
    throw new Error(`unknown evidence sourceRef.owner: ${ownerRaw}`);
  }
  const owner = ownerRaw as EvidenceSourceRef['owner'];
  const id = input.sourceRef.id.trim();
  if (!id) {
    throw new Error('sourceRef.id is required');
  }
  const summary =
    input.summary === undefined || input.summary === null || input.summary.trim() === ''
      ? null
      : input.summary.trim();

  return Object.freeze({
    evidenceId,
    type: input.type as CertificationEvidenceType,
    sourceRef: Object.freeze({ owner, id }),
    summary,
  });
}

export function certificationEvidenceIsImmutable(evidence: CertificationEvidence): true {
  if (!Object.isFrozen(evidence) || !Object.isFrozen(evidence.sourceRef)) {
    throw new Error('CertificationEvidence must be immutable');
  }
  return true;
}

/**
 * Ensure required evidence types are present (backtesting + walk-forward).
 * Monte Carlo / paper-trading / statistical-validation remain optional.
 */
export function assertRequiredCertificationEvidence(
  evidence: readonly CertificationEvidence[],
): void {
  if (evidence.length === 0) {
    throw new Error('certification requires evidence references');
  }
  const types = new Set(evidence.map((e) => e.type));
  for (const required of REQUIRED_CERTIFICATION_EVIDENCE_TYPES) {
    if (!types.has(required)) {
      throw new Error(`certification missing required evidence type: ${required}`);
    }
  }
  const seenIds = new Set<string>();
  for (const item of evidence) {
    if (seenIds.has(item.evidenceId)) {
      throw new Error(`duplicate evidenceId ${item.evidenceId}`);
    }
    seenIds.add(item.evidenceId);
  }
}

/**
 * RC-24 Epic 3 — Reporting source references.
 *
 * Reporting references Knowledge Lake (and optional history / Library) facts.
 * It never copies ownership of analytical facts or SoT records.
 *
 * Domain Model Contract §7 sourceRefs[].
 */

export const REPORTING_SOURCE_OWNER_TYPES = Object.freeze([
  'knowledge-lake',
  'trading-history',
  'paper-history',
  'strategy-library',
] as const);

export type ReportingSourceOwnerType = (typeof REPORTING_SOURCE_OWNER_TYPES)[number];

/**
 * Pointer to an external analytical / context fact.
 * Ownership remains with the referenced owner (Lake for analytical facts).
 */
export type ReportingSourceRef = Readonly<{
  ownerType: ReportingSourceOwnerType;
  id: string;
}>;

export type CreateReportingSourceRefInput = Readonly<{
  ownerType: string;
  id: string;
}>;

export function createReportingSourceRef(input: CreateReportingSourceRefInput): ReportingSourceRef {
  const ownerType = input.ownerType.trim();
  if (!(REPORTING_SOURCE_OWNER_TYPES as readonly string[]).includes(ownerType)) {
    throw new Error(`ownerType must be one of: ${REPORTING_SOURCE_OWNER_TYPES.join(', ')}`);
  }
  const id = input.id.trim();
  if (!id) {
    throw new Error('source ref id is required');
  }
  return Object.freeze({
    ownerType: ownerType as ReportingSourceOwnerType,
    id,
  });
}

/** True when the ref cites Knowledge Lake (primary analytical source). */
export function isKnowledgeLakeSourceRef(ref: ReportingSourceRef): boolean {
  return ref.ownerType === 'knowledge-lake';
}

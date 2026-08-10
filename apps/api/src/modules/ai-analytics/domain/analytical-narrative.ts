/**
 * RC-24 Epic 3 — AnalyticalNarrative (AI Analytics owned).
 *
 * Domain Model Contract §8.
 * Structure reservation only — no AI runtime / generation in Epic 3.
 * Authority class: narrative.
 */

export const ANALYTICAL_NARRATIVE_AUTHORITY_CLASS = 'narrative' as const;

export const ANALYTICAL_NARRATIVE_KINDS = Object.freeze([
  'explain',
  'summarize',
  'trends',
  'narrative',
] as const);

export type AnalyticalNarrativeKind = (typeof ANALYTICAL_NARRATIVE_KINDS)[number];

export const ANALYTICAL_NARRATIVE_DEFAULT_DISCLAIMER =
  'Non-authoritative narrative. If this text conflicts with Ledger, Fills, Orders, Session, Library, or Enforcement, Source of Truth wins.' as const;

export type AnalyticalNarrativeSourceRef = Readonly<{
  ownerType: 'knowledge-lake' | 'report-run' | 'aggregation-slice' | 'strategy-library';
  id: string;
}>;

export type AnalyticalNarrative = Readonly<{
  narrativeId: string;
  workspaceId: string;
  reportRunId?: string;
  kind: AnalyticalNarrativeKind;
  text: string;
  sourceRefs: readonly AnalyticalNarrativeSourceRef[];
  modesCovered: readonly string[];
  authorityClass: typeof ANALYTICAL_NARRATIVE_AUTHORITY_CLASS;
  disclaimer: string;
  modelMeta?: Readonly<Record<string, unknown>>;
  createdAt: string;
}>;

export type CreateAnalyticalNarrativeInput = Readonly<{
  narrativeId: string;
  workspaceId: string;
  reportRunId?: string;
  kind: string;
  text: string;
  sourceRefs: readonly Readonly<{ ownerType: string; id: string }>[];
  modesCovered: readonly string[];
  disclaimer?: string;
  modelMeta?: Readonly<Record<string, unknown>>;
  createdAt: string;
}>;

function assertNonEmpty(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Object.isFrozen(value)) {
    return value;
  }
  for (const key of Object.keys(value as object)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return Object.freeze(value);
}

const ALLOWED_OWNER_TYPES = Object.freeze([
  'knowledge-lake',
  'report-run',
  'aggregation-slice',
  'strategy-library',
] as const);

/**
 * Create an immutable AnalyticalNarrative artifact.
 * Does not call AI providers. Does not trade or authorize.
 */
export function createAnalyticalNarrative(
  input: CreateAnalyticalNarrativeInput,
): AnalyticalNarrative {
  const narrativeId = assertNonEmpty(input.narrativeId, 'narrativeId');
  const workspaceId = assertNonEmpty(input.workspaceId, 'workspaceId');
  const text = assertNonEmpty(input.text, 'text');
  const createdAt = assertNonEmpty(input.createdAt, 'createdAt');
  if (Number.isNaN(Date.parse(createdAt))) {
    throw new Error('createdAt must be an ISO timestamp');
  }

  const kindRaw = assertNonEmpty(input.kind, 'kind');
  if (!(ANALYTICAL_NARRATIVE_KINDS as readonly string[]).includes(kindRaw)) {
    throw new Error(`kind must be one of: ${ANALYTICAL_NARRATIVE_KINDS.join(', ')}`);
  }

  if (!input.sourceRefs || input.sourceRefs.length === 0) {
    throw new Error('sourceRefs must be non-empty');
  }

  const sourceRefs = Object.freeze(
    input.sourceRefs.map((ref) => {
      const ownerType = ref.ownerType.trim();
      const id = ref.id.trim();
      if (!(ALLOWED_OWNER_TYPES as readonly string[]).includes(ownerType)) {
        throw new Error(`unsupported narrative source ownerType: ${ownerType}`);
      }
      if (!id) {
        throw new Error('source ref id is required');
      }
      return Object.freeze({
        ownerType: ownerType as AnalyticalNarrativeSourceRef['ownerType'],
        id,
      });
    }),
  );

  const reportRunId =
    input.reportRunId !== undefined && input.reportRunId.trim() !== ''
      ? input.reportRunId.trim()
      : undefined;

  const disclaimer =
    input.disclaimer !== undefined && input.disclaimer.trim() !== ''
      ? input.disclaimer.trim()
      : ANALYTICAL_NARRATIVE_DEFAULT_DISCLAIMER;

  return deepFreeze({
    narrativeId,
    workspaceId,
    ...(reportRunId !== undefined ? { reportRunId } : {}),
    kind: kindRaw as AnalyticalNarrativeKind,
    text,
    sourceRefs,
    modesCovered: Object.freeze([...(input.modesCovered ?? [])]),
    authorityClass: ANALYTICAL_NARRATIVE_AUTHORITY_CLASS,
    disclaimer,
    ...(input.modelMeta !== undefined ? { modelMeta: deepFreeze({ ...input.modelMeta }) } : {}),
    createdAt,
  });
}

/** Reporting never owns narratives — AI Analytics does. */
export function analyticalNarrativeOwnedByReporting(): false {
  return false;
}

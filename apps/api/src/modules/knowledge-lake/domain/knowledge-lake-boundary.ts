/**
 * RC-21 — Knowledge Lake boundary + ownership invariants.
 *
 * Knowledge Lake is an analytical projection warehouse (Spec §5.13).
 * It is NOT Ledger, Orders, Trading Session, Risk Engine, or Execution Engine.
 * It is never a Source of Truth for business state.
 *
 * Ownership chain:
 *   Source of Truth → Projection → Knowledge Lake
 *
 * Existing research domains (`knowledge`, Insight, Recommendation) are NOT the Lake.
 *
 * Epic 1: boundary + invariants.
 * Epic 2: ingestion port (append-only admission) — no persistence product.
 * Epic 3: trading-path producer projections (one-way outbox → Lake).
 * Epic 4: Research Lab producer projections (one-way outcome markers → Lake).
 * Epic 5: query port (consumer-safe analytical reads) — no Reporting / AI UI.
 * Epic 6: authority conformance & RC-21 acceptance (no new ports/features).
 */

/** Authority Matrix class for Knowledge Lake contents. */
export const KNOWLEDGE_LAKE_AUTHORITY_CLASS = 'projection' as const;

/** Canonical module identity (code / docs). Product UI may say “Knowledge Lake”. */
export const KNOWLEDGE_LAKE_MODULE_ID = 'knowledge-lake' as const;

/**
 * Normative ownership stages for analytical facts entering the Lake.
 * Lake is the terminal analytical warehouse — not SoT.
 */
export const KNOWLEDGE_LAKE_OWNERSHIP_CHAIN = Object.freeze([
  'source-of-truth',
  'projection',
  'knowledge-lake',
] as const);

export type KnowledgeLakeOwnershipStage = (typeof KNOWLEDGE_LAKE_OWNERSHIP_CHAIN)[number];

/**
 * Closed event category set for RC-21 (labels only in Epic 1).
 * Categories are not new bounded contexts or SoT modules.
 */
export const KNOWLEDGE_LAKE_EVENT_CATEGORIES = Object.freeze([
  'Market',
  'Trading',
  'Risk',
  'Paper',
  'Research',
  'Reporting',
  'System',
] as const);

export type KnowledgeLakeEventCategory = (typeof KNOWLEDGE_LAKE_EVENT_CATEGORIES)[number];

/**
 * Modules / surfaces that own business state and must NOT be owned by Lake.
 * Kept as frozen documentation for conformance tests.
 */
export const KNOWLEDGE_LAKE_NON_OWNED_SOT = Object.freeze([
  'orders',
  'trading-session',
  'risk-engine',
  'execution-engine',
  'ledger',
  'position',
  'fill',
] as const);

/**
 * Research foundations that remain separate from Knowledge Lake.
 * Do not rebrand these as the Lake warehouse.
 */
export const KNOWLEDGE_LAKE_DISTINCT_FROM = Object.freeze([
  'knowledge',
  'insight',
  'recommendation',
  'research-report',
] as const);

/** Write posture declared for all future Lake admission (Epic 2+). */
export const KNOWLEDGE_LAKE_WRITE_SEMANTICS = 'append-only' as const;

/**
 * Forbidden Lake capabilities (Epic 1 declares; later Epics must not add these).
 */
export const KNOWLEDGE_LAKE_FORBIDDEN_CAPABILITIES = Object.freeze([
  'mutate-orders',
  'mutate-ledger',
  'mutate-positions',
  'mutate-session-lifecycle',
  'approve-risk',
  'submit-execution',
  'update-admitted-fact',
  'delete-admitted-fact',
  'command-sot-feedback',
] as const);

export type KnowledgeLakeForbiddenCapability =
  (typeof KNOWLEDGE_LAKE_FORBIDDEN_CAPABILITIES)[number];

/**
 * Immutable boundary descriptor for the Knowledge Lake projection owner.
 */
export type KnowledgeLakeBoundary = Readonly<{
  moduleId: typeof KNOWLEDGE_LAKE_MODULE_ID;
  authorityClass: typeof KNOWLEDGE_LAKE_AUTHORITY_CLASS;
  ownershipChain: typeof KNOWLEDGE_LAKE_OWNERSHIP_CHAIN;
  writeSemantics: typeof KNOWLEDGE_LAKE_WRITE_SEMANTICS;
  eventCategories: typeof KNOWLEDGE_LAKE_EVENT_CATEGORIES;
  nonOwnedSoT: typeof KNOWLEDGE_LAKE_NON_OWNED_SOT;
  distinctFrom: typeof KNOWLEDGE_LAKE_DISTINCT_FROM;
  forbiddenCapabilities: typeof KNOWLEDGE_LAKE_FORBIDDEN_CAPABILITIES;
  /**
   * Current RC-21 active-port posture.
   * Epic 5: ingestion + producers + query. Persistence product remains off.
   */
  activePorts: Readonly<{
    ingestion: true;
    query: true;
    persistence: true;
    producers: true;
  }>;
}>;

/** Sole RC-21 Knowledge Lake boundary constant. */
export const KNOWLEDGE_LAKE_BOUNDARY: KnowledgeLakeBoundary = Object.freeze({
  moduleId: KNOWLEDGE_LAKE_MODULE_ID,
  authorityClass: KNOWLEDGE_LAKE_AUTHORITY_CLASS,
  ownershipChain: KNOWLEDGE_LAKE_OWNERSHIP_CHAIN,
  writeSemantics: KNOWLEDGE_LAKE_WRITE_SEMANTICS,
  eventCategories: KNOWLEDGE_LAKE_EVENT_CATEGORIES,
  nonOwnedSoT: KNOWLEDGE_LAKE_NON_OWNED_SOT,
  distinctFrom: KNOWLEDGE_LAKE_DISTINCT_FROM,
  forbiddenCapabilities: KNOWLEDGE_LAKE_FORBIDDEN_CAPABILITIES,
  activePorts: Object.freeze({
    ingestion: true,
    query: true,
    persistence: true,
    producers: true,
  }),
});

/** True when a category is in the closed RC-21 set. */
export function isKnowledgeLakeEventCategory(value: string): value is KnowledgeLakeEventCategory {
  return (KNOWLEDGE_LAKE_EVENT_CATEGORIES as readonly string[]).includes(value);
}

/** True when a capability is forbidden for Knowledge Lake. */
export function isKnowledgeLakeForbiddenCapability(
  value: string,
): value is KnowledgeLakeForbiddenCapability {
  return (KNOWLEDGE_LAKE_FORBIDDEN_CAPABILITIES as readonly string[]).includes(value);
}

/**
 * Ownership chain helper: Lake is never the first stage (SoT).
 */
export function knowledgeLakeOwnsBusinessState(): false {
  return false;
}

/**
 * Conflict rule (Authority Matrix): on money/order disputes, SoT wins.
 */
export function resolveAuthorityConflict(
  concern: 'cash' | 'fills' | 'orders' | 'session-lifecycle',
): 'source-of-truth' {
  void concern;
  return 'source-of-truth';
}

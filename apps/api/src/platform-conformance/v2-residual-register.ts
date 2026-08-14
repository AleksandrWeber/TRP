/**
 * RC-28 Epic 6 — residual / deferred register.
 *
 * Records items that remain out of Version 2 paper-first certification.
 * None of these authorize new RC-28 capabilities.
 */

export const V2_RESIDUAL_ITEM_IDS = Object.freeze([
  'ide-shell',
  'rest-transport-product',
  'durable-persistence-product',
  'live-capital',
  'us295-adl-008',
  'additional-venue-adapters',
  'ai-decisioning-as-capital',
] as const);

export type V2ResidualItemId = (typeof V2_RESIDUAL_ITEM_IDS)[number];

export type V2ResidualItem = Readonly<{
  itemId: V2ResidualItemId;
  status: 'deferred' | 'forbidden';
  blocksPaperFirstCertification: false;
  notes: string;
}>;

export const V2_RESIDUAL_REGISTER: readonly V2ResidualItem[] = Object.freeze([
  Object.freeze({
    itemId: 'ide-shell',
    status: 'deferred',
    blocksPaperFirstCertification: false,
    notes: 'RC-21 Plan §0 — IDE + Bot fleet UX is not a V2 certification blocker',
  }),
  Object.freeze({
    itemId: 'rest-transport-product',
    status: 'deferred',
    blocksPaperFirstCertification: false,
    notes: 'Existing application ports remain in-process; no REST expander in RC-28',
  }),
  Object.freeze({
    itemId: 'durable-persistence-product',
    status: 'deferred',
    blocksPaperFirstCertification: false,
    notes: 'Several V2 stores remain process-local; not a new SoT',
  }),
  Object.freeze({
    itemId: 'live-capital',
    status: 'deferred',
    blocksPaperFirstCertification: false,
    notes: 'Paper Freeze ADR-012…018; live capital requires a future ADR',
  }),
  Object.freeze({
    itemId: 'us295-adl-008',
    status: 'deferred',
    blocksPaperFirstCertification: false,
    notes: 'Parallel RC-18 governance residual; not an RC-28 capability',
  }),
  Object.freeze({
    itemId: 'additional-venue-adapters',
    status: 'deferred',
    blocksPaperFirstCertification: false,
    notes: 'Model supports N scopes; extra adapters are shipping cadence, not architecture',
  }),
  Object.freeze({
    itemId: 'ai-decisioning-as-capital',
    status: 'forbidden',
    blocksPaperFirstCertification: false,
    notes: 'AI remains narrative-only; never capital or Gate authority',
  }),
]);

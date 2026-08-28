/**
 * W4-E06-a — Wave 4 Package Roll-Up Inventory & Honest Product Baseline.
 *
 * Governance inventory and classification only.
 * Not runtime implementation. Not persistence changes. Not restart recovery changes.
 * Not operational continuity changes. Not Wave 4 COMPLETE. Not W4-E06 CLOSED.
 *
 * Classification (binding for this slice):
 * - SURVIVE: Close Evidence, foundation artifacts, governance records, and durable
 *   substrates on existing Exchange Adapter / Vault / Connection / Scope owners.
 * - EPHEMERAL: deferred product I/O, stub/runtime-only surfaces, missing vendor
 *   round-trips, and labels that must not be treated as product-complete truth.
 */

export const W4_E06_A_SLICE_ID = 'W4-E06-a' as const;

export const W4_E06_A_COMPLETED_PACKAGE_IDS = Object.freeze([
  'W4-E01',
  'W4-E02',
  'W4-E03',
  'W4-E04',
  'W4-E05',
] as const);

export type W4E06ACompletedPackageId = (typeof W4_E06_A_COMPLETED_PACKAGE_IDS)[number];

export const W4_E06_A_ALLOWED_OWNERS = Object.freeze([
  'exchange-adapter',
  'exchange-connectivity',
  'connection-management',
  'secret-vault',
  'exchange-scope',
  'security-platform',
  'security-audit',
  'authentication',
  'authorization',
  'workspace-isolation',
  'operational-continuity',
  'command-center',
  'release-governance',
  'wave-4-documentation',
  'w4-e01-foundation',
  'w4-e02-foundation',
  'w4-e03-foundation',
  'w4-e04-foundation',
  'w4-e05-foundation',
  'live-trading-deferred',
  'wave-5-deferred',
  'wave-6-deferred',
] as const);

export type W4E06AOwner = (typeof W4_E06_A_ALLOWED_OWNERS)[number];

export const W4_E06_A_SUBSTRATE_OWNERS = Object.freeze([
  'exchange-adapter',
  'exchange-connectivity',
  'connection-management',
  'secret-vault',
  'exchange-scope',
] as const);

export const W4_E06_A_CAPABILITY_CATEGORIES = Object.freeze([
  'implemented',
  'infrastructure',
  'governance',
  'not-yet-implemented',
  'future-roadmap',
] as const);

export type W4E06ACapabilityCategory = (typeof W4_E06_A_CAPABILITY_CATEGORIES)[number];

export const W4_E06_A_DURABILITY_CLASSES = Object.freeze(['SURVIVE', 'EPHEMERAL'] as const);

export type W4E06ADurabilityClass = (typeof W4_E06_A_DURABILITY_CLASSES)[number];

export const W4_E06_A_ARTIFACT_KINDS = Object.freeze([
  'package-governance',
  'wave-capability',
  'honesty-boundary',
  'ownership',
  'explicit-out',
] as const);

export type W4E06AArtifactKind = (typeof W4_E06_A_ARTIFACT_KINDS)[number];

export const W4_E06_A_REQUIRED_ARTIFACT_KINDS = W4_E06_A_ARTIFACT_KINDS;

export const W4_E06_A_FUTURE_RESPONSIBILITIES = Object.freeze([
  'W4-E06-b',
  'W4-E06-c',
  'W4-E06-d',
  'W4-E06-e',
  'honesty-baseline',
  'out-of-scope-w4-e01-reopen',
  'out-of-scope-w4-e02-reopen',
  'out-of-scope-w4-e03-reopen',
  'out-of-scope-w4-e04-reopen',
  'out-of-scope-w4-e05-reopen',
  'out-of-scope-live-trading',
  'out-of-scope-wave4-complete',
  'out-of-scope-exchange-connectivity-complete',
] as const);

export type W4E06AFutureResponsibility = (typeof W4_E06_A_FUTURE_RESPONSIBILITIES)[number];

export type W4E06APackageGovernanceRow = Readonly<{
  packageId: W4E06ACompletedPackageId;
  roadmapId: string;
  packageName: string;
  planningCompleted: boolean;
  planningApproved: boolean;
  slicesCompleted: boolean;
  fivCompleted: boolean;
  poCloseCompleted: boolean;
  documentationSynchronized: boolean;
  honestProductMaintained: boolean;
  ownershipPreserved: boolean;
  architecturalIntegrityPreserved: boolean;
  packageStatus: 'CLOSED';
  foundationDelivered: readonly string[];
  deferredOutcomes: readonly string[];
  closeRecordPath: string;
  fivPath: string;
  packageSummaryPath: string;
}>;

export type W4E06AWaveCapabilityRow = Readonly<{
  capabilityId: string;
  capability: string;
  kind: W4E06AArtifactKind;
  category: W4E06ACapabilityCategory;
  owner: W4E06AOwner;
  durabilityClass: W4E06ADurabilityClass;
  currentStatus: string;
  honestyRequirement: string;
  futureW4E06Responsibility: W4E06AFutureResponsibility;
  evidencePath: string;
  customerVisible: boolean;
  authorizesWave4Complete: boolean;
}>;

/** Frozen governance verification for each CLOSED Wave 4 product package. */
export const W4_E06_A_PACKAGE_GOVERNANCE: readonly W4E06APackageGovernanceRow[] = Object.freeze([
  Object.freeze({
    packageId: 'W4-E01' as const,
    roadmapId: 'V3-E01',
    packageName: 'Binance Real I/O',
    planningCompleted: true,
    planningApproved: true,
    slicesCompleted: true,
    fivCompleted: true,
    poCloseCompleted: true,
    documentationSynchronized: true,
    honestProductMaintained: true,
    ownershipPreserved: true,
    architecturalIntegrityPreserved: true,
    packageStatus: 'CLOSED' as const,
    foundationDelivered: Object.freeze([
      'Inventory & honesty baseline (a)',
      'Durable exchange connectivity persistence (b)',
      'Restart recovery (c)',
      'Operational continuity projection (d)',
      'Close Evidence (e)',
    ]),
    deferredOutcomes: Object.freeze([
      'REST I/O',
      'WebSocket I/O',
      'Live Binance connection',
      'Honest Connected labels from vendor round-trip',
      'Exchange Connectivity Complete',
      'Binance Connected',
    ]),
    closeRecordPath: 'docs/project/version-3/wave-4/w4-e01-product-owner-close-record.md',
    fivPath: 'docs/project/version-3/wave-4/w4-e01-final-integration-verification.md',
    packageSummaryPath: 'docs/project/version-3/wave-4/w4-e01-package-summary.md',
  }),
  Object.freeze({
    packageId: 'W4-E02' as const,
    roadmapId: 'V3-E02',
    packageName: 'Bybit Real I/O',
    planningCompleted: true,
    planningApproved: true,
    slicesCompleted: true,
    fivCompleted: true,
    poCloseCompleted: true,
    documentationSynchronized: true,
    honestProductMaintained: true,
    ownershipPreserved: true,
    architecturalIntegrityPreserved: true,
    packageStatus: 'CLOSED' as const,
    foundationDelivered: Object.freeze([
      'Inventory & honesty baseline (a)',
      'Durable exchange connectivity persistence (b)',
      'Restart recovery (c)',
      'Operational continuity projection (d)',
      'Close Evidence (e)',
    ]),
    deferredOutcomes: Object.freeze([
      'REST I/O',
      'WebSocket I/O',
      'Live Bybit connection',
      'Honest Connected labels from vendor round-trip',
      'Exchange Connectivity Complete',
      'Bybit Connected',
    ]),
    closeRecordPath: 'docs/project/version-3/wave-4/w4-e02-product-owner-close-record.md',
    fivPath: 'docs/project/version-3/wave-4/w4-e02-final-integration-verification.md',
    packageSummaryPath: 'docs/project/version-3/wave-4/w4-e02-package-summary.md',
  }),
  Object.freeze({
    packageId: 'W4-E03' as const,
    roadmapId: 'V3-E03',
    packageName: 'OKX Real I/O',
    planningCompleted: true,
    planningApproved: true,
    slicesCompleted: true,
    fivCompleted: true,
    poCloseCompleted: true,
    documentationSynchronized: true,
    honestProductMaintained: true,
    ownershipPreserved: true,
    architecturalIntegrityPreserved: true,
    packageStatus: 'CLOSED' as const,
    foundationDelivered: Object.freeze([
      'Inventory & honesty baseline (a)',
      'Durable exchange connectivity persistence (b)',
      'Restart recovery (c)',
      'Operational continuity projection (d)',
      'Close Evidence (e)',
    ]),
    deferredOutcomes: Object.freeze([
      'REST I/O',
      'WebSocket I/O',
      'Live OKX connection',
      'Honest Connected labels from vendor round-trip',
      'Exchange Connectivity Complete',
      'OKX Connected',
    ]),
    closeRecordPath: 'docs/project/version-3/wave-4/w4-e03-product-owner-close-record.md',
    fivPath: 'docs/project/version-3/wave-4/w4-e03-final-integration-verification.md',
    packageSummaryPath: 'docs/project/version-3/wave-4/w4-e03-package-summary.md',
  }),
  Object.freeze({
    packageId: 'W4-E04' as const,
    roadmapId: 'V3-E04',
    packageName: 'Kraken Adapter (factory)',
    planningCompleted: true,
    planningApproved: true,
    slicesCompleted: true,
    fivCompleted: true,
    poCloseCompleted: true,
    documentationSynchronized: true,
    honestProductMaintained: true,
    ownershipPreserved: true,
    architecturalIntegrityPreserved: true,
    packageStatus: 'CLOSED' as const,
    foundationDelivered: Object.freeze([
      'Inventory & honesty baseline (a)',
      'Durable exchange connectivity persistence (b)',
      'Restart recovery (c)',
      'Operational continuity projection (d)',
      'Close Evidence (e)',
    ]),
    deferredOutcomes: Object.freeze([
      'Kraken live connection',
      'Kraken REST/WebSocket I/O',
      'Honest Connected labels from vendor round-trip',
      'Exchange Connectivity Complete',
      'Kraken Connected',
    ]),
    closeRecordPath: 'docs/project/version-3/wave-4/w4-e04-product-owner-close-record.md',
    fivPath: 'docs/project/version-3/wave-4/w4-e04-final-integration-verification.md',
    packageSummaryPath: 'docs/project/version-3/wave-4/w4-e04-package-summary.md',
  }),
  Object.freeze({
    packageId: 'W4-E05' as const,
    roadmapId: 'V3-E05',
    packageName: 'Venue Permission Verification',
    planningCompleted: true,
    planningApproved: true,
    slicesCompleted: true,
    fivCompleted: true,
    poCloseCompleted: true,
    documentationSynchronized: true,
    honestProductMaintained: true,
    ownershipPreserved: true,
    architecturalIntegrityPreserved: true,
    packageStatus: 'CLOSED' as const,
    foundationDelivered: Object.freeze([
      'Inventory & honesty baseline (a)',
      'Durable venue permission verification persistence (b)',
      'Restart recovery (c)',
      'Operational continuity projection (d)',
      'Close Evidence (e)',
    ]),
    deferredOutcomes: Object.freeze([
      'Vendor permission probe I/O',
      'Honest Permission verified / Expired / problem labels',
      'Venue Permission Verification Complete (product)',
      'Exchange Connectivity Complete',
    ]),
    closeRecordPath: 'docs/project/version-3/wave-4/w4-e05-product-owner-close-record.md',
    fivPath: 'docs/project/version-3/wave-4/w4-e05-final-integration-verification.md',
    packageSummaryPath: 'docs/project/version-3/wave-4/w4-e05-package-summary.md',
  }),
]);

/**
 * Wave-level capability inventory with Honest Product baseline categories.
 * Customer-visible implemented capabilities: none.
 */
export const W4_E06_A_WAVE_CAPABILITY_INVENTORY: readonly W4E06AWaveCapabilityRow[] = Object.freeze(
  [
    // ── Implemented capabilities (customer-visible: none) ────────────────────
    Object.freeze({
      capabilityId: 'implemented-customer-visible-none',
      capability: 'Customer-visible Wave 4 product functionality',
      kind: 'wave-capability' as const,
      category: 'implemented' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'None — Wave 4 delivered foundation only',
      honestyRequirement: 'Do not fabricate customer-visible exchange I/O from foundation Close',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/wave-4-progress.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),

    // ── Infrastructure capabilities (SURVIVE) ────────────────────────────────
    Object.freeze({
      capabilityId: 'infra-e01-exchange-connectivity-foundation',
      capability: 'W4-E01 Binance exchange connectivity foundation',
      kind: 'wave-capability' as const,
      category: 'infrastructure' as const,
      owner: 'w4-e01-foundation' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'CLOSED — inventory, persistence, recovery, continuity',
      honestyRequirement: 'Foundation ≠ REST/WebSocket I/O product complete',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-product-owner-close-record.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'infra-e02-exchange-connectivity-foundation',
      capability: 'W4-E02 Bybit exchange connectivity foundation',
      kind: 'wave-capability' as const,
      category: 'infrastructure' as const,
      owner: 'w4-e02-foundation' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'CLOSED — inventory, persistence, recovery, continuity',
      honestyRequirement: 'Foundation ≠ REST/WebSocket I/O product complete',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e02-product-owner-close-record.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'infra-e03-exchange-connectivity-foundation',
      capability: 'W4-E03 OKX exchange connectivity foundation',
      kind: 'wave-capability' as const,
      category: 'infrastructure' as const,
      owner: 'w4-e03-foundation' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'CLOSED — inventory, persistence, recovery, continuity',
      honestyRequirement: 'Foundation ≠ REST/WebSocket I/O product complete',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e03-product-owner-close-record.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'infra-e04-kraken-factory-foundation',
      capability: 'W4-E04 Kraken adapter factory foundation',
      kind: 'wave-capability' as const,
      category: 'infrastructure' as const,
      owner: 'w4-e04-foundation' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus:
        'CLOSED — inventory, persistence, recovery, continuity; factory extension only',
      honestyRequirement: 'Factory label ≠ Kraken live connection product',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e04-product-owner-close-record.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'infra-e05-venue-permission-foundation',
      capability: 'W4-E05 venue permission verification foundation',
      kind: 'wave-capability' as const,
      category: 'infrastructure' as const,
      owner: 'w4-e05-foundation' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'CLOSED — inventory, persistence, recovery, continuity',
      honestyRequirement: 'Foundation ≠ vendor permission probe I/O product complete',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e05-product-owner-close-record.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'infra-exchange-adapter-factory',
      capability: 'Exchange Adapter factory — sole venue protocol owner',
      kind: 'wave-capability' as const,
      category: 'infrastructure' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Verified across E01…E05 — factory extension only; no engine clone',
      honestyRequirement: 'Single factory pattern; RC-27 preserved',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/exchange-adapter/exchange-factory.ts',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'infra-platform-readiness-projections',
      capability: 'Platform Readiness — exchangeConnectivity and venuePermissionVerification views',
      kind: 'wave-capability' as const,
      category: 'infrastructure' as const,
      owner: 'operational-continuity' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Exists — derived operational continuity projections from E01…E05',
      honestyRequirement: 'Readiness projection ≠ product I/O complete',
      futureW4E06Responsibility: 'W4-E06-d' as const,
      evidencePath: 'apps/api/src/modules/operational-continuity/operational-readiness.ts',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),

    // ── Governance capabilities (SURVIVE) ────────────────────────────────────
    Object.freeze({
      capabilityId: 'gov-w4-e06-a-rollup-inventory',
      capability: 'W4-E06-a Wave 4 roll-up inventory baseline',
      kind: 'wave-capability' as const,
      category: 'governance' as const,
      owner: 'wave-4-documentation' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'This slice — inventory and honesty baseline only',
      honestyRequirement: 'Inventory ≠ Wave 4 COMPLETE',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-a-wave4-rollup-inventory.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'gov-e01-close-evidence',
      capability: 'W4-E01 Close Evidence chain',
      kind: 'package-governance' as const,
      category: 'governance' as const,
      owner: 'w4-e01-foundation' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'CLOSED — PO Close record + FIV PASS',
      honestyRequirement: 'Package Close ≠ Wave COMPLETE',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-product-owner-close-record.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'gov-e02-close-evidence',
      capability: 'W4-E02 Close Evidence chain',
      kind: 'package-governance' as const,
      category: 'governance' as const,
      owner: 'w4-e02-foundation' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'CLOSED — PO Close record + FIV PASS',
      honestyRequirement: 'Package Close ≠ Wave COMPLETE',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e02-product-owner-close-record.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'gov-e03-close-evidence',
      capability: 'W4-E03 Close Evidence chain',
      kind: 'package-governance' as const,
      category: 'governance' as const,
      owner: 'w4-e03-foundation' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'CLOSED — PO Close record + FIV PASS',
      honestyRequirement: 'Package Close ≠ Wave COMPLETE',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e03-product-owner-close-record.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'gov-e04-close-evidence',
      capability: 'W4-E04 Close Evidence chain',
      kind: 'package-governance' as const,
      category: 'governance' as const,
      owner: 'w4-e04-foundation' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'CLOSED — PO Close record + FIV PASS',
      honestyRequirement: 'Package Close ≠ Wave COMPLETE',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e04-product-owner-close-record.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'gov-e05-close-evidence',
      capability: 'W4-E05 Close Evidence chain',
      kind: 'package-governance' as const,
      category: 'governance' as const,
      owner: 'w4-e05-foundation' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'CLOSED — PO Close record + FIV PASS',
      honestyRequirement: 'Package Close ≠ Wave COMPLETE',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e05-product-owner-close-record.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),

    // ── Not-yet-implemented capabilities (EPHEMERAL) ─────────────────────────
    Object.freeze({
      capabilityId: 'deferred-rest-io-e01-e03',
      capability: 'Per-venue REST I/O — BINANCE, BYBIT, OKX',
      kind: 'wave-capability' as const,
      category: 'not-yet-implemented' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Deferred — E01…E03 Close records explicit',
      honestyRequirement: 'Foundation Close does not deliver REST product I/O',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e01-package-summary.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'deferred-websocket-io-e01-e03',
      capability: 'Per-venue WebSocket I/O — BINANCE, BYBIT, OKX',
      kind: 'wave-capability' as const,
      category: 'not-yet-implemented' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Deferred — E01…E03 Close records explicit',
      honestyRequirement: 'Foundation Close does not deliver WebSocket product I/O',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e02-package-summary.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'deferred-kraken-live-connection',
      capability: 'Kraken live connection and REST/WebSocket I/O',
      kind: 'wave-capability' as const,
      category: 'not-yet-implemented' as const,
      owner: 'w4-e04-foundation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Deferred — E04 Close record explicit; factory label only today',
      honestyRequirement: 'Factory foundation ≠ Kraken Connected',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e04-package-summary.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'deferred-vendor-permission-probe-io',
      capability: 'Vendor permission probe I/O — cross-venue',
      kind: 'wave-capability' as const,
      category: 'not-yet-implemented' as const,
      owner: 'w4-e05-foundation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Deferred — E05 Close record explicit; hardcoded defaults may persist',
      honestyRequirement: 'Hardcoded apiPermissions ≠ vendor-verified',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e05-package-summary.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'deferred-honest-connected-labels',
      capability: 'Honest Connected labels from vendor round-trip',
      kind: 'wave-capability' as const,
      category: 'not-yet-implemented' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Missing — Connected ≠ foundation continuity projection',
      honestyRequirement: 'Connected ≠ Live Trading; foundation ≠ Connected product',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'deferred-honest-permission-labels',
      capability: 'Honest Permission verified / problem labels from vendor probe',
      kind: 'wave-capability' as const,
      category: 'not-yet-implemented' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Missing — E05 foundation only',
      honestyRequirement: 'Permission verified ≠ Live Trading',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e05-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),

    // ── Future roadmap items ─────────────────────────────────────────────────
    Object.freeze({
      capabilityId: 'roadmap-w4-e06-b-exit-criteria',
      capability: 'W4-E06-b — Wave exit criteria evidence foundation',
      kind: 'wave-capability' as const,
      category: 'future-roadmap' as const,
      owner: 'wave-4-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Not opened — deferred slice',
      honestyRequirement: 'Exit criteria map ≠ Wave 4 COMPLETE',
      futureW4E06Responsibility: 'W4-E06-b' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-implementation-package.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'roadmap-w4-e06-c-integration',
      capability: 'W4-E06-c — Cross-package integration verification',
      kind: 'wave-capability' as const,
      category: 'future-roadmap' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Not opened — deferred slice',
      honestyRequirement: 'Verification only — no new runtime integration',
      futureW4E06Responsibility: 'W4-E06-c' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-implementation-package.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'roadmap-w4-e06-d-honest-product',
      capability: 'W4-E06-d — Wave operational continuity & Honest Product review',
      kind: 'wave-capability' as const,
      category: 'future-roadmap' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Not opened — deferred slice',
      honestyRequirement: 'Review ≠ Wave 4 COMPLETE declaration',
      futureW4E06Responsibility: 'W4-E06-d' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-implementation-package.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'roadmap-w4-e06-e-completion-evidence',
      capability: 'W4-E06-e — Wave Completion evidence assembly',
      kind: 'wave-capability' as const,
      category: 'future-roadmap' as const,
      owner: 'wave-4-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Not opened — deferred slice',
      honestyRequirement: 'Completion Review prep ≠ Wave 4 COMPLETE',
      futureW4E06Responsibility: 'W4-E06-e' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-implementation-package.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'roadmap-wave5-notifications',
      capability: 'Wave 5 — Notifications',
      kind: 'wave-capability' as const,
      category: 'future-roadmap' as const,
      owner: 'wave-5-deferred' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Blocked — wave sequencing',
      honestyRequirement: 'Wave 4 foundation does not unlock Wave 5 by itself',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/v3-execution-roadmap.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'roadmap-wave6-live-trading',
      capability: 'Wave 6 — Live Trading (LT-02)',
      kind: 'wave-capability' as const,
      category: 'future-roadmap' as const,
      owner: 'wave-6-deferred' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Blocked — Wave 6 + ADR gate',
      honestyRequirement: 'Connected / foundation ≠ Live Trading',
      futureW4E06Responsibility: 'out-of-scope-live-trading' as const,
      evidencePath: 'docs/project/version-3/v3-execution-roadmap.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),

    // ── Ownership ────────────────────────────────────────────────────────────
    Object.freeze({
      capabilityId: 'own-exchange-adapter-factory',
      capability: 'Exchange Adapter — venue protocol and persistence owner for Wave 4 artifacts',
      kind: 'ownership' as const,
      category: 'infrastructure' as const,
      owner: 'exchange-adapter' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Verified across E01…E05 — sole new-artifact owner',
      honestyRequirement: 'No second exchange connectivity or permission engine',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'own-secret-vault',
      capability: 'Vault — customer credential ciphertext owner',
      kind: 'ownership' as const,
      category: 'infrastructure' as const,
      owner: 'secret-vault' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Verified — retrieve-only; unchanged across wave',
      honestyRequirement: 'Vault owns secrets; adapter retrieves only',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-security-review.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'own-connection-management-facade',
      capability: 'Connection Management — operator connect/visibility facade',
      kind: 'ownership' as const,
      category: 'infrastructure' as const,
      owner: 'connection-management' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Verified — consumes labels; does not own venue I/O',
      honestyRequirement: 'No facade rewrite from roll-up inventory',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'own-exchange-scope-isolation',
      capability: 'Exchange Scope / Cluster — workspace isolation boundary',
      kind: 'ownership' as const,
      category: 'infrastructure' as const,
      owner: 'exchange-scope' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Verified — RC-27 catalog; no cluster identity drift',
      honestyRequirement: 'Scope remains isolation boundary',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-implementation-package.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),

    // ── Honesty boundaries ───────────────────────────────────────────────────
    Object.freeze({
      capabilityId: 'honesty-foundation-not-product-complete',
      capability: 'Foundation delivered ≠ product I/O complete',
      kind: 'honesty-boundary' as const,
      category: 'governance' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Binding across E01…E05 Close records',
      honestyRequirement: 'Never present foundation Close as full exchange I/O completion',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'honesty-package-close-not-wave-complete',
      capability: 'Package CLOSED ≠ Wave 4 COMPLETE',
      kind: 'honesty-boundary' as const,
      category: 'governance' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Binding — E05 Close does not declare Wave COMPLETE',
      honestyRequirement: 'Wave COMPLETE is separate PO governance act',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e05-product-owner-close-record.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'honesty-connected-not-live-trading',
      capability: 'Connected / foundation continuity ≠ Live Trading',
      kind: 'honesty-boundary' as const,
      category: 'governance' as const,
      owner: 'live-trading-deferred' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Binding — Wave 6 + ADR gate unchanged',
      honestyRequirement: 'Paper trading default preserved',
      futureW4E06Responsibility: 'out-of-scope-live-trading' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'honesty-e01-e05-consumed-not-reopened',
      capability: 'W4-E01…E05 CLOSED — consumed not reopened',
      kind: 'honesty-boundary' as const,
      category: 'governance' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Binding — roll-up consumes Close Evidence only',
      honestyRequirement: 'No package redesign from W4-E06-a',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-planning-approval.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'honesty-no-engine-clone-wave4',
      capability: 'No engine clone — factory extension only across Wave 4',
      kind: 'honesty-boundary' as const,
      category: 'governance' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'SURVIVE' as const,
      currentStatus: 'Binding — RC-27; verified in E01…E05 FIV',
      honestyRequirement: 'No second order path or exchange subsystem',
      futureW4E06Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-implementation-package.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),

    // ── Explicit OUT ─────────────────────────────────────────────────────────
    Object.freeze({
      capabilityId: 'out-wave4-complete-from-slice-a',
      capability: 'Wave 4 COMPLETE from roll-up inventory alone',
      kind: 'explicit-out' as const,
      category: 'future-roadmap' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Forbidden — inventory ≠ Wave COMPLETE',
      honestyRequirement: 'Slice a is discovery only',
      futureW4E06Responsibility: 'out-of-scope-wave4-complete' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-validation-plan.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'out-exchange-connectivity-complete',
      capability: 'Exchange Connectivity Complete from roll-up inventory',
      kind: 'explicit-out' as const,
      category: 'future-roadmap' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Forbidden — deferred I/O remains explicit',
      honestyRequirement: 'Separate honest product declaration required',
      futureW4E06Responsibility: 'out-of-scope-exchange-connectivity-complete' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'out-w4-e01-reopen',
      capability: 'W4-E01 reopen / redesign',
      kind: 'explicit-out' as const,
      category: 'governance' as const,
      owner: 'w4-e01-foundation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Forbidden — W4-E01 CLOSED; consume Close Evidence only',
      honestyRequirement: 'Roll-up must not reopen closed packages',
      futureW4E06Responsibility: 'out-of-scope-w4-e01-reopen' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'out-w4-e02-reopen',
      capability: 'W4-E02 reopen / redesign',
      kind: 'explicit-out' as const,
      category: 'governance' as const,
      owner: 'w4-e02-foundation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Forbidden — W4-E02 CLOSED',
      honestyRequirement: 'Roll-up must not reopen closed packages',
      futureW4E06Responsibility: 'out-of-scope-w4-e02-reopen' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'out-w4-e03-reopen',
      capability: 'W4-E03 reopen / redesign',
      kind: 'explicit-out' as const,
      category: 'governance' as const,
      owner: 'w4-e03-foundation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Forbidden — W4-E03 CLOSED',
      honestyRequirement: 'Roll-up must not reopen closed packages',
      futureW4E06Responsibility: 'out-of-scope-w4-e03-reopen' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'out-w4-e04-reopen',
      capability: 'W4-E04 reopen / redesign',
      kind: 'explicit-out' as const,
      category: 'governance' as const,
      owner: 'w4-e04-foundation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Forbidden — W4-E04 CLOSED',
      honestyRequirement: 'Roll-up must not reopen closed packages',
      futureW4E06Responsibility: 'out-of-scope-w4-e04-reopen' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'out-w4-e05-reopen',
      capability: 'W4-E05 reopen / redesign',
      kind: 'explicit-out' as const,
      category: 'governance' as const,
      owner: 'w4-e05-foundation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Forbidden — W4-E05 CLOSED',
      honestyRequirement: 'Roll-up must not reopen closed packages',
      futureW4E06Responsibility: 'out-of-scope-w4-e05-reopen' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
    Object.freeze({
      capabilityId: 'out-live-trading-wave6',
      capability: 'Live Trading / live order submission (Wave 6)',
      kind: 'explicit-out' as const,
      category: 'future-roadmap' as const,
      owner: 'live-trading-deferred' as const,
      durabilityClass: 'EPHEMERAL' as const,
      currentStatus: 'Out of Wave 4 roll-up scope',
      honestyRequirement: 'Foundation ≠ live capital orders',
      futureW4E06Responsibility: 'out-of-scope-live-trading' as const,
      evidencePath: 'docs/project/version-3/wave-4/w4-e06-product-scope.md',
      customerVisible: false,
      authorizesWave4Complete: false,
    }),
  ],
);

export const W4_E06_A_HONEST_PRODUCT_BASELINE = Object.freeze({
  implementedCapabilities: Object.freeze([
    'None — no customer-visible Wave 4 product functionality delivered',
  ] as const),
  infrastructureCapabilities: Object.freeze([
    'W4-E01 Binance exchange connectivity foundation (CLOSED)',
    'W4-E02 Bybit exchange connectivity foundation (CLOSED)',
    'W4-E03 OKX exchange connectivity foundation (CLOSED)',
    'W4-E04 Kraken adapter factory foundation (CLOSED)',
    'W4-E05 venue permission verification foundation (CLOSED)',
    'Exchange Adapter factory — sole venue protocol owner',
    'Platform Readiness exchangeConnectivity and venuePermissionVerification projections',
  ] as const),
  governanceCapabilities: Object.freeze([
    'W4-E06-a Wave 4 roll-up inventory baseline (this slice)',
    'W4-E01…E05 Close Evidence chains indexed',
    'W4-E01…E05 Final Integration Verification PASS records consumed',
  ] as const),
  notYetImplementedCapabilities: Object.freeze([
    'Per-venue REST I/O (BINANCE, BYBIT, OKX)',
    'Per-venue WebSocket I/O (BINANCE, BYBIT, OKX)',
    'Kraken live connection and REST/WebSocket I/O',
    'Vendor permission probe I/O',
    'Honest Connected labels from vendor round-trip',
    'Honest Permission verified / problem labels',
    'Exchange Connectivity Complete',
    'Venue Permission Verification Complete (product)',
  ] as const),
  futureRoadmapItems: Object.freeze([
    'W4-E06-b — Wave exit criteria evidence foundation',
    'W4-E06-c — Cross-package integration verification',
    'W4-E06-d — Wave operational continuity & Honest Product review',
    'W4-E06-e — Wave Completion evidence assembly',
    'Wave 5 — Notifications',
    'Wave 6 — Live Trading (LT-02)',
    'Product Owner Wave 4 COMPLETE decision (separate act)',
  ] as const),
} as const);

export const W4_E06_A_BINDING_FINDINGS = Object.freeze({
  wave4CompleteAuthorized: false,
  exchangeConnectivityCompleteAuthorized: false,
  customerVisibleFeatureFromSliceA: false,
  honestProductBaselineAccurate: true,
  allPackagesClosed: true,
  allPackagesGovernanceVerified: true,
  ownershipBoundariesVerified: true,
  ownershipBoundariesChanged: false,
  architecturalDeviations: false,
  w4E01ConsumedNotRedesigned: true,
  w4E02ConsumedNotRedesigned: true,
  w4E03ConsumedNotRedesigned: true,
  w4E04ConsumedNotRedesigned: true,
  w4E05ConsumedNotRedesigned: true,
  engineeringCanDeclareWave4Complete: false,
} as const);

export const W4_E06_A_EXPLICIT_OUT = Object.freeze([
  'wave4-complete',
  'exchange-connectivity-complete',
  'live-trading-enablement',
  'production-ready',
  'w4-e01-reopen',
  'w4-e02-reopen',
  'w4-e03-reopen',
  'w4-e04-reopen',
  'w4-e05-reopen',
  'w4-e06-b',
  'w4-e06-c',
  'w4-e06-d',
  'w4-e06-e',
  'master-plan-revision',
  'version-2-redesign',
  'ownership-change',
  'new-persistence-owner',
  'new-bounded-context',
  'engine-clone',
] as const);

export const W4_E06_A_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  duplicateExchangeSubsystem: false,
  duplicatePermissionSubsystem: false,
  engineClonePerVenue: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  w4E01Reopened: false,
  w4E02Reopened: false,
  w4E03Reopened: false,
  w4E04Reopened: false,
  w4E05Reopened: false,
  wave1Modified: false,
  wave2Modified: false,
  wave3Modified: false,
  wave4CompleteClaimed: false,
  exchangeConnectivityCompleteClaimed: false,
  liveTradingClaimed: false,
  customerVisibleFeature: false,
} as const);

export const W4_E06_A_TECHNICAL_DEBT_DELTA = Object.freeze({
  resolved: Object.freeze(['Wave 4 Roll-Up Inventory Foundation'] as const),
  introduced: Object.freeze([] as const),
  deferred: Object.freeze([
    'W4-E06-b — Wave exit criteria evidence foundation',
    'W4-E06-c — Cross-package integration verification foundation',
    'W4-E06-d — Wave operational continuity & Honest Product review',
    'W4-E06-e — Wave Completion evidence assembly',
  ] as const),
} as const);

export function packageIds(): readonly W4E06ACompletedPackageId[] {
  return W4_E06_A_PACKAGE_GOVERNANCE.map((row) => row.packageId);
}

export function capabilityIds(): readonly string[] {
  return W4_E06_A_WAVE_CAPABILITY_INVENTORY.map((row) => row.capabilityId);
}

export function rowsByKind(kind: W4E06AArtifactKind): readonly W4E06AWaveCapabilityRow[] {
  return W4_E06_A_WAVE_CAPABILITY_INVENTORY.filter((row) => row.kind === kind);
}

export function rowsByCategory(
  category: W4E06ACapabilityCategory,
): readonly W4E06AWaveCapabilityRow[] {
  return W4_E06_A_WAVE_CAPABILITY_INVENTORY.filter((row) => row.category === category);
}

export function rowsSurvive(): readonly W4E06AWaveCapabilityRow[] {
  return W4_E06_A_WAVE_CAPABILITY_INVENTORY.filter((row) => row.durabilityClass === 'SURVIVE');
}

export function rowsEphemeral(): readonly W4E06AWaveCapabilityRow[] {
  return W4_E06_A_WAVE_CAPABILITY_INVENTORY.filter((row) => row.durabilityClass === 'EPHEMERAL');
}

export function rowsExplicitOut(): readonly W4E06AWaveCapabilityRow[] {
  return W4_E06_A_WAVE_CAPABILITY_INVENTORY.filter((row) => row.kind === 'explicit-out');
}

export function rowsHonestyBoundaries(): readonly W4E06AWaveCapabilityRow[] {
  return W4_E06_A_WAVE_CAPABILITY_INVENTORY.filter((row) => row.kind === 'honesty-boundary');
}

export function verifyAllPackagesGovernance(): Readonly<{
  ok: boolean;
  packagesVerified: number;
  failures: readonly string[];
}> {
  const failures: string[] = [];
  for (const pkg of W4_E06_A_PACKAGE_GOVERNANCE) {
    if (pkg.packageStatus !== 'CLOSED') failures.push(`${pkg.packageId}: not CLOSED`);
    if (!pkg.planningCompleted) failures.push(`${pkg.packageId}: planning not completed`);
    if (!pkg.planningApproved) failures.push(`${pkg.packageId}: planning not approved`);
    if (!pkg.slicesCompleted) failures.push(`${pkg.packageId}: slices not completed`);
    if (!pkg.fivCompleted) failures.push(`${pkg.packageId}: FIV not completed`);
    if (!pkg.poCloseCompleted) failures.push(`${pkg.packageId}: PO Close not completed`);
    if (!pkg.documentationSynchronized)
      failures.push(`${pkg.packageId}: documentation not synchronized`);
    if (!pkg.honestProductMaintained)
      failures.push(`${pkg.packageId}: honest product not maintained`);
    if (!pkg.ownershipPreserved) failures.push(`${pkg.packageId}: ownership not preserved`);
    if (!pkg.architecturalIntegrityPreserved)
      failures.push(`${pkg.packageId}: architectural integrity not preserved`);
  }
  return Object.freeze({
    ok: failures.length === 0,
    packagesVerified: W4_E06_A_PACKAGE_GOVERNANCE.length,
    failures: Object.freeze(failures),
  });
}

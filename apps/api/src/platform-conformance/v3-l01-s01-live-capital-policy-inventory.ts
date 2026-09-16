/**
 * PROPOSED-V3-L01-S01 — Inventory & Honesty Baseline (Live capital workspace policy).
 *
 * Discovery and classification only.
 * Not workspace live-policy persistence. Not enablement API. Not Gate admission wiring.
 * Not Session live-mode productization. Not Kill Switch live wiring. Not live adapter.
 * Not credentials. Not live-capital activation. Not FIV. Not production release.
 *
 * Classification (binding for this slice):
 * - SURVIVE: artifact persists across API restart today or is the durable
 *   substrate on existing Workspace / Session / Gate / KS / Auth / Vault owners.
 * - EPHEMERAL: artifact is transient, stub, UI-only, process-local, missing, or
 *   documentation — must not be treated as live-trading or live-policy truth.
 *
 * Slice ID remains PROPOSED-V3-L01-S01 until a separate canonicalization act.
 */

import { V2_READINESS } from './v2-certification-checklist';
import { V2_COMPATIBILITY_MATRIX } from './v2-compatibility-matrix';

export const V3_L01_S01_SLICE_ID = 'PROPOSED-V3-L01-S01' as const;

export const V3_L01_S01_ALLOWED_OWNERS = Object.freeze([
  'workspace',
  'trading-session',
  'runtime-enforcement',
  'live-trading-engine',
  'authentication',
  'authorization',
  'secret-vault',
  'execution-adapter',
  'execution-engine',
  'platform-conformance',
  'release-governance',
  'wave-6-documentation',
  'command-center',
  'paper-trading-foundation',
] as const);

export type V3L01S01Owner = (typeof V3_L01_S01_ALLOWED_OWNERS)[number];

/** Existing L01 substrate owners — no new owner. */
export const V3_L01_S01_SUBSTRATE_OWNERS = Object.freeze([
  'workspace',
  'trading-session',
  'runtime-enforcement',
  'authentication',
  'authorization',
  'secret-vault',
] as const);

export const V3_L01_S01_ARTIFACT_KINDS = Object.freeze([
  'state',
  'runtime',
  'operational',
  'operator-visible',
  'persistence-candidate',
  'ephemeral-artifact',
  'dependency',
  'ownership',
  'honesty-boundary',
  'explicit-out',
] as const);

export type V3L01S01ArtifactKind = (typeof V3_L01_S01_ARTIFACT_KINDS)[number];

export const V3_L01_S01_REQUIRED_ARTIFACT_KINDS = V3_L01_S01_ARTIFACT_KINDS;

/** Required L01 surface classes from S01 planning (F-01). */
export const V3_L01_S01_REQUIRED_SURFACE_CLASSES = Object.freeze([
  'workspace-live-policy-absence',
  'session-execution-mode',
  'runtime-enforcement-gate',
  'kill-switch-foundation',
  'auth-live-command',
  'paper-freeze-rejects',
  'v2-conformance-anchors',
] as const);

export type V3L01S01SurfaceClass = (typeof V3_L01_S01_REQUIRED_SURFACE_CLASSES)[number];

export const V3_L01_S01_CAPABILITY_CATEGORIES = Object.freeze([
  'implemented-today',
  'infrastructure-only',
  'planned',
  'not-implemented',
  'future-roadmap',
] as const);

export type V3L01S01CapabilityCategory = (typeof V3_L01_S01_CAPABILITY_CATEGORIES)[number];

export const V3_L01_S01_DURABILITY_CLASSES = Object.freeze(['SURVIVE', 'EPHEMERAL'] as const);

export type V3L01S01DurabilityClass = (typeof V3_L01_S01_DURABILITY_CLASSES)[number];

export const V3_L01_S01_DEPENDENCY_DIRECTIONS = Object.freeze([
  'consumes',
  'depends-on',
  'blocked-by',
  'observed-by',
] as const);

export type V3L01S01DependencyDirection = (typeof V3_L01_S01_DEPENDENCY_DIRECTIONS)[number];

export const V3_L01_S01_FUTURE_RESPONSIBILITIES = Object.freeze([
  'PROPOSED-V3-L01-S02',
  'PROPOSED-V3-L01-S03',
  'PROPOSED-V3-L01-S04',
  'honesty-baseline',
  'out-of-scope-s02',
  'out-of-scope-s03',
  'out-of-scope-s04',
  'out-of-scope-l02',
  'out-of-scope-l03',
  'out-of-scope-l04',
  'out-of-scope-l05',
  'out-of-scope-credentials',
  'out-of-scope-live-activation',
  'out-of-scope-fiv',
  'out-of-scope-production',
  'cite-w3-o04-ks',
] as const);

export type V3L01S01FutureResponsibility = (typeof V3_L01_S01_FUTURE_RESPONSIBILITIES)[number];

export type V3L01S01InventoryRow = Readonly<{
  artifactId: string;
  artifact: string;
  kind: V3L01S01ArtifactKind;
  owner: V3L01S01Owner;
  durabilityClass: V3L01S01DurabilityClass;
  capabilityCategory: V3L01S01CapabilityCategory;
  surfaceClass?: V3L01S01SurfaceClass;
  dependencyDirection?: V3L01S01DependencyDirection;
  currentStatus: string;
  honestyRequirement: string;
  futureV3L01Responsibility: V3L01S01FutureResponsibility;
  evidencePath: string;
  existsToday: boolean;
  authorizesLiveTradingAvailable: boolean;
  authorizesLiveCapitalComplete: boolean;
  authorizesWorkspaceLiveEnabled: boolean;
}>;

/**
 * Frozen inventory of V3-L01 touchpoints for workspace live-policy foundations.
 * Describes CURRENT repository truth — does not grant live capability.
 */
export const V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY: readonly V3L01S01InventoryRow[] =
  Object.freeze([
    // ── Ownership ──────────────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'own-workspace-live-policy',
      artifact: 'Workspace — intended owner for per-workspace live-policy persistence (S02)',
      kind: 'ownership' as const,
      owner: 'workspace' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      surfaceClass: 'workspace-live-policy-absence' as const,
      currentStatus:
        'Verified existing owner — WorkspaceRecord has no live-policy field today; S02 persists on this owner',
      honestyRequirement:
        'Do not invent a second tenant aggregate; inventory of absence ≠ policy enabled',
      futureV3L01Responsibility: 'PROPOSED-V3-L01-S02' as const,
      evidencePath: 'apps/api/src/modules/workspace/workspace.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'own-trading-session-execution-mode',
      artifact: 'Trading Session — ExecutionMode substrate (PAPER | LIVE enum exists)',
      kind: 'ownership' as const,
      owner: 'trading-session' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      surfaceClass: 'session-execution-mode' as const,
      currentStatus:
        'Implemented enum surface — LIVE value exists in domain; live-mode productization is S04',
      honestyRequirement:
        'ExecutionMode.LIVE enum presence ≠ live session authorized or live trading available',
      futureV3L01Responsibility: 'PROPOSED-V3-L01-S04' as const,
      evidencePath: 'apps/api/src/modules/trading-session/domain/trading-session-aggregate.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'own-runtime-enforcement-gate',
      artifact: 'Runtime Enforcement Gate — deployment_bind | session_start purposes',
      kind: 'ownership' as const,
      owner: 'runtime-enforcement' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      surfaceClass: 'runtime-enforcement-gate' as const,
      currentStatus:
        'Implemented Gate foundation — live admission attributes remain OPEN; not wired for live policy',
      honestyRequirement:
        'Gate existence ≠ live admission; inventory must not invent live attrs (S04 / OPEN)',
      futureV3L01Responsibility: 'PROPOSED-V3-L01-S04' as const,
      evidencePath: 'apps/api/src/modules/runtime-enforcement/ports/runtime-enforcement.port.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'own-kill-switch-foundation',
      artifact: 'Kill Switch foundation — cite W3-O04; trading-session + live-trading-engine',
      kind: 'ownership' as const,
      owner: 'trading-session' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      surfaceClass: 'kill-switch-foundation' as const,
      currentStatus:
        'W3-O04 foundation exists — S01 cites only; live KS wiring / runbook remain S04 / later',
      honestyRequirement:
        'KS foundation ≠ live-capital enablement; do not reopen W3-O04 from V3-L01-S01',
      futureV3L01Responsibility: 'cite-w3-o04-ks' as const,
      evidencePath: 'apps/api/src/platform-conformance/w3-o04-a-kill-switch-inventory.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'own-auth-live-command',
      artifact: 'Authorization — PermissionClass.LiveCommand (C7) denied for all roles today',
      kind: 'ownership' as const,
      owner: 'authorization' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      surfaceClass: 'auth-live-command' as const,
      currentStatus: 'Implemented deny-all LiveCommand matrix — fail-closed for live commands',
      honestyRequirement:
        'LiveCommand class existence ≠ live enablement authorized; Admin enablement is S03',
      futureV3L01Responsibility: 'PROPOSED-V3-L01-S03' as const,
      evidencePath: 'apps/api/src/modules/auth/permission-catalog.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'own-secret-vault-boundary',
      artifact: 'Secret Vault — sole credential boundary (no live-capital provisioning in S01)',
      kind: 'ownership' as const,
      owner: 'secret-vault' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Implemented vault substrate — S01 must not provision or mutate live secrets',
      honestyRequirement: 'Vault existence ≠ production live credentials configured',
      futureV3L01Responsibility: 'out-of-scope-credentials' as const,
      evidencePath: 'apps/api/src/modules/secret-vault/holdable-secret-type.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'own-honest-product-boundaries',
      artifact: 'Honest Product boundaries — V3-L01 inventory ≠ activation invariants',
      kind: 'ownership' as const,
      owner: 'wave-6-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — frozen in S01 planning / approval; inventory catalogues only',
      honestyRequirement:
        'Capability inventory ≠ activation; connectivity ≠ authorization; enablement ≠ execution',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),

    // ── State / absence ────────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'state-workspace-live-policy-absent',
      artifact: 'WorkspaceRecord — no live-policy / live-enabled column today',
      kind: 'state' as const,
      owner: 'workspace' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      surfaceClass: 'workspace-live-policy-absence' as const,
      currentStatus:
        'Absent — WorkspaceRecord fields are id/name/ownerUserId/status/timestamps only',
      honestyRequirement:
        'Policy absent today is the authoritative finding; S02 must not assume undocumented fields',
      futureV3L01Responsibility: 'PROPOSED-V3-L01-S02' as const,
      evidencePath: 'apps/api/prisma/schema.prisma',
      existsToday: false,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'state-session-execution-mode-enum',
      artifact: 'ExecutionMode.PAPER | ExecutionMode.LIVE domain enum',
      kind: 'state' as const,
      owner: 'trading-session' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      surfaceClass: 'session-execution-mode' as const,
      currentStatus: 'Implemented domain enum — LIVE token exists; paper remains product default',
      honestyRequirement: 'LIVE enum ≠ live trading available; paper remains default product mode',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/trading-session/domain/trading-session-aggregate.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'state-v2-live-capital-authorized-false',
      artifact: 'V2_READINESS.liveCapitalAuthorized === false',
      kind: 'state' as const,
      owner: 'platform-conformance' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'implemented-today' as const,
      surfaceClass: 'v2-conformance-anchors' as const,
      currentStatus: 'Binding conformance flag — live capital not authorized',
      honestyRequirement: 'S01 must not flip liveCapitalAuthorized; inventory cites only',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/platform-conformance/v2-certification-checklist.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'state-v2-paper-freeze-true',
      artifact: 'V2_COMPATIBILITY_MATRIX rows — paperFreeze === true',
      kind: 'state' as const,
      owner: 'platform-conformance' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'implemented-today' as const,
      surfaceClass: 'v2-conformance-anchors' as const,
      currentStatus: 'Binding Paper Freeze posture on compatibility matrix rows',
      honestyRequirement: 'S01 must not weaken paperFreeze; Paper remains default',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/platform-conformance/v2-compatibility-matrix.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),

    // ── Runtime ────────────────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'runtime-enforcement-gate-service',
      artifact: 'RuntimeEnforcementGateService — fail-closed validation gate',
      kind: 'runtime' as const,
      owner: 'runtime-enforcement' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      surfaceClass: 'runtime-enforcement-gate' as const,
      currentStatus: 'Implemented — Gate service exists; no V3-L01 live-policy admission attrs',
      honestyRequirement: 'Gate must not be bypassed; S01 does not modify Gate admission',
      futureV3L01Responsibility: 'PROPOSED-V3-L01-S04' as const,
      evidencePath: 'apps/api/src/modules/runtime-enforcement/runtime-enforcement-gate.service.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'runtime-enforcement-purposes',
      artifact: 'EnforcementPurpose = deployment_bind | session_start',
      kind: 'runtime' as const,
      owner: 'runtime-enforcement' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      surfaceClass: 'runtime-enforcement-gate' as const,
      currentStatus: 'Implemented purposes — live-policy attribute set remains OPEN',
      honestyRequirement: 'Purpose enum ≠ live admission complete; do not invent attrs in S01',
      futureV3L01Responsibility: 'PROPOSED-V3-L01-S04' as const,
      evidencePath: 'apps/api/src/modules/runtime-enforcement/ports/runtime-enforcement.port.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'runtime-paper-execution-adapter',
      artifact: 'Paper Execution Adapter — paper-only execution boundary',
      kind: 'runtime' as const,
      owner: 'execution-adapter' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'implemented-today' as const,
      surfaceClass: 'paper-freeze-rejects' as const,
      currentStatus: 'Implemented paper-only adapter — not a live venue adapter',
      honestyRequirement: 'Paper adapter ≠ live order I/O; live adapter is L02 / explicit-out',
      futureV3L01Responsibility: 'out-of-scope-l02' as const,
      evidencePath: 'apps/api/src/modules/execution-adapter/paper-execution.adapter.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'runtime-execution-engine-paper-only',
      artifact: 'Execution Engine — rejects non-paper intent (paper-only runtime)',
      kind: 'runtime' as const,
      owner: 'execution-engine' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'implemented-today' as const,
      surfaceClass: 'paper-freeze-rejects' as const,
      currentStatus: 'Implemented paper-only reject path — live capital path not opened',
      honestyRequirement: 'Paper-only rejects must remain; S01 must not open live execution',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/execution-engine/execution-engine.service.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'runtime-kill-switch-persistence',
      artifact: 'Kill Switch persistence service (paper workspace KS foundation)',
      kind: 'runtime' as const,
      owner: 'trading-session' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      surfaceClass: 'kill-switch-foundation' as const,
      currentStatus: 'Implemented W3-O04 substrate — cited; not live-capital wiring',
      honestyRequirement: 'KS persistence ≠ live trading enabled; live KS wiring is S04 / later',
      futureV3L01Responsibility: 'cite-w3-o04-ks' as const,
      evidencePath:
        'apps/api/src/modules/trading-session/kill-switch/kill-switch-persistence.service.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),

    // ── Persistence candidates (absent / deferred) ─────────────────────────
    Object.freeze({
      artifactId: 'persist-workspace-live-policy-missing',
      artifact: 'Workspace live-policy persistence schema (planned S02)',
      kind: 'persistence-candidate' as const,
      owner: 'workspace' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      surfaceClass: 'workspace-live-policy-absence' as const,
      currentStatus: 'Missing — no Prisma live-policy field/migration in S01',
      honestyRequirement: 'S01 forbids schema; S02 owns persistence shape (OPEN mechanics)',
      futureV3L01Responsibility: 'out-of-scope-s02' as const,
      evidencePath: 'apps/api/prisma/schema.prisma',
      existsToday: false,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),

    // ── Operator-visible ───────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'ui-live-trading-page-unrouted',
      artifact: 'LiveTradingPage — exists but not paper-product live activation UI (L04)',
      kind: 'operator-visible' as const,
      owner: 'command-center' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Page artifact exists — live operator UI productization is L04 / out of S01',
      honestyRequirement: 'Unrouted/legacy live UI ≠ live trading available from V3-L01-S01',
      futureV3L01Responsibility: 'out-of-scope-l04' as const,
      evidencePath: 'apps/web/src/pages/LiveTradingPage.tsx',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),

    // ── Operational / governance ───────────────────────────────────────────
    Object.freeze({
      artifactId: 'op-adr-020-accepted',
      artifact: 'ADR-020 Live Capital — Accepted (governance; not activation)',
      kind: 'operational' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Accepted ADR — wave-level policy; live activation separately gated',
      honestyRequirement: 'ADR Accepted ≠ live-capital activation ≠ S01 product enablement',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/adr/ADR-020-live-capital.md',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'op-s01-slice-approval',
      artifact: 'V3-L01-S01 Slice Approval — inventory-class implementation authorized',
      kind: 'operational' as const,
      owner: 'wave-6-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'planned' as const,
      currentStatus: 'GRANTED — S01 inventory only; S02–S04 not authorized',
      honestyRequirement: 'S01 Approval ≠ live trading available; ≠ package Complete',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),

    // ── Dependencies ───────────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'dep-consumes-authentication',
      artifact: 'Authentication — signed-in operator context for future enablement (S03)',
      kind: 'dependency' as const,
      owner: 'authentication' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      surfaceClass: 'auth-live-command' as const,
      dependencyDirection: 'consumes' as const,
      currentStatus: 'Consumed foundation — fail closed when missing',
      honestyRequirement: 'Reuse Wave 1 Authentication; no parallel auth in S01',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/modules/auth/permission-catalog.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'dep-blocked-by-live-policy-absent',
      artifact: 'Workspace live-policy absent — blocks enablement / admission products',
      kind: 'dependency' as const,
      owner: 'workspace' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      surfaceClass: 'workspace-live-policy-absence' as const,
      dependencyDirection: 'blocked-by' as const,
      currentStatus: 'Active gap — no persisted workspace live opt-in today',
      honestyRequirement: 'Absence is honest; S02 must default existing workspaces to Paper',
      futureV3L01Responsibility: 'PROPOSED-V3-L01-S02' as const,
      evidencePath: 'apps/api/prisma/schema.prisma',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'dep-depends-on-w3-o04-ks-inventory',
      artifact: 'W3-O04-a Kill Switch inventory — cite-only dependency',
      kind: 'dependency' as const,
      owner: 'platform-conformance' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'infrastructure-only' as const,
      surfaceClass: 'kill-switch-foundation' as const,
      dependencyDirection: 'depends-on' as const,
      currentStatus: 'Reference — KS honesty vocabulary already frozen; S01 does not reopen',
      honestyRequirement: 'Cite W3-O04; do not duplicate or redesign Kill Switch product',
      futureV3L01Responsibility: 'cite-w3-o04-ks' as const,
      evidencePath: 'apps/api/src/platform-conformance/w3-o04-a-kill-switch-inventory.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'dep-observed-by-v2-readiness',
      artifact: 'V2 certification readiness — liveCapitalAuthorized observed false',
      kind: 'dependency' as const,
      owner: 'platform-conformance' as const,
      durabilityClass: 'SURVIVE' as const,
      capabilityCategory: 'implemented-today' as const,
      surfaceClass: 'v2-conformance-anchors' as const,
      dependencyDirection: 'observed-by' as const,
      currentStatus: 'Observed — V2_READINESS.liveCapitalAuthorized remains false',
      honestyRequirement: 'Inventory must observe and preserve; must not authorize live capital',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/platform-conformance/v2-certification-checklist.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),

    // ── Ephemeral / missing enablement surfaces ────────────────────────────
    Object.freeze({
      artifactId: 'eph-enablement-api-absent',
      artifact: 'Admin workspace live enable/disable API (planned S03)',
      kind: 'ephemeral-artifact' as const,
      owner: 'workspace' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      currentStatus: 'Missing — no enablement REST/API in S01',
      honestyRequirement: 'API absence is correct for S01; inventing API is S03 scope',
      futureV3L01Responsibility: 'out-of-scope-s03' as const,
      evidencePath: 'apps/api/src/modules/workspace/workspace.controller.ts',
      existsToday: false,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'eph-live-admission-attrs-absent',
      artifact: 'Runtime Enforcement Gate live admission attributes (planned S04 / OPEN)',
      kind: 'ephemeral-artifact' as const,
      owner: 'runtime-enforcement' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'not-implemented' as const,
      surfaceClass: 'runtime-enforcement-gate' as const,
      currentStatus: 'Missing — live admission attribute set not productized',
      honestyRequirement: 'Do not invent Gate live attrs in S01; fail-closed interim is S04',
      futureV3L01Responsibility: 'out-of-scope-s04' as const,
      evidencePath: 'apps/api/src/modules/runtime-enforcement/ports/runtime-enforcement.port.ts',
      existsToday: false,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),

    // ── Honesty boundaries ─────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'honesty-inventory-not-activation',
      artifact: 'Capability inventory ≠ capability activation',
      kind: 'honesty-boundary' as const,
      owner: 'wave-6-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — frozen in S01 approval',
      honestyRequirement: 'Enumerating surfaces must not be read as enabling live capital',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'honesty-connectivity-not-authorization',
      artifact: 'Connectivity ≠ authorization',
      kind: 'honesty-boundary' as const,
      owner: 'wave-6-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — Wave 4/5 connectivity does not authorize live trading',
      honestyRequirement: 'Exchange/notification connectivity must not imply live capital auth',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'honesty-enablement-not-execution',
      artifact: 'Enablement ≠ execution',
      kind: 'honesty-boundary' as const,
      owner: 'wave-6-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — future workspace enablement still ≠ venue orders',
      honestyRequirement: 'Even after S03 enablement, execution remains separately gated (L02+)',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'honesty-paper-remains-default',
      artifact: 'Paper remains the default product mode',
      kind: 'honesty-boundary' as const,
      owner: 'wave-6-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — Paper Freeze / paper default preserved',
      honestyRequirement: 'S01 must not claim workspace live mode enabled or live available',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'apps/api/src/platform-conformance/v2-compatibility-matrix.ts',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'honesty-live-trading-not-available',
      artifact: 'Live trading is NOT available from S01',
      kind: 'honesty-boundary' as const,
      owner: 'wave-6-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — no live orders, credentials, or activation from this slice',
      honestyRequirement: 'Must not claim live orders submittable or production credentials exist',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'honesty-s01-not-package-complete',
      artifact: 'S01 ≠ V3-L01 Complete; ≠ Wave 6 Complete; ≠ production ready',
      kind: 'honesty-boundary' as const,
      owner: 'wave-6-documentation' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'infrastructure-only' as const,
      currentStatus: 'Binding — inventory foundation only',
      honestyRequirement: 'No Final Close / FIV PASS / production ready claims from S01',
      futureV3L01Responsibility: 'honesty-baseline' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: true,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),

    // ── Explicit OUT ───────────────────────────────────────────────────────
    Object.freeze({
      artifactId: 'out-s02-workspace-persistence',
      artifact: 'PROPOSED-V3-L01-S02 — Workspace live-policy persistence & paper defaulting',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'planned' as const,
      currentStatus: 'Out of S01 — not authorized for implementation by S01 Approval',
      honestyRequirement: 'S01 freezes inventory contract only; does not design S02 schema',
      futureV3L01Responsibility: 'out-of-scope-s02' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: false,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'out-s03-enablement-api',
      artifact: 'PROPOSED-V3-L01-S03 — Admin enable/disable + audit',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'planned' as const,
      currentStatus: 'Out of S01 — enablement API/audit not implemented',
      honestyRequirement: 'No enablement API in S01',
      futureV3L01Responsibility: 'out-of-scope-s03' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: false,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'out-s04-gate-ks-session',
      artifact: 'PROPOSED-V3-L01-S04 — Gate · Kill Switch · Session admission wiring',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'planned' as const,
      currentStatus: 'Out of S01 — no live admission wiring',
      honestyRequirement: 'S01 must not modify Gate/KS/Session for live admission',
      futureV3L01Responsibility: 'out-of-scope-s04' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: false,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'out-l02-live-order-io',
      artifact: 'L02 — Live order I/O / live adapter',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'future-roadmap' as const,
      currentStatus: 'Out of V3-L01-S01 — no venue order path',
      honestyRequirement: 'Inventory ≠ live adapter; no real exchange I/O',
      futureV3L01Responsibility: 'out-of-scope-l02' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: false,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'out-l03-financial-action-log',
      artifact: 'L03 — Tamper-evident financial action log',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'future-roadmap' as const,
      currentStatus: 'Out of S01',
      honestyRequirement: 'No financial action log in S01',
      futureV3L01Responsibility: 'out-of-scope-l03' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: false,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'out-l04-live-operator-ui',
      artifact: 'L04 — Live operator UI',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'future-roadmap' as const,
      currentStatus: 'Out of S01 — live UI not authorized',
      honestyRequirement: 'No live UI productization from S01',
      futureV3L01Responsibility: 'out-of-scope-l04' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: false,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'out-l05-replay-protection',
      artifact: 'L05 — Replay protection',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'future-roadmap' as const,
      currentStatus: 'Out of S01',
      honestyRequirement: 'No replay protection mechanism in S01',
      futureV3L01Responsibility: 'out-of-scope-l05' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: false,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
    Object.freeze({
      artifactId: 'out-credentials-live-activation-fiv',
      artifact: 'Credentials · live-capital activation · real orders · FIV · production release',
      kind: 'explicit-out' as const,
      owner: 'release-governance' as const,
      durabilityClass: 'EPHEMERAL' as const,
      capabilityCategory: 'future-roadmap' as const,
      currentStatus: 'Forbidden from S01 — separately gated',
      honestyRequirement: 'Inventory must not provision secrets or claim activation/FIV/production',
      futureV3L01Responsibility: 'out-of-scope-live-activation' as const,
      evidencePath: 'docs/project/version-3/wave-6/v3-l01-s01-approval.md',
      existsToday: false,
      authorizesLiveTradingAvailable: false,
      authorizesLiveCapitalComplete: false,
      authorizesWorkspaceLiveEnabled: false,
    }),
  ]);

export const V3_L01_S01_BINDING_FINDINGS = Object.freeze({
  liveTradingAvailable: false,
  liveCapitalAuthorized: V2_READINESS.liveCapitalAuthorized,
  paperFreezePreserved: V2_COMPATIBILITY_MATRIX.every((row) => row.paperFreeze === true),
  workspaceLivePolicyExistsToday: false,
  workspaceLiveEnabled: false,
  enablementApiExists: false,
  liveAdmissionWiringExists: false,
  liveAdapterIntroduced: false,
  schemaIntroduced: false,
  credentialsProvisioned: false,
  customerVisibleLiveFeatureFromS01: false,
  s01AuthorizesLiveComplete: false,
  inventoryEqualsActivation: false,
  connectivityEqualsAuthorization: false,
  enablementEqualsExecution: false,
} as const);

export const V3_L01_S01_EXPLICIT_OUT = Object.freeze([
  'workspace-live-policy-persistence',
  'workspace-live-policy-schema',
  'enablement-api',
  'enablement-audit',
  'runtime-enforcement-live-admission-wiring',
  'session-live-mode-productization',
  'kill-switch-live-wiring',
  'live-adapter',
  'live-order-io',
  'l03-financial-action-log',
  'l04-live-operator-ui',
  'l05-replay-protection',
  'credentials',
  'live-capital-activation',
  'real-capital-orders',
  'production-release',
  'fiv',
  's02',
  's03',
  's04',
] as const);

export const V3_L01_S01_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newSchema: false,
  newApi: false,
  newLiveAdapter: false,
  gateBypassed: false,
  killSwitchBypassed: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  s02Implemented: false,
  s03Implemented: false,
  s04Implemented: false,
  l02Implemented: false,
  l03Implemented: false,
  l04Implemented: false,
  l05Implemented: false,
  liveTradingClaimed: false,
  liveCapitalCompleteClaimed: false,
  workspaceLiveEnabledClaimed: false,
  productionReadyClaimed: false,
  fivPassClaimed: false,
  customerVisibleFeature: false,
} as const);

export const V3_L01_S01_HONEST_PRODUCT_BASELINE = Object.freeze({
  paperIsDefault: true,
  inventoryNotActivation: true,
  connectivityNotAuthorization: true,
  enablementNotExecution: true,
  liveTradingAvailable: false,
  liveOrdersSubmittable: false,
  productionCredentialsConfigured: false,
  liveActivationOccurred: false,
  workspaceLiveEnabled: false,
  implementedCapabilities: Object.freeze([
    'None — no customer-visible live-trading or workspace live-policy enablement from S01',
  ] as const),
  infrastructureCapabilities: Object.freeze([
    'Workspace module owner (no live-policy field)',
    'Trading Session ExecutionMode enum (PAPER | LIVE)',
    'Runtime Enforcement Gate purposes deployment_bind | session_start',
    'Kill Switch foundation (W3-O04 cite)',
    'PermissionClass.LiveCommand deny-all matrix',
    'Paper-only execution adapter / engine rejects',
    'V2 liveCapitalAuthorized=false and paperFreeze=true anchors',
  ] as const),
  plannedCapabilities: Object.freeze([
    'PROPOSED-V3-L01-S02 — Workspace live-policy persistence & paper defaulting',
    'PROPOSED-V3-L01-S03 — Admin enable/disable + audit',
    'PROPOSED-V3-L01-S04 — Gate · Kill Switch · Session admission wiring',
  ] as const),
  notYetImplementedCapabilities: Object.freeze([
    'Workspace live-policy schema/field',
    'Enablement API',
    'Live admission attributes',
    'Live adapter / venue order I/O',
    'Live operator UI productization',
    'Live-capital activation',
  ] as const),
  futureRoadmapCapabilities: Object.freeze([
    'L02 — Live order I/O',
    'L03 — Financial action log',
    'L04 — Live operator UI',
    'L05 — Replay protection',
    'FIV / production release (separately gated)',
  ] as const),
} as const);

export function artifactIds(): readonly string[] {
  return V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY.map((row) => row.artifactId);
}

export function rowsByKind(kind: V3L01S01ArtifactKind): readonly V3L01S01InventoryRow[] {
  return V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY.filter((row) => row.kind === kind);
}

export function rowsSurvive(): readonly V3L01S01InventoryRow[] {
  return V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY.filter(
    (row) => row.durabilityClass === 'SURVIVE',
  );
}

export function rowsEphemeral(): readonly V3L01S01InventoryRow[] {
  return V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY.filter(
    (row) => row.durabilityClass === 'EPHEMERAL',
  );
}

export function rowsHonestyBoundaries(): readonly V3L01S01InventoryRow[] {
  return V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY.filter((row) => row.kind === 'honesty-boundary');
}

export function rowsExplicitOut(): readonly V3L01S01InventoryRow[] {
  return V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY.filter((row) => row.kind === 'explicit-out');
}

export function rowsBySurfaceClass(
  surfaceClass: V3L01S01SurfaceClass,
): readonly V3L01S01InventoryRow[] {
  return V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY.filter(
    (row) => row.surfaceClass === surfaceClass,
  );
}

export function coveredSurfaceClasses(): readonly V3L01S01SurfaceClass[] {
  const present = new Set(
    V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY.map((row) => row.surfaceClass).filter(
      (value): value is V3L01S01SurfaceClass => value !== undefined,
    ),
  );
  return V3_L01_S01_REQUIRED_SURFACE_CLASSES.filter((surface) => present.has(surface));
}

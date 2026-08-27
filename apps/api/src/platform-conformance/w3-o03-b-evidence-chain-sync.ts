/**
 * W3-O03-b — Evidence-chain Synchronization for US295 / ADL-008 inputs.
 *
 * Synchronizes every required evidence artifact into one authoritative
 * evidence chain so later Product Owner disposition (W3-O03-c) can rely on
 * one complete evidence graph.
 *
 * Not ADL-008 disposition. Not Production Restart Safe. Not BC / HA / DR.
 * Not Wave 3 COMPLETE. Engineering still cannot ACCEPT ADL-008.
 *
 * Internal diagnostics only — no REST, no operator UI, no Administration page.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  W3_O03_A_ALLOWED_OWNERS,
  W3_O03_A_RECOVERY_RESIDUAL_INVENTORY,
  type W3O03AOwner,
} from './w3-o03-a-recovery-residual-inventory';

export const W3_O03_B_SLICE_ID = 'W3-O03-b' as const;

const REPO_ROOT = join(__dirname, '../../../..');

/** Reuse W3-O03-a owner set — no new owners. */
export const W3_O03_B_ALLOWED_OWNERS = W3_O03_A_ALLOWED_OWNERS;

export type W3O03BOwner = W3O03AOwner;

export const W3_O03_B_EVIDENCE_STATUSES = Object.freeze([
  'PRESENT',
  'MISSING',
  'DEFERRED',
  'OPEN',
  'CLOSED',
] as const);

export type W3O03BEvidenceStatus = (typeof W3_O03_B_EVIDENCE_STATUSES)[number];

export type W3O03BEvidenceRow = Readonly<{
  id: string;
  owner: W3O03BOwner;
  evidencePath: string;
  status: W3O03BEvidenceStatus;
  required: boolean;
  /** Declared existence expectation (inventory honesty). Disk checked at sync. */
  exists: boolean;
  /**
   * Usable as a disposition-path input when present on disk and attributable.
   * DEFERRED/OPEN governance placeholders remain usable as *inputs* when the
   * artifact file exists — they do not authorize ACCEPTED.
   */
  usable: boolean;
  dependencies: readonly string[];
  inventorySurfaceId: string | null;
  sourceKind: W3O03BSourceKind;
}>;

export const W3_O03_B_SOURCE_KINDS = Object.freeze([
  'us290',
  'us291',
  'us292',
  'us293',
  'us294-story',
  'us294-evidence-package',
  'us294-evidence-suite',
  'riv',
  'sig',
  'td036-r6',
  'adl-placeholder',
  'w3-o03-a-inventory',
] as const);

export type W3O03BSourceKind = (typeof W3_O03_B_SOURCE_KINDS)[number];

/**
 * Authoritative US295 evidence-chain registry.
 * Every mandatory source listed in the W3-O03-b planning package appears once.
 */
export const W3_O03_B_EVIDENCE_REGISTRY: readonly W3O03BEvidenceRow[] = Object.freeze([
  Object.freeze({
    id: 'w3-o03-a-inventory',
    owner: 'wave-3-documentation' as const,
    evidencePath: 'apps/api/src/platform-conformance/w3-o03-a-recovery-residual-inventory.ts',
    status: 'CLOSED' as const,
    required: true,
    exists: true,
    usable: true,
    dependencies: Object.freeze([] as const),
    inventorySurfaceId: null,
    sourceKind: 'w3-o03-a-inventory' as const,
  }),
  Object.freeze({
    id: 'us290',
    owner: 'trading-session' as const,
    evidencePath: 'docs/project/stories/us290-force-confirm-recovering-on-discovery.md',
    status: 'CLOSED' as const,
    required: true,
    exists: true,
    usable: true,
    dependencies: Object.freeze(['w3-o03-a-inventory'] as const),
    inventorySurfaceId: 'us290-force-confirm-recovering',
    sourceKind: 'us290' as const,
  }),
  Object.freeze({
    id: 'us291',
    owner: 'runtime-recovery' as const,
    evidencePath: 'docs/project/stories/us291-real-recovery-reconciliation-port-adapters.md',
    status: 'CLOSED' as const,
    required: true,
    exists: true,
    usable: true,
    dependencies: Object.freeze(['us290'] as const),
    inventorySurfaceId: 'us291-reconcile-port-adapters',
    sourceKind: 'us291' as const,
  }),
  Object.freeze({
    id: 'us292',
    owner: 'trading-session' as const,
    evidencePath: 'docs/project/stories/us292-durable-recovery-state-phase-machine.md',
    status: 'CLOSED' as const,
    required: true,
    exists: true,
    usable: true,
    dependencies: Object.freeze(['us290', 'us291'] as const),
    inventorySurfaceId: 'us292-durable-recovery-state',
    sourceKind: 'us292' as const,
  }),
  Object.freeze({
    id: 'us293',
    owner: 'runtime-recovery' as const,
    evidencePath: 'docs/project/stories/us293-durable-incident-on-recovery-ambiguity.md',
    status: 'CLOSED' as const,
    required: true,
    exists: true,
    usable: true,
    dependencies: Object.freeze(['us292'] as const),
    inventorySurfaceId: 'us293-durable-incident',
    sourceKind: 'us293' as const,
  }),
  Object.freeze({
    id: 'us294',
    owner: 'runtime-recovery' as const,
    evidencePath: 'docs/project/stories/us294-chaos-restart-evidence.md',
    status: 'CLOSED' as const,
    required: true,
    exists: true,
    usable: true,
    dependencies: Object.freeze(['us290', 'us291', 'us292', 'us293'] as const),
    inventorySurfaceId: null,
    sourceKind: 'us294-story' as const,
  }),
  Object.freeze({
    id: 'us294-evidence-package',
    owner: 'runtime-recovery' as const,
    evidencePath: 'docs/project/rc-18-us294-chaos-restart-evidence.md',
    status: 'CLOSED' as const,
    required: true,
    exists: true,
    usable: true,
    dependencies: Object.freeze(['us294'] as const),
    inventorySurfaceId: 'us294-chaos-restart-evidence-package',
    sourceKind: 'us294-evidence-package' as const,
  }),
  Object.freeze({
    id: 'us294-evidence-suite',
    owner: 'runtime-recovery' as const,
    evidencePath:
      'apps/api/src/modules/trading-session/recovery/us294-chaos-restart.evidence.spec.ts',
    status: 'CLOSED' as const,
    required: true,
    exists: true,
    usable: true,
    dependencies: Object.freeze(['us294-evidence-package'] as const),
    inventorySurfaceId: 'us294-chaos-restart-evidence-suite',
    sourceKind: 'us294-evidence-suite' as const,
  }),
  Object.freeze({
    id: 'riv',
    owner: 'release-governance' as const,
    evidencePath: 'docs/project/rc-18-riv-001-recovery-integration-validation.md',
    status: 'CLOSED' as const,
    required: true,
    exists: true,
    usable: true,
    dependencies: Object.freeze(['us290', 'us291', 'us292', 'us293'] as const),
    inventorySurfaceId: 'riv-001-recovery-integration',
    sourceKind: 'riv' as const,
  }),
  Object.freeze({
    id: 'sig',
    owner: 'release-governance' as const,
    evidencePath: 'docs/project/rc-18-sig-001-safety-integration-validation.md',
    status: 'CLOSED' as const,
    required: true,
    exists: true,
    usable: true,
    dependencies: Object.freeze(['riv', 'us293'] as const),
    inventorySurfaceId: 'sig-001-safety-integration',
    sourceKind: 'sig' as const,
  }),
  Object.freeze({
    id: 'td036-r6',
    owner: 'release-governance' as const,
    evidencePath: 'docs/project/rc-18-residual-register.md',
    status: 'OPEN' as const,
    required: true,
    exists: true,
    usable: true,
    dependencies: Object.freeze([
      'us294-evidence-package',
      'us294-evidence-suite',
      'riv',
      'sig',
    ] as const),
    inventorySurfaceId: 'td036-r6-residual-register',
    sourceKind: 'td036-r6' as const,
  }),
  Object.freeze({
    id: 'adl-placeholder',
    owner: 'architecture-decision-log' as const,
    evidencePath: 'docs/Architecture/ADR/ADL.md',
    status: 'DEFERRED' as const,
    required: true,
    exists: true,
    usable: true,
    dependencies: Object.freeze(['td036-r6'] as const),
    inventorySurfaceId: 'adl-008-decision-log-entry',
    sourceKind: 'adl-placeholder' as const,
  }),
]);

export const W3_O03_B_MANDATORY_SOURCE_IDS = Object.freeze([
  'us290',
  'us291',
  'us292',
  'us293',
  'us294',
  'us294-evidence-package',
  'us294-evidence-suite',
  'riv',
  'sig',
  'td036-r6',
  'adl-placeholder',
  'w3-o03-a-inventory',
] as const);

export type W3O03BSyncFindingKind =
  | 'missing'
  | 'duplicate'
  | 'orphan'
  | 'broken-dependency'
  | 'unknown-owner'
  | 'wrong-ownership'
  | 'wrong-status'
  | 'dependency-cycle'
  | 'missing-parent'
  | 'missing-required-predecessor';

export type W3O03BSyncFinding = Readonly<{
  kind: W3O03BSyncFindingKind;
  evidenceId: string;
  detail: string;
}>;

export type W3O03BSyncResult = Readonly<{
  ok: boolean;
  findings: readonly W3O03BSyncFinding[];
  missingRequiredIds: readonly string[];
  duplicateIds: readonly string[];
  orphanIds: readonly string[];
  cycleIds: readonly string[];
  missingEvidenceDetected: boolean;
  engineeringMayAcceptAdl008: false;
  futureAcceptedImpossibleWhileMissing: boolean;
  synchronized: boolean;
}>;

export type W3O03BDependencyGraph = Readonly<{
  nodes: readonly string[];
  edges: readonly Readonly<{ from: string; to: string }>[];
  hasCycle: boolean;
  cyclePath: readonly string[];
  missingParents: readonly string[];
  missingRequiredPredecessors: readonly string[];
}>;

export const W3_O03_B_BINDING_FINDINGS = Object.freeze({
  evidenceChainSynchronized: true,
  evidenceAttributionDeterministic: true,
  evidenceCompletenessValidated: true,
  missingEvidenceReportedHonestly: true,
  engineeringMayAcceptAdl008: false,
  adl008Accepted: false,
  productionRestartSafeClaimed: false,
  productOwnerDispositionStillRequired: true,
  businessContinuity: false,
  highAvailability: false,
  disasterRecovery: false,
  liveTrading: false,
  wave3Complete: false,
  customerVisibleFunctionality: false,
} as const);

export const W3_O03_B_EXPLICIT_OUT = Object.freeze([
  'adl-008-accepted',
  'adl-008-explicit-limitation',
  'production-restart-safe-pass',
  'us295-disposition',
  'us290-us294-redesign',
  'recovery-implementation',
  'business-continuity',
  'high-availability',
  'disaster-recovery',
  'monitoring',
  'kill-switch',
  'retry',
  'live-trading',
  'operator-ui',
  'rest-endpoint',
  'administration-page',
  'new-persistence',
  'new-bounded-context',
  'new-owner',
  'second-source-of-truth',
  'w3-o01-modification',
  'w3-o02-modification',
  'version-2-modification',
  'master-plan-modification',
  'w3-o03-c',
] as const);

export const W3_O03_B_ARCHITECTURE_CLAIMS = Object.freeze({
  newPersistenceOwner: false,
  newBoundedContext: false,
  newSourceOfTruth: false,
  newEventStore: false,
  newKnowledgeLake: false,
  newProjectionStore: false,
  newLedger: false,
  newOutbox: false,
  newInbox: false,
  newRecoveryDomain: false,
  ownershipBoundariesChanged: false,
  masterPlanModified: false,
  version2Redesigned: false,
  wave1Modified: false,
  wave2Modified: false,
  w3O01Redesigned: false,
  w3O02Redesigned: false,
  us290ToUs294Redesigned: false,
  adl008Accepted: false,
  productionRestartSafeClaimed: false,
  customerVisibleStanceFeature: false,
  businessContinuityClaimed: false,
  highAvailabilityClaimed: false,
  disasterRecoveryClaimed: false,
  killSwitchCompleteClaimed: false,
  monitoringCompleteClaimed: false,
  liveTradingClaimed: false,
  wave3CompleteClaimed: false,
  restEndpointIntroduced: false,
  operatorUiIntroduced: false,
  evidenceRegistryIntroduced: true,
  evidenceChainSynchronized: true,
} as const);

export const W3_O03_B_REQUIRED_REPORTS = Object.freeze([
  'w3-o03-b-implementation-report.md',
  'w3-o03-b-architecture-review.md',
  'w3-o03-b-security-review.md',
  'w3-o03-b-product-review.md',
  'w3-o03-b-validation-report.md',
] as const);

function byId(registry: readonly W3O03BEvidenceRow[]): ReadonlyMap<string, W3O03BEvidenceRow> {
  return new Map(registry.map((row) => [row.id, row]));
}

function detectDuplicateIds(registry: readonly W3O03BEvidenceRow[]): readonly string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of registry) {
    if (seen.has(row.id)) {
      duplicates.add(row.id);
    }
    seen.add(row.id);
  }
  return Object.freeze([...duplicates].sort());
}

function detectCycles(registry: readonly W3O03BEvidenceRow[]): readonly string[] {
  const graph = byId(registry);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycleNodes = new Set<string>();

  function dfs(id: string, stack: string[]): void {
    if (visiting.has(id)) {
      const start = stack.indexOf(id);
      for (const node of stack.slice(start >= 0 ? start : 0)) {
        cycleNodes.add(node);
      }
      cycleNodes.add(id);
      return;
    }
    if (visited.has(id)) {
      return;
    }
    visiting.add(id);
    const row = graph.get(id);
    if (row) {
      for (const dep of row.dependencies) {
        dfs(dep, [...stack, id]);
      }
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const row of registry) {
    dfs(row.id, []);
  }
  return Object.freeze([...cycleNodes].sort());
}

/**
 * Build the directed dependency graph (edge: dependent → dependency / parent).
 */
export function buildEvidenceDependencyGraph(
  registry: readonly W3O03BEvidenceRow[] = W3_O03_B_EVIDENCE_REGISTRY,
): W3O03BDependencyGraph {
  const ids = new Set(registry.map((row) => row.id));
  const edges: { from: string; to: string }[] = [];
  const missingParents = new Set<string>();
  const missingRequiredPredecessors = new Set<string>();

  for (const row of registry) {
    for (const dep of row.dependencies) {
      edges.push({ from: row.id, to: dep });
      if (!ids.has(dep)) {
        missingParents.add(dep);
        if (row.required) {
          missingRequiredPredecessors.add(dep);
        }
      }
    }
  }

  const cycleIds = detectCycles(registry);
  const cyclePath =
    cycleIds.length > 0 ? Object.freeze([...cycleIds]) : Object.freeze([] as string[]);

  return Object.freeze({
    nodes: Object.freeze(registry.map((row) => row.id)),
    edges: Object.freeze(edges.map((e) => Object.freeze(e))),
    hasCycle: cycleIds.length > 0,
    cyclePath,
    missingParents: Object.freeze([...missingParents].sort()),
    missingRequiredPredecessors: Object.freeze([...missingRequiredPredecessors].sort()),
  });
}

/**
 * Synchronize the evidence registry against disk + inventory attribution.
 * Fails honestly — never silent PASS when required evidence is missing.
 */
export function synchronizeEvidenceChain(
  registry: readonly W3O03BEvidenceRow[] = W3_O03_B_EVIDENCE_REGISTRY,
  options: Readonly<{ repoRoot?: string }> = {},
): W3O03BSyncResult {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const findings: W3O03BSyncFinding[] = [];
  const map = byId(registry);
  const inventoryBySurface = new Map(
    W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.map((row) => [row.surfaceId, row]),
  );

  const duplicateIds = detectDuplicateIds(registry);
  for (const id of duplicateIds) {
    findings.push({
      kind: 'duplicate',
      evidenceId: id,
      detail: `Duplicate evidence id in registry: ${id}`,
    });
  }

  const graph = buildEvidenceDependencyGraph(registry);
  if (graph.hasCycle) {
    for (const id of graph.cyclePath) {
      findings.push({
        kind: 'dependency-cycle',
        evidenceId: id,
        detail: `Dependency cycle involving ${id}`,
      });
    }
  }
  for (const parent of graph.missingParents) {
    findings.push({
      kind: 'missing-parent',
      evidenceId: parent,
      detail: `Dependency parent id not present in registry: ${parent}`,
    });
  }
  for (const pred of graph.missingRequiredPredecessors) {
    findings.push({
      kind: 'missing-required-predecessor',
      evidenceId: pred,
      detail: `Required predecessor missing from registry: ${pred}`,
    });
  }

  const missingRequiredIds: string[] = [];
  const orphanIds: string[] = [];

  for (const row of registry) {
    if (!(W3_O03_B_ALLOWED_OWNERS as readonly string[]).includes(row.owner)) {
      findings.push({
        kind: 'unknown-owner',
        evidenceId: row.id,
        detail: `Unknown owner "${row.owner}" — not in allowed owner set`,
      });
    }

    const onDisk = existsSync(join(repoRoot, row.evidencePath));
    if (row.required && !onDisk) {
      missingRequiredIds.push(row.id);
      findings.push({
        kind: 'missing',
        evidenceId: row.id,
        detail: `Required evidence path missing on disk: ${row.evidencePath}`,
      });
    }
    if (row.exists && !onDisk) {
      findings.push({
        kind: 'missing',
        evidenceId: row.id,
        detail: `Registry declared exists=true but file absent: ${row.evidencePath}`,
      });
      if (!missingRequiredIds.includes(row.id) && row.required) {
        missingRequiredIds.push(row.id);
      }
    }
    if (row.usable && !onDisk) {
      findings.push({
        kind: 'wrong-status',
        evidenceId: row.id,
        detail: `usable=true is dishonest when evidence is missing on disk`,
      });
    }

    if (!(W3_O03_B_EVIDENCE_STATUSES as readonly string[]).includes(row.status)) {
      findings.push({
        kind: 'wrong-status',
        evidenceId: row.id,
        detail: `Unrecognized status "${row.status}"`,
      });
    }

    if (row.id === 'adl-placeholder' && row.status !== 'DEFERRED') {
      findings.push({
        kind: 'wrong-status',
        evidenceId: row.id,
        detail: `ADL placeholder status must remain DEFERRED until Product Owner disposition (found ${row.status})`,
      });
    }

    for (const dep of row.dependencies) {
      if (!map.has(dep)) {
        findings.push({
          kind: 'broken-dependency',
          evidenceId: row.id,
          detail: `Broken dependency: ${row.id} → ${dep} (target not in registry)`,
        });
      }
    }

    // Orphan = non-root node with empty dependencies while not the inventory root.
    if (row.dependencies.length === 0 && row.id !== 'w3-o03-a-inventory' && row.required) {
      orphanIds.push(row.id);
      findings.push({
        kind: 'orphan',
        evidenceId: row.id,
        detail: `Orphan required evidence has no dependency edges (except inventory root): ${row.id}`,
      });
    }

    if (row.inventorySurfaceId) {
      const inv = inventoryBySurface.get(row.inventorySurfaceId);
      if (!inv) {
        findings.push({
          kind: 'broken-dependency',
          evidenceId: row.id,
          detail: `Inventory surface "${row.inventorySurfaceId}" not found in W3-O03-a inventory`,
        });
      } else {
        if (inv.owner !== row.owner) {
          findings.push({
            kind: 'wrong-ownership',
            evidenceId: row.id,
            detail: `Owner mismatch vs inventory: registry=${row.owner} inventory=${inv.owner}`,
          });
        }
        if (inv.evidencePath !== row.evidencePath) {
          findings.push({
            kind: 'wrong-ownership',
            evidenceId: row.id,
            detail: `Evidence path mismatch vs inventory surface ${row.inventorySurfaceId}`,
          });
        }
      }
    }
  }

  // Inventory rows marked for W3-O03-b must appear in the registry.
  const registryInventoryIds = new Set(
    registry.map((row) => row.inventorySurfaceId).filter((id): id is string => id !== null),
  );
  for (const inv of W3_O03_A_RECOVERY_RESIDUAL_INVENTORY) {
    if (inv.futureW3O03Responsibility === 'W3-O03-b') {
      if (!registryInventoryIds.has(inv.surfaceId)) {
        findings.push({
          kind: 'missing',
          evidenceId: inv.surfaceId,
          detail: `W3-O03-a inventory row marked for W3-O03-b is absent from evidence registry: ${inv.surfaceId}`,
        });
        if (!missingRequiredIds.includes(inv.surfaceId)) {
          missingRequiredIds.push(inv.surfaceId);
        }
      }
    }
  }

  // Mandatory source kinds must all be registered.
  const registeredKinds = new Set(registry.map((row) => row.sourceKind));
  for (const kind of W3_O03_B_SOURCE_KINDS) {
    if (!registeredKinds.has(kind)) {
      findings.push({
        kind: 'missing',
        evidenceId: kind,
        detail: `Mandatory source kind not present in registry: ${kind}`,
      });
      if (!missingRequiredIds.includes(kind)) {
        missingRequiredIds.push(kind);
      }
    }
  }

  for (const id of W3_O03_B_MANDATORY_SOURCE_IDS) {
    if (!map.has(id)) {
      findings.push({
        kind: 'missing',
        evidenceId: id,
        detail: `Mandatory evidence source id absent from registry: ${id}`,
      });
      if (!missingRequiredIds.includes(id)) {
        missingRequiredIds.push(id);
      }
    }
  }

  const missingEvidenceDetected = missingRequiredIds.length > 0;
  const ok =
    findings.length === 0 &&
    !graph.hasCycle &&
    graph.missingParents.length === 0 &&
    !missingEvidenceDetected;

  return Object.freeze({
    ok,
    findings: Object.freeze(findings),
    missingRequiredIds: Object.freeze([...missingRequiredIds].sort()),
    duplicateIds,
    orphanIds: Object.freeze([...orphanIds].sort()),
    cycleIds: graph.cyclePath,
    missingEvidenceDetected,
    engineeringMayAcceptAdl008: false,
    futureAcceptedImpossibleWhileMissing: missingEvidenceDetected,
    synchronized: ok,
  });
}

/**
 * Honesty gate: ACCEPTED is impossible while required evidence is missing,
 * and Engineering never has authority to ACCEPT regardless of sync state.
 */
export function evaluateAcceptedHonesty(
  sync: W3O03BSyncResult = synchronizeEvidenceChain(),
): Readonly<{
  engineeringMayAcceptAdl008: false;
  acceptedImpossible: boolean;
  reason: string;
}> {
  if (sync.missingEvidenceDetected || !sync.ok) {
    return Object.freeze({
      engineeringMayAcceptAdl008: false,
      acceptedImpossible: true,
      reason:
        'Missing or unsynchronized evidence blocks ACCEPTED; Engineering cannot hide missing evidence or self-promote ADL-008',
    });
  }
  return Object.freeze({
    engineeringMayAcceptAdl008: false,
    acceptedImpossible: true,
    reason:
      'Evidence chain synchronized, but Engineering still cannot ACCEPT ADL-008 — Product Owner disposition (W3-O03-c) is required',
  });
}

/**
 * Internal diagnostics only — no REST / UI surface.
 */
export function buildEvidenceChainDiagnostics(
  sync: W3O03BSyncResult = synchronizeEvidenceChain(),
  graph: W3O03BDependencyGraph = buildEvidenceDependencyGraph(),
): Readonly<{
  sliceId: typeof W3_O03_B_SLICE_ID;
  synchronized: boolean;
  registrySize: number;
  findingCount: number;
  findings: readonly W3O03BSyncFinding[];
  missingRequiredIds: readonly string[];
  duplicateIds: readonly string[];
  orphanIds: readonly string[];
  hasCycle: boolean;
  cyclePath: readonly string[];
  engineeringMayAcceptAdl008: false;
  honesty: ReturnType<typeof evaluateAcceptedHonesty>;
  architectureClaims: typeof W3_O03_B_ARCHITECTURE_CLAIMS;
}> {
  return Object.freeze({
    sliceId: W3_O03_B_SLICE_ID,
    synchronized: sync.synchronized,
    registrySize: W3_O03_B_EVIDENCE_REGISTRY.length,
    findingCount: sync.findings.length,
    findings: sync.findings,
    missingRequiredIds: sync.missingRequiredIds,
    duplicateIds: sync.duplicateIds,
    orphanIds: sync.orphanIds,
    hasCycle: graph.hasCycle,
    cyclePath: graph.cyclePath,
    engineeringMayAcceptAdl008: false,
    honesty: evaluateAcceptedHonesty(sync),
    architectureClaims: W3_O03_B_ARCHITECTURE_CLAIMS,
  });
}

export function evidenceIds(): readonly string[] {
  return W3_O03_B_EVIDENCE_REGISTRY.map((row) => row.id);
}

export function requiredEvidenceRows(): readonly W3O03BEvidenceRow[] {
  return W3_O03_B_EVIDENCE_REGISTRY.filter((row) => row.required);
}

export function rowsByOwner(owner: W3O03BOwner): readonly W3O03BEvidenceRow[] {
  return W3_O03_B_EVIDENCE_REGISTRY.filter((row) => row.owner === owner);
}

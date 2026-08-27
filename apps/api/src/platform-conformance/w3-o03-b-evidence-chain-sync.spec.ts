import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { W3_O03_A_RECOVERY_RESIDUAL_INVENTORY } from './w3-o03-a-recovery-residual-inventory';
import {
  W3_O03_B_ALLOWED_OWNERS,
  W3_O03_B_ARCHITECTURE_CLAIMS,
  W3_O03_B_BINDING_FINDINGS,
  W3_O03_B_EVIDENCE_REGISTRY,
  W3_O03_B_EXPLICIT_OUT,
  W3_O03_B_MANDATORY_SOURCE_IDS,
  W3_O03_B_REQUIRED_REPORTS,
  W3_O03_B_SLICE_ID,
  W3_O03_B_SOURCE_KINDS,
  type W3O03BEvidenceRow,
  buildEvidenceChainDiagnostics,
  buildEvidenceDependencyGraph,
  evaluateAcceptedHonesty,
  evidenceIds,
  requiredEvidenceRows,
  synchronizeEvidenceChain,
} from './w3-o03-b-evidence-chain-sync';

const REPO_ROOT = join(__dirname, '../../../..');

function cloneRegistry(
  mutator: (rows: W3O03BEvidenceRow[]) => W3O03BEvidenceRow[],
): readonly W3O03BEvidenceRow[] {
  return Object.freeze(mutator([...W3_O03_B_EVIDENCE_REGISTRY]));
}

describe('W3-O03-b evidence-chain sync — unit', () => {
  it('registry contains every mandatory US295 evidence source', () => {
    const ids = new Set(evidenceIds());
    for (const id of W3_O03_B_MANDATORY_SOURCE_IDS) {
      expect(ids.has(id)).toBe(true);
    }
    const kinds = new Set(W3_O03_B_EVIDENCE_REGISTRY.map((row) => row.sourceKind));
    for (const kind of W3_O03_B_SOURCE_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
  });

  it('registry rows expose id, owner, path, status, required, exists, usable, dependencies', () => {
    for (const row of W3_O03_B_EVIDENCE_REGISTRY) {
      expect(row.id.length).toBeGreaterThan(0);
      expect(W3_O03_B_ALLOWED_OWNERS).toContain(row.owner);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.status.length).toBeGreaterThan(0);
      expect(typeof row.required).toBe('boolean');
      expect(typeof row.exists).toBe('boolean');
      expect(typeof row.usable).toBe('boolean');
      expect(Array.isArray(row.dependencies)).toBe(true);
    }
  });

  it('registry ids are unique', () => {
    const ids = evidenceIds();
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every W3-O03-a inventory row marked for W3-O03-b is bound into the registry', () => {
    const bound = new Set(
      W3_O03_B_EVIDENCE_REGISTRY.map((row) => row.inventorySurfaceId).filter(
        (id): id is string => id !== null,
      ),
    );
    for (const inv of W3_O03_A_RECOVERY_RESIDUAL_INVENTORY) {
      if (inv.futureW3O03Responsibility === 'W3-O03-b') {
        expect(bound.has(inv.surfaceId)).toBe(true);
      }
    }
  });

  it('ownership stays on existing allowed owners only', () => {
    for (const row of W3_O03_B_EVIDENCE_REGISTRY) {
      expect(W3_O03_B_ALLOWED_OWNERS).toContain(row.owner);
    }
  });

  it('ADL placeholder remains DEFERRED; Engineering cannot ACCEPT', () => {
    const adl = W3_O03_B_EVIDENCE_REGISTRY.find((row) => row.id === 'adl-placeholder');
    expect(adl?.status).toBe('DEFERRED');
    expect(W3_O03_B_BINDING_FINDINGS.engineeringMayAcceptAdl008).toBe(false);
    expect(W3_O03_B_BINDING_FINDINGS.adl008Accepted).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.adl008Accepted).toBe(false);
  });

  it('can detect missing evidence honestly', () => {
    const broken = cloneRegistry((rows) =>
      rows.map((row) =>
        row.id === 'us290'
          ? Object.freeze({
              ...row,
              evidencePath: 'docs/project/stories/__missing-us290__.md',
              exists: true,
              usable: true,
            })
          : row,
      ),
    );
    const sync = synchronizeEvidenceChain(broken, { repoRoot: REPO_ROOT });
    expect(sync.ok).toBe(false);
    expect(sync.missingEvidenceDetected).toBe(true);
    expect(sync.missingRequiredIds).toContain('us290');
    expect(sync.findings.some((f) => f.kind === 'missing')).toBe(true);
    expect(sync.engineeringMayAcceptAdl008).toBe(false);
    expect(sync.futureAcceptedImpossibleWhileMissing).toBe(true);
  });

  it('can detect duplicate evidence ids', () => {
    const withDup = cloneRegistry((rows) => {
      const us290 = rows.find((row) => row.id === 'us290')!;
      return [...rows, Object.freeze({ ...us290 })];
    });
    const sync = synchronizeEvidenceChain(withDup, { repoRoot: REPO_ROOT });
    expect(sync.ok).toBe(false);
    expect(sync.duplicateIds).toContain('us290');
    expect(sync.findings.some((f) => f.kind === 'duplicate')).toBe(true);
  });

  it('can detect orphan required evidence', () => {
    const orphaned = cloneRegistry((rows) =>
      rows.map((row) =>
        row.id === 'us291'
          ? Object.freeze({ ...row, dependencies: Object.freeze([] as const) })
          : row,
      ),
    );
    const sync = synchronizeEvidenceChain(orphaned, { repoRoot: REPO_ROOT });
    expect(sync.ok).toBe(false);
    expect(sync.orphanIds).toContain('us291');
    expect(sync.findings.some((f) => f.kind === 'orphan')).toBe(true);
  });

  it('can detect dependency cycles', () => {
    const cyclic = cloneRegistry((rows) =>
      rows.map((row) => {
        if (row.id === 'us290') {
          return Object.freeze({
            ...row,
            dependencies: Object.freeze(['us291'] as const),
          });
        }
        if (row.id === 'us291') {
          return Object.freeze({
            ...row,
            dependencies: Object.freeze(['us290'] as const),
          });
        }
        return row;
      }),
    );
    const graph = buildEvidenceDependencyGraph(cyclic);
    expect(graph.hasCycle).toBe(true);
    const sync = synchronizeEvidenceChain(cyclic, { repoRoot: REPO_ROOT });
    expect(sync.ok).toBe(false);
    expect(sync.findings.some((f) => f.kind === 'dependency-cycle')).toBe(true);
  });

  it('can detect broken / missing dependency parents', () => {
    const broken = cloneRegistry((rows) =>
      rows.map((row) =>
        row.id === 'us292'
          ? Object.freeze({
              ...row,
              dependencies: Object.freeze(['does-not-exist'] as const),
            })
          : row,
      ),
    );
    const graph = buildEvidenceDependencyGraph(broken);
    expect(graph.missingParents).toContain('does-not-exist');
    expect(graph.missingRequiredPredecessors).toContain('does-not-exist');
    const sync = synchronizeEvidenceChain(broken, { repoRoot: REPO_ROOT });
    expect(sync.ok).toBe(false);
    expect(
      sync.findings.some((f) => f.kind === 'broken-dependency' || f.kind === 'missing-parent'),
    ).toBe(true);
  });

  it('can detect unknown owner and wrong ownership vs inventory', () => {
    const unknownOwner = cloneRegistry((rows) =>
      rows.map((row) =>
        row.id === 'us290'
          ? Object.freeze({
              ...row,
              owner: 'not-a-real-owner' as W3O03BEvidenceRow['owner'],
            })
          : row,
      ),
    );
    const syncUnknown = synchronizeEvidenceChain(unknownOwner, {
      repoRoot: REPO_ROOT,
    });
    expect(syncUnknown.findings.some((f) => f.kind === 'unknown-owner')).toBe(true);

    const wrongOwner = cloneRegistry((rows) =>
      rows.map((row) =>
        row.id === 'us290'
          ? Object.freeze({
              ...row,
              owner: 'release-governance' as const,
            })
          : row,
      ),
    );
    const syncWrong = synchronizeEvidenceChain(wrongOwner, {
      repoRoot: REPO_ROOT,
    });
    expect(syncWrong.findings.some((f) => f.kind === 'wrong-ownership')).toBe(true);
  });

  it('can detect wrong status on ADL placeholder', () => {
    const wrong = cloneRegistry((rows) =>
      rows.map((row) =>
        row.id === 'adl-placeholder' ? Object.freeze({ ...row, status: 'CLOSED' as const }) : row,
      ),
    );
    const sync = synchronizeEvidenceChain(wrong, { repoRoot: REPO_ROOT });
    expect(sync.findings.some((f) => f.kind === 'wrong-status')).toBe(true);
  });

  it('honesty: Engineering cannot promote ADL-008 to ACCEPTED even when synced', () => {
    const sync = synchronizeEvidenceChain();
    expect(sync.ok).toBe(true);
    const honesty = evaluateAcceptedHonesty(sync);
    expect(honesty.engineeringMayAcceptAdl008).toBe(false);
    expect(honesty.acceptedImpossible).toBe(true);
    expect(honesty.reason.toLowerCase()).toMatch(/product owner|cannot accept/);
  });

  it('honesty: missing evidence makes future ACCEPTED impossible', () => {
    const broken = cloneRegistry((rows) =>
      rows.map((row) =>
        row.id === 'riv'
          ? Object.freeze({
              ...row,
              evidencePath: 'docs/project/__missing-riv__.md',
            })
          : row,
      ),
    );
    const sync = synchronizeEvidenceChain(broken, { repoRoot: REPO_ROOT });
    const honesty = evaluateAcceptedHonesty(sync);
    expect(honesty.acceptedImpossible).toBe(true);
    expect(honesty.engineeringMayAcceptAdl008).toBe(false);
    expect(sync.futureAcceptedImpossibleWhileMissing).toBe(true);
  });
});

describe('W3-O03-b evidence-chain sync — integration / planning', () => {
  it('authoritative registry synchronizes cleanly against disk', () => {
    const sync = synchronizeEvidenceChain();
    expect(sync.ok).toBe(true);
    expect(sync.synchronized).toBe(true);
    expect(sync.missingEvidenceDetected).toBe(false);
    expect(sync.findings).toEqual([]);
    expect(sync.duplicateIds).toEqual([]);
    expect(sync.orphanIds).toEqual([]);
    expect(sync.cycleIds).toEqual([]);
  });

  it('dependency graph has no cycles and no missing parents', () => {
    const graph = buildEvidenceDependencyGraph();
    expect(graph.hasCycle).toBe(false);
    expect(graph.missingParents).toEqual([]);
    expect(graph.missingRequiredPredecessors).toEqual([]);
    expect(graph.nodes.length).toBe(W3_O03_B_EVIDENCE_REGISTRY.length);
  });

  it('every registry evidence path exists on disk', () => {
    for (const row of requiredEvidenceRows()) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });

  it('internal diagnostics only — no customer-visible / REST / UI claims', () => {
    const diagnostics = buildEvidenceChainDiagnostics();
    expect(diagnostics.sliceId).toBe(W3_O03_B_SLICE_ID);
    expect(diagnostics.synchronized).toBe(true);
    expect(diagnostics.engineeringMayAcceptAdl008).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.restEndpointIntroduced).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.operatorUiIntroduced).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.customerVisibleStanceFeature).toBe(false);
    expect(W3_O03_B_BINDING_FINDINGS.customerVisibleFunctionality).toBe(false);
    expect(W3_O03_B_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'operator-ui',
        'rest-endpoint',
        'administration-page',
        'adl-008-accepted',
        'w3-o03-c',
      ]),
    );
  });

  it('architecture claims remain non-expansive', () => {
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.us290ToUs294Redesigned).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.productionRestartSafeClaimed).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.wave3CompleteClaimed).toBe(false);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.evidenceRegistryIntroduced).toBe(true);
    expect(W3_O03_B_ARCHITECTURE_CLAIMS.evidenceChainSynchronized).toBe(true);
  });

  it('required W3-O03-b reports exist', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of W3_O03_B_REQUIRED_REPORTS) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});

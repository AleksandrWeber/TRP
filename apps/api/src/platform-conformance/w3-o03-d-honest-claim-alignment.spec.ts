import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W3_O03_D_ARCHITECTURE_CLAIMS,
  W3_O03_D_BINDING_FINDINGS,
  W3_O03_D_CLAIM_SURFACES,
  W3_O03_D_DEFAULT_WRITTEN_LIMITATION,
  W3_O03_D_EXPLICIT_OUT,
  W3_O03_D_REQUIRED_REPORTS,
  W3_O03_D_SLICE_ID,
  alignHonestClaims,
  attemptEngineeringClaimPresentation,
  buildHonestClaimAlignmentDiagnostics,
  claimSurfaceIds,
  deriveAlignedRestartSafetyClaim,
  deriveClaimPosture,
  productionRestartSafeMayBeClaimedWithoutDisposition,
  validateClaimSurfaceContent,
  validateRestartSafetyClaimAttempt,
} from './w3-o03-d-honest-claim-alignment';
import {
  createDispositionLedger,
  recordProductOwnerDisposition,
} from './w3-o03-c-disposition-foundation';
import { synchronizeEvidenceChain } from './w3-o03-b-evidence-chain-sync';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W3-O03-d honest claim alignment — unit', () => {
  it('derives claim posture from canonical Product Owner disposition only', () => {
    const noDisposition = deriveClaimPosture(createDispositionLedger());
    expect(noDisposition.source).toBe('NO_DISPOSITION');
    expect(noDisposition.productionRestartSafeMayBePresented).toBe(false);
    expect(noDisposition.writtenLimitation).toBe(W3_O03_D_DEFAULT_WRITTEN_LIMITATION);

    const deferred = recordProductOwnerDisposition(createDispositionLedger(), {
      actorAuthority: 'product-owner',
      productOwnerIdentity: 'po@example.com',
      decision: 'DEFERRED',
      writtenLimitation:
        'Production restart-safe PASS is not authorized while ADL-008 remains deferred.',
    });
    expect(deferred.result.ok).toBe(true);
    const deferredPosture = deriveClaimPosture(deferred.ledger);
    expect(deferredPosture.source).toBe('DEFERRED');
    expect(deferredPosture.productionRestartSafeMayBePresented).toBe(false);
    expect(deferredPosture.writtenLimitation).toMatch(/not authorized/);

    const sync = synchronizeEvidenceChain();
    const accepted = recordProductOwnerDisposition(
      createDispositionLedger(),
      {
        actorAuthority: 'product-owner',
        productOwnerIdentity: 'po@example.com',
        decision: 'ACCEPTED',
      },
      { sync },
    );
    expect(accepted.result.ok).toBe(true);
    const acceptedPosture = deriveClaimPosture(accepted.ledger);
    expect(acceptedPosture.source).toBe('ACCEPTED');
    expect(acceptedPosture.productionRestartSafeMayBePresented).toBe(true);
    expect(acceptedPosture.writtenLimitation).toBeNull();
  });

  it('cannot claim Production Restart Safe without Product Owner disposition', () => {
    expect(productionRestartSafeMayBeClaimedWithoutDisposition()).toBe(false);
    const aligned = deriveAlignedRestartSafetyClaim(createDispositionLedger());
    expect(aligned.productionRestartSafeClaim).toBe(false);
    expect(aligned.derivedFromProductOwnerDisposition).toBe(true);
    expect(aligned.writtenLimitation).toBeTruthy();
  });

  it('allows Production Restart Safe presentation only when disposition is ACCEPTED', () => {
    const sync = synchronizeEvidenceChain();
    const accepted = recordProductOwnerDisposition(
      createDispositionLedger(),
      {
        actorAuthority: 'product-owner',
        productOwnerIdentity: 'po@example.com',
        decision: 'ACCEPTED',
      },
      { sync },
    );
    const aligned = deriveAlignedRestartSafetyClaim(accepted.ledger);
    expect(aligned.productionRestartSafeClaim).toBe(true);
    expect(aligned.dispositionSource).toBe('ACCEPTED');
  });

  it('Engineering cannot bypass Product Owner disposition', () => {
    const sync = synchronizeEvidenceChain();
    const accepted = recordProductOwnerDisposition(
      createDispositionLedger(),
      {
        actorAuthority: 'product-owner',
        productOwnerIdentity: 'po@example.com',
        decision: 'ACCEPTED',
      },
      { sync },
    );
    const claim = deriveAlignedRestartSafetyClaim(accepted.ledger);
    const attempt = attemptEngineeringClaimPresentation('engineering', claim, accepted.ledger);
    expect(attempt.ok).toBe(false);
    expect(attempt.failure).toBe('engineering-bypass');
    expect(W3_O03_D_BINDING_FINDINGS.engineeringMayBypassDisposition).toBe(false);
  });

  it('DEFERRED requires explicit written limitation in claim presentation', () => {
    const deferred = recordProductOwnerDisposition(createDispositionLedger(), {
      actorAuthority: 'product-owner',
      productOwnerIdentity: 'po@example.com',
      decision: 'DEFERRED',
      writtenLimitation: 'Explicit limitation text for operators.',
    });
    const claim = deriveAlignedRestartSafetyClaim(deferred.ledger);
    expect(claim.productionRestartSafeClaim).toBe(false);
    expect(claim.writtenLimitation).toMatch(/Explicit limitation/);

    const bad = validateRestartSafetyClaimAttempt(
      {
        actorAuthority: 'product-owner',
        productionRestartSafeClaim: false,
        writtenLimitation: '',
      },
      deferred.ledger,
    );
    expect(bad.ok).toBe(false);
    expect(bad.findings.some((f) => f.kind === 'missing-written-limitation')).toBe(true);
  });

  it('detects documentation that contradicts disposition with unauthorized claims', () => {
    const posture = deriveClaimPosture(createDispositionLedger());
    const surface = W3_O03_D_CLAIM_SURFACES.find(
      (s) => s.surfaceId === 'claim-recovery-residual-overview',
    )!;
    const dishonest = `# Overview\nProduction restart-safe is authorized and ADL-008 ACCEPTED.`;
    const findings = validateClaimSurfaceContent(surface, dishonest, posture);
    expect(findings.length).toBeGreaterThan(0);
    expect(
      findings.some(
        (f) => f.kind === 'unauthorized-restart-safe-claim' || f.kind === 'contradicts-disposition',
      ),
    ).toBe(true);
  });

  it('allows honest negation wording in documentation', () => {
    const posture = deriveClaimPosture(createDispositionLedger());
    const surface = W3_O03_D_CLAIM_SURFACES.find(
      (s) => s.surfaceId === 'claim-recovery-residual-overview',
    )!;
    const honest = 'Do not declare production restart-safe Complete. ADL-008 remains DEFERRED.';
    const findings = validateClaimSurfaceContent(surface, honest, posture);
    expect(findings.filter((f) => f.kind === 'unauthorized-restart-safe-claim')).toEqual([]);
  });

  it('detects runtime claim attempts without disposition', () => {
    const result = validateRestartSafetyClaimAttempt({
      actorAuthority: 'product-owner',
      productionRestartSafeClaim: true,
    });
    expect(result.ok).toBe(false);
    expect(result.findings.some((f) => f.kind === 'independent-claim-without-disposition')).toBe(
      true,
    );
  });

  it('this slice does not declare ADL-008 ACCEPTED or Production Restart Safe', () => {
    expect(W3_O03_D_BINDING_FINDINGS.productionRestartSafeClaimedBySlice).toBe(false);
    expect(W3_O03_D_BINDING_FINDINGS.adl008Accepted).toBe(false);
    expect(W3_O03_D_ARCHITECTURE_CLAIMS.adl008Accepted).toBe(false);
    expect(W3_O03_D_ARCHITECTURE_CLAIMS.productionRestartSafeClaimed).toBe(false);
  });

  it('registers claim surfaces including overview, validation, operational, runtime', () => {
    const ids = claimSurfaceIds();
    expect(ids).toContain('claim-recovery-residual-overview');
    expect(ids).toContain('claim-operational-state-matrix');
    expect(ids).toContain('validation-w3-o03-a');
    expect(ids).toContain('operational-wave-3-progress');
    expect(ids).toContain('runtime-operational-readiness');
    const kinds = new Set(W3_O03_D_CLAIM_SURFACES.map((s) => s.kind));
    expect(kinds.has('overview')).toBe(true);
    expect(kinds.has('validation-report')).toBe(true);
    expect(kinds.has('operational-report')).toBe(true);
    expect(kinds.has('runtime')).toBe(true);
  });
});

describe('W3-O03-d honest claim alignment — integration / planning', () => {
  it('aligns registered surfaces against current disposition (no disposition recorded)', () => {
    const alignment = alignHonestClaims(createDispositionLedger(), {
      repoRoot: REPO_ROOT,
    });
    expect(alignment.surfacesChecked).toBeGreaterThan(0);
    expect(alignment.posture.source).toBe('NO_DISPOSITION');
    expect(alignment.ok).toBe(true);
    expect(alignment.aligned).toBe(true);
    expect(alignment.findings).toEqual([]);
  });

  it('documentation, validation, overview, operational, and runtime surfaces do not contradict disposition', () => {
    const alignment = alignHonestClaims(createDispositionLedger(), {
      repoRoot: REPO_ROOT,
    });
    const byKind = (kind: string) =>
      alignment.findings.filter((f) =>
        W3_O03_D_CLAIM_SURFACES.some((s) => s.surfaceId === f.surfaceId && s.kind === kind),
      );
    expect(byKind('documentation')).toEqual([]);
    expect(byKind('validation-report')).toEqual([]);
    expect(byKind('overview')).toEqual([]);
    expect(byKind('operational-report')).toEqual([]);
    expect(byKind('runtime')).toEqual([]);
  });

  it('internal diagnostics only — no customer-visible / REST / UI claims', () => {
    const diagnostics = buildHonestClaimAlignmentDiagnostics();
    expect(diagnostics.sliceId).toBe(W3_O03_D_SLICE_ID);
    expect(diagnostics.alignmentOk).toBe(true);
    expect(diagnostics.productionRestartSafeClaimedBySlice).toBe(false);
    expect(diagnostics.engineeringMayBypassDisposition).toBe(false);
    expect(W3_O03_D_ARCHITECTURE_CLAIMS.restEndpointIntroduced).toBe(false);
    expect(W3_O03_D_ARCHITECTURE_CLAIMS.operatorUiIntroduced).toBe(false);
    expect(W3_O03_D_BINDING_FINDINGS.customerVisibleFunctionality).toBe(false);
    expect(W3_O03_D_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'operator-ui',
        'rest-endpoint',
        'administration-page',
        'production-restart-safe-pass-by-slice',
        'w3-o03-e',
      ]),
    );
  });

  it('architecture claims remain non-expansive', () => {
    expect(W3_O03_D_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O03_D_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W3_O03_D_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W3_O03_D_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W3_O03_D_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W3_O03_D_ARCHITECTURE_CLAIMS.honestClaimAlignmentIntroduced).toBe(true);
  });

  it('required W3-O03-d reports exist', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of W3_O03_D_REQUIRED_REPORTS) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});

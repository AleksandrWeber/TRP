import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W3_O03_B_EVIDENCE_REGISTRY,
  synchronizeEvidenceChain,
  type W3O03BEvidenceRow,
} from './w3-o03-b-evidence-chain-sync';
import {
  W3_O03_C_ARCHITECTURE_CLAIMS,
  W3_O03_C_BINDING_FINDINGS,
  W3_O03_C_DISPOSITION_DECISIONS,
  W3_O03_C_EXPLICIT_OUT,
  W3_O03_C_REQUIRED_REPORTS,
  W3_O03_C_REUSED_SECURITY,
  W3_O03_C_SECURITY_AUDIT_EVENT,
  W3_O03_C_SLICE_ID,
  attemptRewriteDispositionHistory,
  buildDispositionFoundationDiagnostics,
  computeEvidenceVersion,
  createDispositionLedger,
  currentDisposition,
  engineeringMayCreateAccepted,
  productOwnerMayCreateAccepted,
  recordProductOwnerDisposition,
} from './w3-o03-c-disposition-foundation';

const REPO_ROOT = join(__dirname, '../../../..');

function unsyncedEvidence(): ReturnType<typeof synchronizeEvidenceChain> {
  const broken = Object.freeze(
    W3_O03_B_EVIDENCE_REGISTRY.map((row) =>
      row.id === 'us290'
        ? Object.freeze({
            ...row,
            evidencePath: 'docs/project/stories/__missing-for-o03-c__.md',
          })
        : row,
    ) as W3O03BEvidenceRow[],
  );
  return synchronizeEvidenceChain(broken, { repoRoot: REPO_ROOT });
}

describe('W3-O03-c disposition foundation — unit', () => {
  it('exactly two decisions exist: ACCEPTED or DEFERRED', () => {
    expect([...W3_O03_C_DISPOSITION_DECISIONS]).toEqual(['ACCEPTED', 'DEFERRED']);
  });

  it('Engineering cannot create ADL-008 ACCEPTED', () => {
    expect(engineeringMayCreateAccepted()).toBe(false);
    expect(W3_O03_C_BINDING_FINDINGS.engineeringMayCreateAccepted).toBe(false);
    const { result, ledger } = recordProductOwnerDisposition(createDispositionLedger(), {
      actorAuthority: 'engineering',
      productOwnerIdentity: 'eng@example.com',
      decision: 'ACCEPTED',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure).toBe('engineering-forbidden');
    }
    expect(ledger.history).toHaveLength(0);
  });

  it('Engineering cannot create DEFERRED or fabricate limitations', () => {
    const { result, ledger } = recordProductOwnerDisposition(createDispositionLedger(), {
      actorAuthority: 'engineering',
      productOwnerIdentity: 'eng@example.com',
      decision: 'DEFERRED',
      writtenLimitation: 'fabricated limitation',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure).toBe('engineering-forbidden');
    }
    expect(ledger.history).toHaveLength(0);
  });

  it('Product Owner can create ADL-008 ACCEPTED when evidence is synchronized', () => {
    expect(productOwnerMayCreateAccepted()).toBe(true);
    expect(W3_O03_C_BINDING_FINDINGS.productOwnerMayCreateAccepted).toBe(true);
    const sync = synchronizeEvidenceChain();
    expect(sync.synchronized).toBe(true);
    const { result, ledger } = recordProductOwnerDisposition(
      createDispositionLedger(),
      {
        actorAuthority: 'product-owner',
        productOwnerIdentity: 'po@example.com',
        decision: 'ACCEPTED',
        timestampIso: '2026-08-27T17:00:00.000Z',
      },
      { sync },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.decision).toBe('ACCEPTED');
      expect(result.record.writtenLimitation).toBeNull();
      expect(result.record.productOwnerIdentity).toBe('po@example.com');
      expect(result.record.evidenceVersion.length).toBeGreaterThan(0);
      expect(result.record.actorAuthority).toBe('product-owner');
      expect(result.record.timestampIso).toBe('2026-08-27T17:00:00.000Z');
    }
    expect(currentDisposition(ledger)?.decision).toBe('ACCEPTED');
  });

  it('ACCEPTED cannot exist without synchronized evidence', () => {
    const sync = unsyncedEvidence();
    expect(sync.synchronized).toBe(false);
    const { result, ledger } = recordProductOwnerDisposition(
      createDispositionLedger(),
      {
        actorAuthority: 'product-owner',
        productOwnerIdentity: 'po@example.com',
        decision: 'ACCEPTED',
      },
      { sync },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure).toBe('accepted-requires-synchronized-evidence');
    }
    expect(ledger.history).toHaveLength(0);
  });

  it('DEFERRED cannot exist without explicit written limitation', () => {
    const emptyCases: Array<string | null | undefined> = [undefined, null, '', '   '];
    for (const writtenLimitation of emptyCases) {
      const { result, ledger } = recordProductOwnerDisposition(createDispositionLedger(), {
        actorAuthority: 'product-owner',
        productOwnerIdentity: 'po@example.com',
        decision: 'DEFERRED',
        writtenLimitation,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.failure).toBe('deferred-requires-written-limitation');
      }
      expect(ledger.history).toHaveLength(0);
    }
  });

  it('Product Owner can create DEFERRED with explicit written limitation', () => {
    const { result, ledger } = recordProductOwnerDisposition(createDispositionLedger(), {
      actorAuthority: 'product-owner',
      productOwnerIdentity: 'po@example.com',
      decision: 'DEFERRED',
      writtenLimitation:
        'Production restart-safe PASS is not authorized while ADL-008 remains deferred.',
      timestampIso: '2026-08-27T17:05:00.000Z',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.record.decision).toBe('DEFERRED');
      expect(result.record.writtenLimitation).toMatch(/not authorized/);
    }
    expect(currentDisposition(ledger)?.decision).toBe('DEFERRED');
  });

  it('governance record is immutable; history cannot be rewritten', () => {
    expect(W3_O03_C_BINDING_FINDINGS.governanceRecordImmutable).toBe(true);
    expect(W3_O03_C_BINDING_FINDINGS.governanceHistoryRewriteForbidden).toBe(true);
    const first = recordProductOwnerDisposition(createDispositionLedger(), {
      actorAuthority: 'product-owner',
      productOwnerIdentity: 'po@example.com',
      decision: 'DEFERRED',
      writtenLimitation: 'Initial limitation text.',
      timestampIso: '2026-08-27T17:10:00.000Z',
    });
    expect(first.result.ok).toBe(true);
    const originalId = first.result.ok === true ? first.result.record.recordId : '';
    const rewrite = attemptRewriteDispositionHistory(first.ledger, originalId, {
      decision: 'ACCEPTED',
      writtenLimitation: null,
    });
    expect(rewrite.ok).toBe(false);
    if (!rewrite.ok) {
      expect(rewrite.failure).toBe('history-rewrite-forbidden');
    }
    expect(first.ledger.history[0]?.decision).toBe('DEFERRED');
  });

  it('changing disposition creates a NEW record and preserves previous', () => {
    const deferred = recordProductOwnerDisposition(createDispositionLedger(), {
      actorAuthority: 'product-owner',
      productOwnerIdentity: 'po@example.com',
      decision: 'DEFERRED',
      writtenLimitation: 'Deferred with written limitation.',
      timestampIso: '2026-08-27T17:15:00.000Z',
    });
    expect(deferred.result.ok).toBe(true);
    const accepted = recordProductOwnerDisposition(deferred.ledger, {
      actorAuthority: 'product-owner',
      productOwnerIdentity: 'po@example.com',
      decision: 'ACCEPTED',
      timestampIso: '2026-08-27T17:20:00.000Z',
    });
    expect(accepted.result.ok).toBe(true);
    expect(accepted.ledger.history).toHaveLength(2);
    expect(accepted.ledger.history[0]?.decision).toBe('DEFERRED');
    expect(accepted.ledger.history[1]?.decision).toBe('ACCEPTED');
    expect(accepted.ledger.history[1]?.supersedesRecordId).toBe(
      accepted.ledger.history[0]?.recordId,
    );
    expect(currentDisposition(accepted.ledger)?.decision).toBe('ACCEPTED');
  });

  it('rejects missing Product Owner identity and invalid decisions', () => {
    const missingId = recordProductOwnerDisposition(createDispositionLedger(), {
      actorAuthority: 'product-owner',
      productOwnerIdentity: '  ',
      decision: 'DEFERRED',
      writtenLimitation: 'Limitation text.',
    });
    expect(missingId.result.ok).toBe(false);
    if (!missingId.result.ok) {
      expect(missingId.result.failure).toBe('missing-product-owner-identity');
    }

    const invalid = recordProductOwnerDisposition(createDispositionLedger(), {
      actorAuthority: 'product-owner',
      productOwnerIdentity: 'po@example.com',
      decision: 'PENDING' as 'ACCEPTED',
    });
    expect(invalid.result.ok).toBe(false);
    if (!invalid.result.ok) {
      expect(invalid.result.failure).toBe('invalid-decision');
    }
  });

  it('this slice does not declare ADL-008 ACCEPTED or record a package disposition', () => {
    expect(W3_O03_C_BINDING_FINDINGS.dispositionRecordedByThisSlice).toBe(false);
    expect(W3_O03_C_BINDING_FINDINGS.adl008Accepted).toBe(false);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.adl008Accepted).toBe(false);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.dispositionDecidedByThisSlice).toBe(false);
    expect(W3_O03_C_BINDING_FINDINGS.productOwnerDispositionStillRequired).toBe(true);
  });
});

describe('W3-O03-c disposition foundation — integration / planning', () => {
  it('consumes synchronized W3-O03-b evidence version', () => {
    const sync = synchronizeEvidenceChain();
    expect(sync.synchronized).toBe(true);
    const version = computeEvidenceVersion(sync);
    expect(version.startsWith('w3-o03-b:SYNCED:')).toBe(true);
  });

  it('internal diagnostics only — no customer-visible / REST / UI claims', () => {
    const diagnostics = buildDispositionFoundationDiagnostics();
    expect(diagnostics.sliceId).toBe(W3_O03_C_SLICE_ID);
    expect(diagnostics.foundationReady).toBe(true);
    expect(diagnostics.dispositionRecorded).toBe(false);
    expect(diagnostics.currentDecision).toBeNull();
    expect(diagnostics.adl008AcceptedByPackage).toBe(false);
    expect(diagnostics.engineeringMayCreateAccepted).toBe(false);
    expect(diagnostics.productOwnerMayCreateAccepted).toBe(true);
    expect(diagnostics.securityAuditEvent).toBe(W3_O03_C_SECURITY_AUDIT_EVENT);
    expect(diagnostics.reusedSecurity).toEqual([...W3_O03_C_REUSED_SECURITY]);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.restEndpointIntroduced).toBe(false);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.operatorUiIntroduced).toBe(false);
    expect(W3_O03_C_BINDING_FINDINGS.customerVisibleFunctionality).toBe(false);
    expect(W3_O03_C_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'operator-ui',
        'rest-endpoint',
        'administration-page',
        'adl-008-accepted-declaration',
        'w3-o03-d',
      ]),
    );
  });

  it('architecture claims remain non-expansive; ownership unchanged', () => {
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.us290ToUs294Redesigned).toBe(false);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.productionRestartSafeClaimed).toBe(false);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.wave3CompleteClaimed).toBe(false);
    expect(W3_O03_C_ARCHITECTURE_CLAIMS.dispositionFoundationIntroduced).toBe(true);
  });

  it('reuses Authentication, Authorization, Workspace Isolation, Security Audit', () => {
    expect(W3_O03_C_REUSED_SECURITY).toEqual([
      'Authentication',
      'Authorization',
      'Workspace Isolation',
      'Security Audit',
    ]);
  });

  it('required W3-O03-c reports exist', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of W3_O03_C_REQUIRED_REPORTS) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});

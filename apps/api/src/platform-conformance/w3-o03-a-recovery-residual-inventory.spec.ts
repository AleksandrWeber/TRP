import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W3_O03_A_ADL008_CURRENT_STATUS,
  W3_O03_A_ALLOWED_OWNERS,
  W3_O03_A_ARCHITECTURE_CLAIMS,
  W3_O03_A_BINDING_FINDINGS,
  W3_O03_A_DOMAIN_CLASSES,
  W3_O03_A_EXPLICIT_OUT,
  W3_O03_A_RECOVERY_RESIDUAL_INVENTORY,
  W3_O03_A_REQUIRED_SURFACE_KINDS,
  W3_O03_A_SLICE_ID,
  W3_O03_A_STANCE_OWNERS,
  W3_O03_A_SURFACE_KINDS,
  rowsByKind,
  rowsExplicitOut,
  rowsNonRecoverable,
  rowsRecoverable,
  rowsStanceDomain,
  rowsSubstrate,
  rowsUs295Inputs,
  surfaceIds,
} from './w3-o03-a-recovery-residual-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W3-O03-a recovery residual inventory — unit', () => {
  it('inventory completeness: every required surface kind appears', () => {
    const kinds = new Set(W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.map((row) => row.kind));
    for (const kind of W3_O03_A_REQUIRED_SURFACE_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W3_O03_A_SURFACE_KINDS).toEqual([...W3_O03_A_REQUIRED_SURFACE_KINDS]);
  });

  it('inventory completeness: surface ids are unique and non-empty', () => {
    const ids = surfaceIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification fields', () => {
    for (const row of W3_O03_A_RECOVERY_RESIDUAL_INVENTORY) {
      expect(W3_O03_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W3_O03_A_DOMAIN_CLASSES).toContain(row.domainClass);
      expect(['RECOVERABLE', 'NON_RECOVERABLE']).toContain(row.stanceClass);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW3O03Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.authorizesProductionRestartSafe).toBe(false);
    }
  });

  it('ownership consistency: stance / substrate owners stay on existing recovery / ADL set', () => {
    for (const row of rowsStanceDomain()) {
      expect([
        'architecture-decision-log',
        'release-governance',
        'wave-3-documentation',
        'platform-readiness',
      ]).toContain(row.owner);
    }
    for (const row of rowsSubstrate()) {
      expect(['trading-session', 'runtime-recovery', 'release-governance']).toContain(row.owner);
    }
    expect(W3_O03_A_STANCE_OWNERS).toEqual(
      expect.arrayContaining([
        'architecture-decision-log',
        'trading-session',
        'runtime-recovery',
        'release-governance',
      ]),
    );
  });

  it('ownership consistency: every owner is in the allowed set', () => {
    for (const row of W3_O03_A_RECOVERY_RESIDUAL_INVENTORY) {
      expect(W3_O03_A_ALLOWED_OWNERS).toContain(row.owner);
    }
  });

  it('distinction consistency: stance ≠ O01 stores; ≠ O02 queue; ≠ O04; ≠ O05', () => {
    const o01 = W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.filter(
      (row) => row.domainClass === 'w3-o01-analytical-durability',
    );
    const o02 = W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.filter(
      (row) => row.domainClass === 'w3-o02-notification-queue',
    );
    const o04 = W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.filter(
      (row) => row.domainClass === 'w3-o04-kill-switch',
    );
    const o05 = W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.filter(
      (row) => row.domainClass === 'w3-o05-monitoring',
    );
    expect(o01.length).toBeGreaterThan(0);
    expect(o02.length).toBeGreaterThan(0);
    expect(o04.length).toBeGreaterThan(0);
    expect(o05.length).toBeGreaterThan(0);
    for (const row of [...o01, ...o02, ...o04, ...o05]) {
      expect(row.stanceClass).toBe('NON_RECOVERABLE');
      expect(row.isUs295Input).toBe(false);
      expect(row.authorizesProductionRestartSafe).toBe(false);
    }
  });

  it('distinction consistency: US290–US294 ≠ US295 stance Close', () => {
    const substrate = rowsSubstrate();
    expect(substrate.length).toBeGreaterThanOrEqual(5);
    for (const row of substrate) {
      expect(row.authorizesProductionRestartSafe).toBe(false);
      expect(row.honestyRequirement.toLowerCase()).toMatch(/not|≠|alone|substrate|input|does not/);
    }
    expect(W3_O03_A_BINDING_FINDINGS.us290ToUs294Closed).toBe(true);
    expect(W3_O03_A_BINDING_FINDINGS.us294AloneClosesAdl008).toBe(false);
    expect(W3_O03_A_BINDING_FINDINGS.us295Open).toBe(true);
  });

  it('honesty: ADL-008 remains DEFERRED; no row authorizes restart-safe', () => {
    expect(W3_O03_A_ADL008_CURRENT_STATUS).toBe('DEFERRED');
    expect(W3_O03_A_BINDING_FINDINGS.adl008Status).toBe('DEFERRED');
    expect(W3_O03_A_BINDING_FINDINGS.productionRestartSafeAuthorized).toBe(false);
    expect(W3_O03_A_BINDING_FINDINGS.silentPassForbidden).toBe(true);
    expect(W3_O03_A_BINDING_FINDINGS.engineeringMaySelfPromoteAdl008).toBe(false);
    const adl = rowsByKind('adl-governance');
    expect(adl.length).toBe(1);
    expect(adl[0]?.currentStatus).toBe('DEFERRED');
    expect(adl[0]?.authorizesProductionRestartSafe).toBe(false);
  });

  it('classification: recoverable vs non-recoverable partitions are non-empty and exclusive', () => {
    const recoverable = rowsRecoverable();
    const nonRecoverable = rowsNonRecoverable();
    expect(recoverable.length).toBeGreaterThan(0);
    expect(nonRecoverable.length).toBeGreaterThan(0);
    expect(recoverable.length + nonRecoverable.length).toBe(
      W3_O03_A_RECOVERY_RESIDUAL_INVENTORY.length,
    );
    for (const row of recoverable) {
      expect(row.stanceClass).toBe('RECOVERABLE');
    }
    for (const row of nonRecoverable) {
      expect(row.stanceClass).toBe('NON_RECOVERABLE');
    }
  });

  it('US295 inputs include ADL-008, residual register, and US290–US294 evidence', () => {
    const inputs = rowsUs295Inputs();
    const ids = new Set(inputs.map((row) => row.surfaceId));
    expect(ids.has('adl-008-decision-log-entry')).toBe(true);
    expect(ids.has('us295-story-residual')).toBe(true);
    expect(ids.has('td036-r6-residual-register')).toBe(true);
    expect(ids.has('us294-chaos-restart-evidence-package')).toBe(true);
    expect(ids.has('us290-force-confirm-recovering')).toBe(true);
    expect(inputs.every((row) => row.stanceClass === 'RECOVERABLE')).toBe(true);
  });

  it('explicit OUT surfaces cover Kill Switch, Monitoring, Live Trading, BC/HA/DR, E19', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(5);
    for (const row of out) {
      expect(row.stanceClass).toBe('NON_RECOVERABLE');
      expect(row.existsToday).toBe(false);
      expect(row.futureW3O03Responsibility.startsWith('out-of-scope-')).toBe(true);
    }
  });
});

describe('W3-O03-a recovery residual inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W3_O03_A_SLICE_ID).toBe('W3-O03-a');
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.adl008Accepted).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.productionRestartSafeClaimed).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.customerVisibleStanceFeature).toBe(false);
    expect(W3_O03_A_BINDING_FINDINGS.customerVisibleStanceFeatureFromSliceA).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–2 / O01–O02 unchanged', () => {
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.w3O01Redesigned).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.w3O02Redesigned).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.us290ToUs294Redesigned).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no second SoT / Lake / Outbox / recovery domain', () => {
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.newKnowledgeLake).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.newOutbox).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.newInbox).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.newLedger).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.newEventStore).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.newProjectionStore).toBe(false);
    expect(W3_O03_A_ARCHITECTURE_CLAIMS.newRecoveryDomain).toBe(false);
    expect(W3_O03_A_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'second-recovery-domain',
        'second-lake',
        'second-outbox',
        'adl-008-accepted-self-promotion',
        'production-restart-safe-pass',
        'business-continuity',
        'high-availability',
        'disaster-recovery-product',
        'w3-o03-b',
      ]),
    );
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W3_O03_A_RECOVERY_RESIDUAL_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });

  it('required reports exist for W3-O03-a', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o03-a-recovery-residual-inventory.md',
      'w3-o03-a-implementation-report.md',
      'w3-o03-a-architecture-review.md',
      'w3-o03-a-security-review.md',
      'w3-o03-a-product-review.md',
      'w3-o03-a-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});

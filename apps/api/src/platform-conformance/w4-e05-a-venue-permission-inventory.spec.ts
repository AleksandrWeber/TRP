import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W4_E05_A_ALLOWED_OWNERS,
  W4_E05_A_ARCHITECTURE_CLAIMS,
  W4_E05_A_ARTIFACT_KINDS,
  W4_E05_A_BINDING_FINDINGS,
  W4_E05_A_DEPENDENCY_DIRECTIONS,
  W4_E05_A_DURABILITY_CLASSES,
  W4_E05_A_EXPLICIT_OUT,
  W4_E05_A_REQUIRED_ARTIFACT_KINDS,
  W4_E05_A_SLICE_ID,
  W4_E05_A_SUBSTRATE_OWNERS,
  W4_E05_A_VENUE_PERMISSION_INVENTORY,
  artifactIds,
  rowsByKind,
  rowsDependencies,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsPaperProduct,
  rowsSurvive,
  rowsVenuePermissionEphemeral,
  rowsVenuePermissionSurvive,
} from './w4-e05-a-venue-permission-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W4-E05-a venue permission inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W4_E05_A_VENUE_PERMISSION_INVENTORY.map((row) => row.kind));
    for (const kind of W4_E05_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W4_E05_A_ARTIFACT_KINDS).toEqual([...W4_E05_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification fields', () => {
    for (const row of W4_E05_A_VENUE_PERMISSION_INVENTORY) {
      expect(W4_E05_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W4_E05_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW4E05Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.authorizesVenuePermissionVerificationComplete).toBe(false);
      if (row.kind === 'dependency') {
        expect(W4_E05_A_DEPENDENCY_DIRECTIONS).toContain(row.dependencyDirection);
      }
    }
  });

  it('ownership consistency: substrate owners stay on existing exchange set', () => {
    const ownership = rowsByKind('ownership');
    expect(ownership.length).toBeGreaterThanOrEqual(4);
    for (const row of ownership) {
      expect(W4_E05_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
  });

  it('ownership consistency: every owner is in the allowed set', () => {
    for (const row of W4_E05_A_VENUE_PERMISSION_INVENTORY) {
      expect(W4_E05_A_ALLOWED_OWNERS).toContain(row.owner);
    }
  });

  it('distinction consistency: vendor authoritative / hardcoded not authoritative / probe ≠ E05 Complete', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-vendor-reported-authoritative')).toBe(true);
    expect(ids.has('honesty-hardcoded-default-not-authoritative')).toBe(true);
    expect(ids.has('honesty-permission-verified-not-live-trading')).toBe(true);
    expect(ids.has('honesty-capability-probe-not-e05-complete')).toBe(true);
    expect(ids.has('honesty-w4-e01-foundation-consumed')).toBe(true);
    expect(ids.has('honesty-w4-e02-foundation-consumed')).toBe(true);
    expect(ids.has('honesty-w4-e03-foundation-consumed')).toBe(true);
    expect(ids.has('honesty-w4-e04-foundation-consumed')).toBe(true);
    expect(ids.has('honesty-e05-not-wave4-complete')).toBe(true);
    expect(ids.has('honesty-runtime-cache-ephemeral')).toBe(true);
    for (const row of honesty) {
      expect(row.authorizesVenuePermissionVerificationComplete).toBe(false);
    }
  });

  it('honesty: no row authorizes Venue Permission Verification Complete; permission does not survive restart from slice a', () => {
    expect(W4_E05_A_BINDING_FINDINGS.venuePermissionVerificationCompleteAuthorized).toBe(false);
    expect(W4_E05_A_BINDING_FINDINGS.venuePermissionVerificationSurvivesRestartAfterSliceA).toBe(
      false,
    );
    expect(W4_E05_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W4_E05_A_BINDING_FINDINGS.vendorReportedPermissionsAuthoritative).toBe(true);
    expect(W4_E05_A_BINDING_FINDINGS.hardcodedDefaultPermissionsNotAuthoritative).toBe(true);
    expect(W4_E05_A_BINDING_FINDINGS.runtimePermissionCacheEphemeral).toBe(true);
    expect(W4_E05_A_BINDING_FINDINGS.durablePermissionVerificationDoesNotExist).toBe(true);
    expect(W4_E05_A_BINDING_FINDINGS.restartRecoveryDoesNotExist).toBe(true);
    expect(W4_E05_A_BINDING_FINDINGS.operationalContinuityDoesNotExist).toBe(true);
    expect(W4_E05_A_BINDING_FINDINGS.noCustomerVisiblePermissionVerification).toBe(true);
    expect(W4_E05_A_BINDING_FINDINGS.w4E01FoundationConsumedNotRedesigned).toBe(true);
    expect(W4_E05_A_BINDING_FINDINGS.w4E02FoundationConsumedNotRedesigned).toBe(true);
    expect(W4_E05_A_BINDING_FINDINGS.w4E03FoundationConsumedNotRedesigned).toBe(true);
    expect(W4_E05_A_BINDING_FINDINGS.w4E04FoundationConsumedNotRedesigned).toBe(true);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(W4_E05_A_VENUE_PERMISSION_INVENTORY.length);
  });

  it('venue permission SURVIVE/EPHEMERAL subsets are documented', () => {
    expect(rowsVenuePermissionSurvive().length).toBeGreaterThan(0);
    expect(rowsVenuePermissionEphemeral().length).toBeGreaterThan(0);
    for (const row of [...rowsVenuePermissionSurvive(), ...rowsVenuePermissionEphemeral()]) {
      expect(row.authorizesVenuePermissionVerificationComplete).toBe(false);
    }
  });

  it('dependencies cover consumes, produces, depends-on, observed-by, and blocked-by', () => {
    for (const direction of W4_E05_A_DEPENDENCY_DIRECTIONS) {
      expect(rowsDependencies(direction).length).toBeGreaterThan(0);
    }
  });

  it('permission probe and hardcoded default surfaces are catalogued', () => {
    const ids = new Set(artifactIds());
    expect(ids.has('cmd-vendor-permission-probe-binance')).toBe(true);
    expect(ids.has('runtime-read-api-permissions-fallback')).toBe(true);
    expect(ids.has('runtime-venue-adapter-default-api-permissions')).toBe(true);
    expect(ids.has('ephemeral-hardcoded-spot-read-spot-trade')).toBe(true);
    expect(ids.has('persist-vendor-permission-verification')).toBe(true);
  });

  it('explicit OUT surfaces cover probe/persistence/recovery/continuity, E01–E04 reopen, engine clone, Live', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(8);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-permission-probe-implementation-slice-a')).toBe(true);
    expect(ids.has('out-persistence-implementation-slice-a')).toBe(true);
    expect(ids.has('out-restart-recovery-slice-a')).toBe(true);
    expect(ids.has('out-operational-continuity-slice-a')).toBe(true);
    expect(ids.has('out-w4-e01-reopen')).toBe(true);
    expect(ids.has('out-w4-e02-reopen')).toBe(true);
    expect(ids.has('out-w4-e03-reopen')).toBe(true);
    expect(ids.has('out-w4-e04-reopen')).toBe(true);
    expect(ids.has('out-engine-clone-permission')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
  });

  it('paper product gap rows: hardcoded defaults and missing vendor probe', () => {
    const paper = rowsPaperProduct();
    expect(paper.length).toBeGreaterThan(0);
    const hardcoded = paper.find(
      (row) => row.artifactId === 'ephemeral-hardcoded-spot-read-spot-trade',
    );
    expect(hardcoded?.existsToday).toBe(true);
    expect(hardcoded?.durabilityClass).toBe('EPHEMERAL');
    const probe = paper.find((row) => row.artifactId === 'cmd-vendor-permission-probe-binance');
    expect(probe?.existsToday).toBe(false);
  });
});

describe('W4-E05-a venue permission inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W4_E05_A_SLICE_ID).toBe('W4-E05-a');
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.duplicateExchangeSubsystem).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.duplicatePermissionSubsystem).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.engineClonePerVenue).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.w4E01Reopened).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.w4E02Reopened).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.w4E03Reopened).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.w4E04Reopened).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.venuePermissionVerificationCompleteClaimed).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.venuePermissionVerificationSurvivesRestart).toBe(false);
    expect(W4_E05_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–3 / W4-E01…E04 unchanged', () => {
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.w4E01Reopened).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.w4E02Reopened).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.w4E03Reopened).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.w4E04Reopened).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no duplicate permission subsystem / persistence owner / engine clone', () => {
    expect(W4_E05_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    expect(W4_E05_A_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'permission-probe-implementation',
        'persistence-implementation',
        'restart-recovery',
        'operational-continuity',
        'new-persistence-owner',
        'new-bounded-context',
        'engine-clone',
        'w4-e01-reopen',
        'w4-e02-reopen',
        'w4-e03-reopen',
        'w4-e04-reopen',
        'venue-permission-verification-complete',
      ]),
    );
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W4_E05_A_VENUE_PERMISSION_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });

  it('required reports exist for W4-E05-a', () => {
    const wave4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');
    for (const name of [
      'w4-e05-a-venue-permission-inventory.md',
      'w4-e05-a-implementation-report.md',
      'w4-e05-a-architecture-review.md',
      'w4-e05-a-security-review.md',
      'w4-e05-a-product-review.md',
      'w4-e05-a-validation-report.md',
    ]) {
      expect(existsSync(join(wave4, name))).toBe(true);
    }
  });
});

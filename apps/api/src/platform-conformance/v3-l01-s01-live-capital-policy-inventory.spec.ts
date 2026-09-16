import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { V2_READINESS } from './v2-certification-checklist';
import { V2_COMPATIBILITY_MATRIX } from './v2-compatibility-matrix';
import {
  V3_L01_S01_ALLOWED_OWNERS,
  V3_L01_S01_ARCHITECTURE_CLAIMS,
  V3_L01_S01_ARTIFACT_KINDS,
  V3_L01_S01_BINDING_FINDINGS,
  V3_L01_S01_CAPABILITY_CATEGORIES,
  V3_L01_S01_DURABILITY_CLASSES,
  V3_L01_S01_EXPLICIT_OUT,
  V3_L01_S01_HONEST_PRODUCT_BASELINE,
  V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY,
  V3_L01_S01_REQUIRED_ARTIFACT_KINDS,
  V3_L01_S01_REQUIRED_SURFACE_CLASSES,
  V3_L01_S01_SLICE_ID,
  V3_L01_S01_SUBSTRATE_OWNERS,
  artifactIds,
  coveredSurfaceClasses,
  rowsByKind,
  rowsBySurfaceClass,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsSurvive,
} from './v3-l01-s01-live-capital-policy-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('PROPOSED-V3-L01-S01 live capital policy inventory — unit', () => {
  it('A/B: inventory exists and required V3-L01 surface classes are represented', () => {
    expect(V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY.length).toBeGreaterThan(20);
    expect(coveredSurfaceClasses()).toEqual([...V3_L01_S01_REQUIRED_SURFACE_CLASSES]);
    for (const surface of V3_L01_S01_REQUIRED_SURFACE_CLASSES) {
      expect(rowsBySurfaceClass(surface).length).toBeGreaterThan(0);
    }
  });

  it('C: inventory is structurally valid — kinds, unique ids, required fields', () => {
    const kinds = new Set(V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY.map((row) => row.kind));
    for (const kind of V3_L01_S01_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(V3_L01_S01_ARTIFACT_KINDS).toEqual([...V3_L01_S01_REQUIRED_ARTIFACT_KINDS]);

    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);

    for (const row of V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY) {
      expect(V3_L01_S01_ALLOWED_OWNERS).toContain(row.owner);
      expect(V3_L01_S01_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(V3_L01_S01_CAPABILITY_CATEGORIES).toContain(row.capabilityCategory);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureV3L01Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.authorizesLiveTradingAvailable).toBe(false);
      expect(row.authorizesLiveCapitalComplete).toBe(false);
      expect(row.authorizesWorkspaceLiveEnabled).toBe(false);
    }
  });

  it('D: honesty constraints are represented', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-inventory-not-activation')).toBe(true);
    expect(ids.has('honesty-connectivity-not-authorization')).toBe(true);
    expect(ids.has('honesty-enablement-not-execution')).toBe(true);
    expect(ids.has('honesty-paper-remains-default')).toBe(true);
    expect(ids.has('honesty-live-trading-not-available')).toBe(true);
    expect(V3_L01_S01_HONEST_PRODUCT_BASELINE.inventoryNotActivation).toBe(true);
    expect(V3_L01_S01_HONEST_PRODUCT_BASELINE.connectivityNotAuthorization).toBe(true);
    expect(V3_L01_S01_HONEST_PRODUCT_BASELINE.enablementNotExecution).toBe(true);
  });

  it('E/F: Paper default remains true; liveCapitalAuthorized remains false', () => {
    expect(V3_L01_S01_HONEST_PRODUCT_BASELINE.paperIsDefault).toBe(true);
    expect(V3_L01_S01_BINDING_FINDINGS.paperFreezePreserved).toBe(true);
    expect(V2_COMPATIBILITY_MATRIX.every((row) => row.paperFreeze === true)).toBe(true);
    expect(V2_READINESS.liveCapitalAuthorized).toBe(false);
    expect(V3_L01_S01_BINDING_FINDINGS.liveCapitalAuthorized).toBe(false);
  });

  it('G: inventory does not assert live execution availability', () => {
    expect(V3_L01_S01_BINDING_FINDINGS.liveTradingAvailable).toBe(false);
    expect(V3_L01_S01_HONEST_PRODUCT_BASELINE.liveTradingAvailable).toBe(false);
    expect(V3_L01_S01_HONEST_PRODUCT_BASELINE.liveOrdersSubmittable).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.liveTradingClaimed).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.liveCapitalCompleteClaimed).toBe(false);
    for (const row of V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY) {
      expect(row.authorizesLiveTradingAvailable).toBe(false);
    }
  });

  it('H/I/J: no workspace live-policy schema, enablement API, or live admission wiring introduced', () => {
    expect(V3_L01_S01_BINDING_FINDINGS.workspaceLivePolicyExistsToday).toBe(false);
    expect(V3_L01_S01_BINDING_FINDINGS.enablementApiExists).toBe(false);
    expect(V3_L01_S01_BINDING_FINDINGS.liveAdmissionWiringExists).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.newSchema).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.newApi).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.s02Implemented).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.s03Implemented).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.s04Implemented).toBe(false);
    expect(
      rowsByKind('state').find((row) => row.artifactId === 'state-workspace-live-policy-absent')
        ?.existsToday,
    ).toBe(false);
    expect(
      rowsByKind('ephemeral-artifact').find((row) => row.artifactId === 'eph-enablement-api-absent')
        ?.existsToday,
    ).toBe(false);
    expect(
      rowsByKind('ephemeral-artifact').find(
        (row) => row.artifactId === 'eph-live-admission-attrs-absent',
      )?.existsToday,
    ).toBe(false);
  });

  it('K: architecture claims forbid unrelated runtime / downstream package work', () => {
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.newLiveAdapter).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.gateBypassed).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.killSwitchBypassed).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.l02Implemented).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.l03Implemented).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.l04Implemented).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.l05Implemented).toBe(false);
    expect(V3_L01_S01_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(V3_L01_S01_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'workspace-live-policy-schema',
        'enablement-api',
        'live-adapter',
        's02',
        's03',
        's04',
        'fiv',
      ]),
    );
  });

  it('ownership: substrate owners stay on existing L01 set', () => {
    const ownership = rowsByKind('ownership');
    expect(ownership.length).toBeGreaterThanOrEqual(5);
    expect(V3_L01_S01_SUBSTRATE_OWNERS).toEqual(
      expect.arrayContaining([
        'workspace',
        'trading-session',
        'runtime-enforcement',
        'authentication',
        'authorization',
        'secret-vault',
      ]),
    );
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY.length);
  });

  it('explicit OUT covers S02–S04 and L02–L05', () => {
    const out = rowsExplicitOut();
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-s02-workspace-persistence')).toBe(true);
    expect(ids.has('out-s03-enablement-api')).toBe(true);
    expect(ids.has('out-s04-gate-ks-session')).toBe(true);
    expect(ids.has('out-l02-live-order-io')).toBe(true);
    expect(ids.has('out-l03-financial-action-log')).toBe(true);
    expect(ids.has('out-l04-live-operator-ui')).toBe(true);
    expect(ids.has('out-l05-replay-protection')).toBe(true);
  });

  it('slice id remains PROPOSED-V3-L01-S01', () => {
    expect(V3_L01_S01_SLICE_ID).toBe('PROPOSED-V3-L01-S01');
  });
});

describe('PROPOSED-V3-L01-S01 live capital policy inventory — integration', () => {
  it('evidence paths exist on disk', () => {
    for (const row of V3_L01_S01_LIVE_CAPITAL_POLICY_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });

  it('Wave 6 inventory markdown exists', () => {
    expect(
      existsSync(
        join(
          REPO_ROOT,
          'docs/project/version-3/wave-6/v3-l01-s01-live-capital-policy-inventory.md',
        ),
      ),
    ).toBe(true);
  });

  it('V2 anchors unchanged relative to inventory binding findings', () => {
    expect(V2_READINESS.liveCapitalAuthorized).toBe(
      V3_L01_S01_BINDING_FINDINGS.liveCapitalAuthorized,
    );
    expect(V3_L01_S01_BINDING_FINDINGS.liveCapitalAuthorized).toBe(false);
    expect(V3_L01_S01_BINDING_FINDINGS.paperFreezePreserved).toBe(true);
  });
});

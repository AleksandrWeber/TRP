import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W3_O05_A_ALLOWED_OWNERS,
  W3_O05_A_ARCHITECTURE_CLAIMS,
  W3_O05_A_ARTIFACT_KINDS,
  W3_O05_A_BINDING_FINDINGS,
  W3_O05_A_DEPENDENCY_DIRECTIONS,
  W3_O05_A_DURABILITY_CLASSES,
  W3_O05_A_EXPLICIT_OUT,
  W3_O05_A_MONITORING_INVENTORY,
  W3_O05_A_REQUIRED_ARTIFACT_KINDS,
  W3_O05_A_SLICE_ID,
  W3_O05_A_SUBSTRATE_OWNERS,
  artifactIds,
  rowsByKind,
  rowsDependencies,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsMonitoringEphemeral,
  rowsMonitoringSurvive,
  rowsPaperProduct,
  rowsSecurityHealthEphemeral,
  rowsSecurityHealthSurvive,
  rowsSurvive,
} from './w3-o05-a-monitoring-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W3-O05-a monitoring inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W3_O05_A_MONITORING_INVENTORY.map((row) => row.kind));
    for (const kind of W3_O05_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W3_O05_A_ARTIFACT_KINDS).toEqual([...W3_O05_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification fields', () => {
    for (const row of W3_O05_A_MONITORING_INVENTORY) {
      expect(W3_O05_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W3_O05_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW3O05Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.authorizesMonitoringComplete).toBe(false);
      if (row.kind === 'dependency') {
        expect(W3_O05_A_DEPENDENCY_DIRECTIONS).toContain(row.dependencyDirection);
      }
    }
  });

  it('ownership consistency: substrate owners stay on existing monitoring set', () => {
    const ownership = rowsByKind('ownership');
    expect(ownership.length).toBeGreaterThanOrEqual(4);
    for (const row of ownership) {
      expect(W3_O05_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
  });

  it('ownership consistency: every owner is in the allowed set', () => {
    for (const row of W3_O05_A_MONITORING_INVENTORY) {
      expect(W3_O05_A_ALLOWED_OWNERS).toContain(row.owner);
    }
  });

  it('distinction consistency: Monitoring ≠ Platform / SIEM / SOC / BC/HA/DR / Live / Wave 3', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-monitoring-not-platform')).toBe(true);
    expect(ids.has('honesty-monitoring-not-observability-platform')).toBe(true);
    expect(ids.has('honesty-monitoring-not-siem-soc')).toBe(true);
    expect(ids.has('honesty-monitoring-not-incident-management')).toBe(true);
    expect(ids.has('honesty-monitoring-not-bc-ha-dr')).toBe(true);
    expect(ids.has('honesty-monitoring-not-live-trading')).toBe(true);
    expect(ids.has('honesty-monitoring-not-wave3-complete')).toBe(true);
    expect(ids.has('honesty-security-health-not-security-platform')).toBe(true);
    expect(ids.has('honesty-security-health-not-secops')).toBe(true);
    expect(ids.has('honesty-readiness-not-monitoring')).toBe(true);
    for (const row of honesty) {
      expect(row.authorizesMonitoringComplete).toBe(false);
    }
  });

  it('honesty: no row authorizes Monitoring Complete; monitoring does not survive restart from slice a', () => {
    expect(W3_O05_A_BINDING_FINDINGS.monitoringCompleteAuthorized).toBe(false);
    expect(W3_O05_A_BINDING_FINDINGS.monitoringSurvivesRestartAfterSliceA).toBe(false);
    expect(W3_O05_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W3_O05_A_BINDING_FINDINGS.securityHealthDashboardExists).toBe(false);
    expect(W3_O05_A_BINDING_FINDINGS.operatorIncidentUiExists).toBe(false);
    expect(W3_O05_A_BINDING_FINDINGS.platformReadinessUiExists).toBe(true);
    expect(W3_O05_A_BINDING_FINDINGS.runtimeHealthEndpointExists).toBe(true);
    expect(W3_O05_A_BINDING_FINDINGS.inactiveMonitoringPersistence).toBe(false);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(W3_O05_A_MONITORING_INVENTORY.length);
  });

  it('monitoring and security health SURVIVE/EPHEMERAL subsets are documented', () => {
    expect(rowsMonitoringSurvive().length).toBeGreaterThan(0);
    expect(rowsMonitoringEphemeral().length).toBeGreaterThan(0);
    expect(rowsSecurityHealthSurvive().length).toBeGreaterThan(0);
    expect(rowsSecurityHealthEphemeral().length).toBeGreaterThan(0);
    for (const row of [...rowsMonitoringSurvive(), ...rowsSecurityHealthSurvive()]) {
      expect(row.durabilityClass).toBe('SURVIVE');
      expect(row.authorizesMonitoringComplete).toBe(false);
    }
  });

  it('dependencies cover consumes, produces, depends-on, observed-by, and blocked-by', () => {
    for (const direction of W3_O05_A_DEPENDENCY_DIRECTIONS) {
      expect(rowsDependencies(direction).length).toBeGreaterThan(0);
    }
  });

  it('commands include runtime health, readiness, metrics, audit timeline, live health', () => {
    const commands = rowsByKind('command');
    const ids = new Set(commands.map((row) => row.artifactId));
    expect(ids.has('cmd-get-runtime-health')).toBe(true);
    expect(ids.has('cmd-get-operational-readiness')).toBe(true);
    expect(ids.has('cmd-get-prometheus-metrics')).toBe(true);
    expect(ids.has('cmd-get-security-audit-timeline')).toBe(true);
    expect(ids.has('cmd-get-live-health')).toBe(true);
  });

  it('explicit OUT surfaces cover second platform, second incident system, Live, BC/HA/DR', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(5);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-second-monitoring-platform')).toBe(true);
    expect(ids.has('out-second-incident-system')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-bc-ha-dr-products')).toBe(true);
    expect(ids.has('adjacent-w3-o04-kill-switch-foundation')).toBe(true);
  });

  it('paper product gap rows: missing security dashboard and incident UI', () => {
    const paper = rowsPaperProduct();
    expect(paper.length).toBeGreaterThan(0);
    const dashboard = paper.find((row) => row.artifactId === 'ui-security-health-dashboard');
    expect(dashboard?.existsToday).toBe(false);
    expect(dashboard?.durabilityClass).toBe('EPHEMERAL');
    const incidents = paper.find((row) => row.artifactId === 'ui-security-incident-visibility');
    expect(incidents?.existsToday).toBe(false);
  });
});

describe('W3-O05-a monitoring inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W3_O05_A_SLICE_ID).toBe('W3-O05-a');
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.newMonitoringPlatform).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.newIncidentSystem).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.monitoringCompleteClaimed).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.monitoringSurvivesRestart).toBe(false);
    expect(W3_O05_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–2 / O01–O04 unchanged', () => {
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.w3O01Redesigned).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.w3O02Redesigned).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.w3O03Redesigned).toBe(false);
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.w3O04Redesigned).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no second monitoring platform / incident system / persistence owner', () => {
    expect(W3_O05_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    expect(W3_O05_A_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'second-monitoring-platform',
        'second-incident-system',
        'new-persistence-owner',
        'new-bounded-context',
        'monitoring-implementation',
        'w3-o05-b',
      ]),
    );
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W3_O05_A_MONITORING_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });

  it('required reports exist for W3-O05-a', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o05-a-monitoring-inventory.md',
      'w3-o05-a-implementation-report.md',
      'w3-o05-a-architecture-review.md',
      'w3-o05-a-security-review.md',
      'w3-o05-a-product-review.md',
      'w3-o05-a-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});

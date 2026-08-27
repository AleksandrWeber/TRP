import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W3_O04_A_ALLOWED_OWNERS,
  W3_O04_A_ARCHITECTURE_CLAIMS,
  W3_O04_A_ARTIFACT_KINDS,
  W3_O04_A_BINDING_FINDINGS,
  W3_O04_A_DEPENDENCY_DIRECTIONS,
  W3_O04_A_DURABILITY_CLASSES,
  W3_O04_A_EXPLICIT_OUT,
  W3_O04_A_KILL_SWITCH_INVENTORY,
  W3_O04_A_REQUIRED_ARTIFACT_KINDS,
  W3_O04_A_SLICE_ID,
  W3_O04_A_SUBSTRATE_OWNERS,
  artifactIds,
  rowsByKind,
  rowsDependencies,
  rowsEphemeral,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsPaperProduct,
  rowsSurvive,
} from './w3-o04-a-kill-switch-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W3-O04-a kill switch inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W3_O04_A_KILL_SWITCH_INVENTORY.map((row) => row.kind));
    for (const kind of W3_O04_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W3_O04_A_ARTIFACT_KINDS).toEqual([...W3_O04_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification fields', () => {
    for (const row of W3_O04_A_KILL_SWITCH_INVENTORY) {
      expect(W3_O04_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W3_O04_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW3O04Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.authorizesKillSwitchComplete).toBe(false);
      if (row.kind === 'dependency') {
        expect(W3_O04_A_DEPENDENCY_DIRECTIONS).toContain(row.dependencyDirection);
      }
    }
  });

  it('ownership consistency: substrate owners stay on existing Session / CC / Trading Session set', () => {
    const ownership = rowsByKind('ownership');
    expect(ownership.length).toBeGreaterThanOrEqual(3);
    for (const row of ownership) {
      if (row.artifactId.startsWith('own-')) {
        expect([
          'trading-session',
          'command-center',
          'live-trading-engine',
          'bot-facade',
        ]).toContain(row.owner);
      }
    }
    expect(W3_O04_A_SUBSTRATE_OWNERS).toEqual(
      expect.arrayContaining(['trading-session', 'command-center', 'live-trading-engine']),
    );
  });

  it('ownership consistency: every owner is in the allowed set', () => {
    for (const row of W3_O04_A_KILL_SWITCH_INVENTORY) {
      expect(W3_O04_A_ALLOWED_OWNERS).toContain(row.owner);
    }
  });

  it('distinction consistency: Kill Switch ≠ pause/stop; ≠ O05 Monitoring; ≠ Wave 6 Live', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-kill-switch-not-live-trading')).toBe(true);
    expect(ids.has('honesty-kill-switch-not-monitoring')).toBe(true);
    expect(ids.has('honesty-pause-stop-not-kill-switch')).toBe(true);
    expect(ids.has('honesty-kill-switch-not-wave3-complete')).toBe(true);
    for (const row of honesty) {
      expect(row.authorizesKillSwitchComplete).toBe(false);
    }
  });

  it('distinction consistency: W3-O01 / W3-O02 / W3-O03 alone do not Close Kill Switch', () => {
    const out = rowsExplicitOut();
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('adjacent-w3-o01-analytical-stores')).toBe(true);
    expect(ids.has('adjacent-w3-o02-notification-queue')).toBe(true);
    expect(ids.has('adjacent-w3-o03-recovery-stance')).toBe(true);
    for (const row of out) {
      expect(row.authorizesKillSwitchComplete).toBe(false);
    }
  });

  it('honesty: no row authorizes Kill Switch Complete; platform does not survive restart from slice a', () => {
    expect(W3_O04_A_BINDING_FINDINGS.killSwitchCompleteAuthorized).toBe(false);
    expect(W3_O04_A_BINDING_FINDINGS.platformSurvivesRestartAfterSliceA).toBe(false);
    expect(W3_O04_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W3_O04_A_BINDING_FINDINGS.paperKillSwitchSurvivesRestart).toBe(true);
    expect(W3_O04_A_BINDING_FINDINGS.paperKillSwitchRestartRecoveryExists).toBe(true);
    expect(W3_O04_A_BINDING_FINDINGS.paperKillSwitchOperationalContinuityExists).toBe(true);
    expect(W3_O04_A_BINDING_FINDINGS.platformSurvivesRestartAfterSliceA).toBe(false);
    expect(W3_O04_A_BINDING_FINDINGS.paperAdmissionBlocksWhileArmed).toBe(false);
    expect(W3_O04_A_BINDING_FINDINGS.inactivePolicyStub).toBe(true);
    expect(W3_O04_A_BINDING_FINDINGS.emergencyControlsUnavailable).toBe(true);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(W3_O04_A_KILL_SWITCH_INVENTORY.length);
  });

  it('dependencies cover consumes, produces, depends-on, and blocked-by', () => {
    for (const direction of W3_O04_A_DEPENDENCY_DIRECTIONS) {
      expect(rowsDependencies(direction).length).toBeGreaterThan(0);
    }
  });

  it('commands include live REST and paper emergency stubs', () => {
    const commands = rowsByKind('command');
    const ids = new Set(commands.map((row) => row.artifactId));
    expect(ids.has('cmd-activate-kill-switch-live')).toBe(true);
    expect(ids.has('cmd-emergency-stop-paper')).toBe(true);
    expect(
      commands.find((row) => row.artifactId === 'cmd-emergency-stop-paper')?.durabilityClass,
    ).toBe('EPHEMERAL');
  });

  it('paper product durable state rows exist after W3-O04-b', () => {
    const paper = rowsPaperProduct();
    expect(paper.length).toBeGreaterThan(0);
    const armed = paper.find((row) => row.artifactId === 'state-paper-kill-switch-armed');
    expect(armed?.existsToday).toBe(true);
    expect(armed?.durabilityClass).toBe('SURVIVE');
    const persist = paper.find((row) => row.artifactId === 'persist-paper-session-kill-switch');
    expect(persist?.existsToday).toBe(true);
    expect(W3_O04_A_BINDING_FINDINGS.paperKillSwitchPersistenceExists).toBe(true);
    expect(W3_O04_A_BINDING_FINDINGS.paperKillSwitchStateMissing).toBe(false);
  });

  it('explicit OUT surfaces cover Monitoring, Live Trading, BC/HA/DR, second engine', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(5);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-w3-o05-monitoring')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-bc-ha-dr-products')).toBe(true);
    expect(ids.has('out-second-kill-switch-engine')).toBe(true);
  });
});

describe('W3-O04-a kill switch inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W3_O04_A_SLICE_ID).toBe('W3-O04-a');
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.newKillSwitchEngine).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.newRuntimeController).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.killSwitchCompleteClaimed).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.platformSurvivesRestart).toBe(false);
    expect(W3_O04_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–2 / O01–O03 unchanged', () => {
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.w3O01Redesigned).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.w3O02Redesigned).toBe(false);
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.w3O03Redesigned).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no second Kill Switch engine / runtime controller / persistence owner', () => {
    expect(W3_O04_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    expect(W3_O04_A_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'second-kill-switch-engine',
        'second-runtime-controller',
        'new-persistence-owner',
        'new-bounded-context',
        'monitoring-product',
        'live-trading-enablement',
        'w3-o04-b',
      ]),
    );
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W3_O04_A_KILL_SWITCH_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });

  it('required reports exist for W3-O04-a', () => {
    const wave3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');
    for (const name of [
      'w3-o04-a-kill-switch-inventory.md',
      'w3-o04-a-implementation-report.md',
      'w3-o04-a-architecture-review.md',
      'w3-o04-a-security-review.md',
      'w3-o04-a-product-review.md',
      'w3-o04-a-validation-report.md',
    ]) {
      expect(existsSync(join(wave3, name))).toBe(true);
    }
  });
});

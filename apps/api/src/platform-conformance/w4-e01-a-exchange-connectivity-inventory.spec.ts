import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  W4_E01_A_ALLOWED_OWNERS,
  W4_E01_A_ARCHITECTURE_CLAIMS,
  W4_E01_A_ARTIFACT_KINDS,
  W4_E01_A_BINDING_FINDINGS,
  W4_E01_A_DEPENDENCY_DIRECTIONS,
  W4_E01_A_DURABILITY_CLASSES,
  W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY,
  W4_E01_A_EXPLICIT_OUT,
  W4_E01_A_REQUIRED_ARTIFACT_KINDS,
  W4_E01_A_SLICE_ID,
  W4_E01_A_SUBSTRATE_OWNERS,
  artifactIds,
  rowsByKind,
  rowsDependencies,
  rowsEphemeral,
  rowsExchangeConnectivityEphemeral,
  rowsExchangeConnectivitySurvive,
  rowsExplicitOut,
  rowsHonestyBoundaries,
  rowsPaperProduct,
  rowsSurvive,
} from './w4-e01-a-exchange-connectivity-inventory';

const REPO_ROOT = join(__dirname, '../../../..');

describe('W4-E01-a exchange connectivity inventory — unit', () => {
  it('inventory completeness: every required artifact kind appears', () => {
    const kinds = new Set(W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY.map((row) => row.kind));
    for (const kind of W4_E01_A_REQUIRED_ARTIFACT_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
    expect(W4_E01_A_ARTIFACT_KINDS).toEqual([...W4_E01_A_REQUIRED_ARTIFACT_KINDS]);
  });

  it('inventory completeness: artifact ids are unique and non-empty', () => {
    const ids = artifactIds();
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('inventory completeness: every row has required classification fields', () => {
    for (const row of W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY) {
      expect(W4_E01_A_ALLOWED_OWNERS).toContain(row.owner);
      expect(W4_E01_A_DURABILITY_CLASSES).toContain(row.durabilityClass);
      expect(row.currentStatus.length).toBeGreaterThan(0);
      expect(row.honestyRequirement.length).toBeGreaterThan(10);
      expect(row.futureW4E01Responsibility.length).toBeGreaterThan(0);
      expect(row.evidencePath.length).toBeGreaterThan(0);
      expect(row.authorizesExchangeConnectivityComplete).toBe(false);
      if (row.kind === 'dependency') {
        expect(W4_E01_A_DEPENDENCY_DIRECTIONS).toContain(row.dependencyDirection);
      }
    }
  });

  it('ownership consistency: substrate owners stay on existing exchange set', () => {
    const ownership = rowsByKind('ownership');
    expect(ownership.length).toBeGreaterThanOrEqual(4);
    for (const row of ownership) {
      expect(W4_E01_A_SUBSTRATE_OWNERS).toContain(row.owner);
    }
  });

  it('ownership consistency: every owner is in the allowed set', () => {
    for (const row of W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY) {
      expect(W4_E01_A_ALLOWED_OWNERS).toContain(row.owner);
    }
  });

  it('distinction consistency: Connected ≠ Live Trading / handshake ≠ adapter Complete / public data ≠ Connected', () => {
    const honesty = rowsHonestyBoundaries();
    const ids = new Set(honesty.map((row) => row.artifactId));
    expect(ids.has('honesty-connected-not-live-trading')).toBe(true);
    expect(ids.has('honesty-connected-requires-round-trip')).toBe(true);
    expect(ids.has('honesty-handshake-not-adapter-complete')).toBe(true);
    expect(ids.has('honesty-public-market-data-not-connected')).toBe(true);
    expect(ids.has('honesty-e01-not-wave4-complete')).toBe(true);
    expect(ids.has('honesty-no-engine-clone')).toBe(true);
    for (const row of honesty) {
      expect(row.authorizesExchangeConnectivityComplete).toBe(false);
    }
  });

  it('honesty: no row authorizes Exchange Connectivity Complete; connectivity does not survive restart from slice a', () => {
    expect(W4_E01_A_BINDING_FINDINGS.exchangeConnectivityCompleteAuthorized).toBe(false);
    expect(W4_E01_A_BINDING_FINDINGS.exchangeConnectivitySurvivesRestartAfterSliceA).toBe(false);
    expect(W4_E01_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
    expect(W4_E01_A_BINDING_FINDINGS.binanceAdapterRealIoExists).toBe(false);
    expect(W4_E01_A_BINDING_FINDINGS.connectionManagementRealHandshakeExists).toBe(true);
    expect(W4_E01_A_BINDING_FINDINGS.stubAdapterSimulatedConnectExists).toBe(true);
  });

  it('classification: SURVIVE vs EPHEMERAL partitions are non-empty and exclusive', () => {
    const survive = rowsSurvive();
    const ephemeral = rowsEphemeral();
    expect(survive.length).toBeGreaterThan(0);
    expect(ephemeral.length).toBeGreaterThan(0);
    expect(survive.length + ephemeral.length).toBe(W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY.length);
  });

  it('exchange connectivity SURVIVE/EPHEMERAL subsets are documented', () => {
    expect(rowsExchangeConnectivitySurvive().length).toBeGreaterThan(0);
    expect(rowsExchangeConnectivityEphemeral().length).toBeGreaterThan(0);
    for (const row of [
      ...rowsExchangeConnectivitySurvive(),
      ...rowsExchangeConnectivityEphemeral(),
    ]) {
      expect(row.authorizesExchangeConnectivityComplete).toBe(false);
    }
  });

  it('dependencies cover consumes, produces, depends-on, observed-by, and blocked-by', () => {
    for (const direction of W4_E01_A_DEPENDENCY_DIRECTIONS) {
      expect(rowsDependencies(direction).length).toBeGreaterThan(0);
    }
  });

  it('REST and WebSocket command surfaces are catalogued', () => {
    const commands = rowsByKind('command');
    const ids = new Set(commands.map((row) => row.artifactId));
    expect(ids.has('rest-binance-api-restrictions-handshake')).toBe(true);
    expect(ids.has('rest-connections-validate')).toBe(true);
    expect(ids.has('rest-exchanges-connect')).toBe(true);
    expect(ids.has('ws-binance-public-combined-stream')).toBe(true);
    expect(ids.has('ws-venue-adapter-subscribe-stubs')).toBe(true);
    expect(ids.has('ws-binance-authenticated-user-data')).toBe(true);
  });

  it('explicit OUT surfaces cover REST/WS implementation, engine clone, Live, E02–E05', () => {
    const out = rowsExplicitOut();
    expect(out.length).toBeGreaterThanOrEqual(5);
    const ids = new Set(out.map((row) => row.artifactId));
    expect(ids.has('out-rest-implementation-slice-a')).toBe(true);
    expect(ids.has('out-websocket-implementation-slice-a')).toBe(true);
    expect(ids.has('out-engine-clone-per-venue')).toBe(true);
    expect(ids.has('out-live-trading-wave6')).toBe(true);
    expect(ids.has('out-bybit-okx-kraken-e02-e04')).toBe(true);
  });

  it('paper product gap rows: stub adapter and missing honest Connected labels', () => {
    const paper = rowsPaperProduct();
    expect(paper.length).toBeGreaterThan(0);
    const stub = paper.find(
      (row) => row.artifactId === 'runtime-binance-adapter-stub-connected-flag',
    );
    expect(stub?.existsToday).toBe(true);
    expect(stub?.durabilityClass).toBe('EPHEMERAL');
    const labels = paper.find((row) => row.artifactId === 'ui-honest-connected-label-product');
    expect(labels?.existsToday).toBe(false);
  });
});

describe('W4-E01-a exchange connectivity inventory — integration / planning', () => {
  it('planning consistency: slice id and architecture claims remain inventory-only', () => {
    expect(W4_E01_A_SLICE_ID).toBe('W4-E01-a');
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.newPersistenceOwner).toBe(false);
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.newBoundedContext).toBe(false);
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.duplicateExchangeSubsystem).toBe(false);
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.engineClonePerVenue).toBe(false);
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.ownershipBoundariesChanged).toBe(false);
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.exchangeConnectivityCompleteClaimed).toBe(false);
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.customerVisibleFeature).toBe(false);
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.exchangeConnectivitySurvivesRestart).toBe(false);
    expect(W4_E01_A_BINDING_FINDINGS.customerVisibleFeatureFromSliceA).toBe(false);
  });

  it('master plan consistency: inventory claims leave Master Plan / V2 / Wave 1–3 unchanged', () => {
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.masterPlanModified).toBe(false);
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.version2Redesigned).toBe(false);
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.wave1Modified).toBe(false);
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.wave2Modified).toBe(false);
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.wave3Modified).toBe(false);
    expect(existsSync(join(REPO_ROOT, 'docs/project/version-3/version-3-master-plan.md'))).toBe(
      true,
    );
  });

  it('architecture consistency: no duplicate exchange subsystem / persistence owner / engine clone', () => {
    expect(W4_E01_A_ARCHITECTURE_CLAIMS.newSourceOfTruth).toBe(false);
    expect(W4_E01_A_EXPLICIT_OUT).toEqual(
      expect.arrayContaining([
        'rest-implementation',
        'websocket-implementation',
        'new-persistence-owner',
        'new-bounded-context',
        'engine-clone',
        'w4-e01-b',
        'exchange-connectivity-complete',
      ]),
    );
  });

  it('architecture consistency: evidence paths exist on disk', () => {
    for (const row of W4_E01_A_EXCHANGE_CONNECTIVITY_INVENTORY) {
      expect(existsSync(join(REPO_ROOT, row.evidencePath))).toBe(true);
    }
  });

  it('required reports exist for W4-E01-a', () => {
    const wave4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');
    for (const name of [
      'w4-e01-a-exchange-connectivity-inventory.md',
      'w4-e01-a-implementation-report.md',
      'w4-e01-a-architecture-review.md',
      'w4-e01-a-security-review.md',
      'w4-e01-a-product-review.md',
      'w4-e01-a-validation-report.md',
    ]) {
      expect(existsSync(join(wave4, name))).toBe(true);
    }
  });
});

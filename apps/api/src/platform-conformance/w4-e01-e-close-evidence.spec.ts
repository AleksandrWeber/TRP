import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import { W4_E01_A_ARCHITECTURE_CLAIMS } from './w4-e01-a-exchange-connectivity-inventory';
import { W4_E01_B_ARCHITECTURE_CLAIMS } from './w4-e01-b-durable-exchange-connectivity';
import { W4_E01_C_ARCHITECTURE_CLAIMS } from './w4-e01-c-restart-recovery';
import { W4_E01_D_ARCHITECTURE_CLAIMS } from './w4-e01-d-operational-continuity';
import {
  buildCloseEvidenceDiagnostics,
  transitionSafetyAnswers,
  verifyArchitectureIntegrity,
  verifyGovernanceIntegrity,
  verifyHonestProduct,
  verifyOperationalChain,
  W4_E01_E_APPROVED_SLICES,
  W4_E01_E_ARCHITECTURE_CLAIMS,
  W4_E01_E_BINDING_FINDINGS,
  W4_E01_E_CAPABILITY_EVOLUTION,
  W4_E01_E_EXCHANGE_CONNECTIVITY_OWNER,
  W4_E01_E_INTEGRITY_NON_EXPANSION,
  W4_E01_E_OPERATIONAL_MATURITY,
  W4_E01_E_REQUIRED_REPORTS,
  W4_E01_E_REQUIRED_SLICE_REPORTS,
  W4_E01_E_SLICE_ID,
  W4_E01_E_TECHNICAL_DEBT_DELTA,
  W4_E01_E_TRANSITION_MATRIX,
} from './w4-e01-e-close-evidence';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE4 = join(REPO_ROOT, 'docs/project/version-3/wave-4');

function readWave4(name: string): string {
  return readFileSync(join(WAVE4, name), 'utf8');
}

describe('W4-E01-e package close evidence — unit', () => {
  it('approved slices a–d recorded PASS for validation / architecture / security / product', () => {
    expect(W4_E01_E_SLICE_ID).toBe('W4-E01-e');
    expect(W4_E01_E_EXCHANGE_CONNECTIVITY_OWNER).toBe('exchange-adapter');
    expect(W4_E01_E_APPROVED_SLICES.map((s) => s.id)).toEqual([
      'W4-E01-a',
      'W4-E01-b',
      'W4-E01-c',
      'W4-E01-d',
    ]);
    expect(
      W4_E01_E_APPROVED_SLICES.every(
        (s) =>
          s.validation === 'PASS' &&
          s.architecture === 'PASS' &&
          s.security === 'PASS' &&
          s.product === 'PASS',
      ),
    ).toBe(true);
  });

  it('complete operational journey works', () => {
    const chain = verifyOperationalChain();
    expect(chain.ok).toBe(true);
    expect(chain.inventoryOk).toBe(true);
    expect(chain.persistenceOk).toBe(true);
    expect(chain.recoveryOk).toBe(true);
    expect(chain.continuityOk).toBe(true);
    expect(chain.platformReadinessOk).toBe(true);
    expect(chain.steps.length).toBe(6);
    expect(W4_E01_E_BINDING_FINDINGS.operationalJourneyWorks).toBe(true);
  });

  it('Honest Product enforcement intact', () => {
    const honest = verifyHonestProduct();
    expect(honest.ok).toBe(true);
    expect(honest.operationalContinuityNotRestIo).toBe(true);
    expect(honest.restartRecoveryNotProductionReady).toBe(true);
    expect(honest.stubAdapterNotRealIo).toBe(true);
    expect(honest.exchangeConnectivityCompleteNotAuthorized).toBe(true);
    expect(honest.binanceConnectedNotClaimed).toBe(true);
    expect(W4_E01_E_BINDING_FINDINGS.honestProductEnforcementIntact).toBe(true);
  });

  it('governance: exchange-adapter sole owner; no second engine / persistence', () => {
    const gov = verifyGovernanceIntegrity();
    expect(gov.ok).toBe(true);
    expect(gov.exchangeAdapterSoleOwner).toBe(true);
    expect(gov.noSecondExchangeConnectivityEngine).toBe(true);
    expect(gov.noSecondPersistenceOwner).toBe(true);
    expect(gov.platformReadinessHonest).toBe(true);
  });

  it('ownership and architecture integrity hold across a–e', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noNewBoundedContext).toBe(true);
    expect(arch.noNewSourceOfTruth).toBe(true);
    expect(arch.masterPlanUnchanged).toBe(true);
    expect(arch.version2Unchanged).toBe(true);
    expect(W4_E01_E_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W4_E01_E_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('this slice does not declare package CLOSED, Exchange Connectivity Complete, or Wave 4 COMPLETE', () => {
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.exchangeConnectivityCompleteClaimed).toBe(false);
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.binanceConnectedClaimed).toBe(false);
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.wave4DeclaredComplete).toBe(false);
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.w4E02Opened).toBe(false);
    expect(W4_E01_E_BINDING_FINDINGS.packageDeclaredClosed).toBe(false);
    const diagnostics = buildCloseEvidenceDiagnostics();
    expect(diagnostics.packageDeclaredClosed).toBe(false);
  });
});

describe('W4-E01-e package close evidence — integration / planning', () => {
  it('transition safety answers hold', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.version2Unchanged).toBe(true);
    expect(answers.wave1Unchanged).toBe(true);
    expect(answers.wave2Unchanged).toBe(true);
    expect(answers.wave3Unchanged).toBe(true);
    expect(answers.packageNotDeclaredClosed).toBe(true);
    expect(answers.wave4NotDeclaredComplete).toBe(true);
    expect(answers.w4E02NotOpened).toBe(true);
    expect(answers.exchangeConnectivityCompleteNotClaimed).toBe(true);
    expect(answers.binanceConnectedNotClaimed).toBe(true);
    expect(answers.productionReadyNotClaimed).toBe(true);
    for (const claims of [
      W4_E01_A_ARCHITECTURE_CLAIMS,
      W4_E01_B_ARCHITECTURE_CLAIMS,
      W4_E01_C_ARCHITECTURE_CLAIMS,
      W4_E01_D_ARCHITECTURE_CLAIMS,
    ]) {
      expect(claims.ownershipBoundariesChanged).toBe(false);
      expect(claims.masterPlanModified).toBe(false);
      expect(claims.newPersistenceOwner).toBe(false);
      expect(claims.newBoundedContext).toBe(false);
    }
  });

  it('architecture non-claims: no new capability / no silent expansion', () => {
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.newCustomerFunctionality).toBe(false);
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.newApi).toBe(false);
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.newUi).toBe(false);
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.newPersistence).toBe(false);
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.restImplementation).toBe(false);
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.websocketImplementation).toBe(false);
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.liveTrading).toBe(false);
    expect(W4_E01_E_INTEGRITY_NON_EXPANSION).toContain('REST Implementation');
    expect(W4_E01_E_INTEGRITY_NON_EXPANSION).toContain('W4-E02 Opened');
  });

  it('product verification claims hold across c/d', () => {
    expect(W4_E01_C_ARCHITECTURE_CLAIMS.recoveryDeterministic).toBe(true);
    expect(W4_E01_C_ARCHITECTURE_CLAIMS.recoveryIdempotent).toBe(true);
    expect(W4_E01_C_ARCHITECTURE_CLAIMS.exchangeConnectivityStateRestoredAfterRestart).toBe(true);
    expect(W4_E01_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W4_E01_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W4_E01_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
    expect(OPERATIONAL_STATES).toEqual(['Recovering', 'Ready', 'Degraded', 'Unavailable']);
  });

  it('required close evidence reports exist', () => {
    for (const name of W4_E01_E_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE4, name)), name).toBe(true);
    }
    for (const name of W4_E01_E_REQUIRED_SLICE_REPORTS) {
      expect(existsSync(join(WAVE4, name)), name).toBe(true);
    }
    expect(existsSync(join(WAVE4, 'w4-e01-overview.md'))).toBe(true);
    expect(existsSync(join(WAVE4, 'w4-e01-validation-plan.md'))).toBe(true);
    expect(existsSync(join(WAVE4, 'wave-4-progress.md'))).toBe(true);
    expect(existsSync(join(WAVE4, 'w4-e01-planning-approval.md'))).toBe(true);
  });

  it('transition / maturity / capability / debt registries are complete', () => {
    expect(W4_E01_E_TRANSITION_MATRIX.before.length).toBeGreaterThan(0);
    expect(W4_E01_E_TRANSITION_MATRIX.after.length).toBeGreaterThan(0);
    expect(W4_E01_E_TRANSITION_MATRIX.stillMissing).toContain('Product Owner Package Close');
    expect(W4_E01_E_OPERATIONAL_MATURITY.after).toContain('Package Close Evidence');
    expect(W4_E01_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(/restart recovery/);
    expect(W4_E01_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(
      /without REST\/WebSocket/,
    );
    expect(W4_E01_E_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W4_E01_E_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
  });

  it('platform readiness exposes exchange connectivity continuity without Connected/REST controls', () => {
    const view = readFileSync(
      join(REPO_ROOT, 'apps/web/src/operational-continuity/OperationalContinuityView.tsx'),
      'utf8',
    );
    const api = readFileSync(join(REPO_ROOT, 'apps/web/src/shared/api.ts'), 'utf8');
    expect(api).toContain('ExchangeConnectivityContinuityView');
    expect(view).toMatch(/Exchange connectivity|exchangeConnectivity/i);
    expect(view).toContain('recoveryTimestamp');
    expect(view).toContain('connectionAnchorCount');
    expect(view).not.toMatch(/Test connection|Place order|Live Trading/i);
  });

  it('status docs: W4-E01 CLOSED by Product Owner; Wave 4 COMPLETE not claimed', () => {
    const progress = readWave4('wave-4-progress.md');
    const overview = readWave4('w4-e01-overview.md');
    const close = readWave4('w4-e01-close-package-report.md');
    const summary = readWave4('w4-e01-package-summary.md');
    const poClose = readWave4('w4-e01-product-owner-close-record.md');
    expect(progress).toMatch(/CLOSED by Product Owner|Package \*\*CLOSED\*\*/);
    expect(progress).toMatch(/W4-E01-a|W4-E01-b|W4-E01-c|W4-E01-d/);
    expect(progress).toMatch(/Close Evidence|W4-E01-e/);
    expect(progress).toMatch(/Wave 4 COMPLETE[\s\S]*Not claimed|Not claimed[\s\S]*Wave 4 COMPLETE/);
    expect(overview).toMatch(/\*\*CLOSED\*\* by Product Owner|CLOSED by Product Owner/);
    expect(overview).toMatch(/STOP/);
    expect(overview).toMatch(
      /Exchange Connectivity Complete[\s\S]*Not claimed|Not claimed[\s\S]*Exchange Connectivity Complete/i,
    );
    expect(close).toMatch(
      /Package \*\*CLOSED\*\* by Product Owner|\*\*CLOSED\*\* by Product Owner|CLOSED by Product Owner/,
    );
    expect(close).toMatch(/Wave 4 COMPLETE[\s\S]*not claimed|not claimed[\s\S]*Wave 4 COMPLETE/i);
    expect(summary).toMatch(/\*\*CLOSED\*\* by Product Owner/);
    expect(poClose).toMatch(
      /officially CLOSED|Decision:\*\* \*\*CLOSED\*\*|Decision: \*\*CLOSED\*\*/,
    );
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    // W4-E01-e registry still records that the e slice itself did not declare Close;
    // Product Owner Close is recorded in status docs.
    expect(W4_E01_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
  });

  it('slice validation reports a–d exist and record PASS', () => {
    for (const slice of ['a', 'b', 'c', 'd'] as const) {
      const report = readWave4(`w4-e01-${slice}-validation-report.md`);
      expect(report).toMatch(/PASS/);
    }
  });
});

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import { W3_O04_A_ARCHITECTURE_CLAIMS } from './w3-o04-a-kill-switch-inventory';
import { W3_O04_B_ARCHITECTURE_CLAIMS } from './w3-o04-b-durable-kill-switch-persistence';
import { W3_O04_C_ARCHITECTURE_CLAIMS } from './w3-o04-c-restart-recovery';
import { W3_O04_D_ARCHITECTURE_CLAIMS } from './w3-o04-d-operational-continuity';
import {
  buildCloseEvidenceDiagnostics,
  transitionSafetyAnswers,
  verifyArchitectureIntegrity,
  verifyGovernanceIntegrity,
  verifyHonestProduct,
  verifyOperationalChain,
  W3_O04_E_APPROVED_SLICES,
  W3_O04_E_ARCHITECTURE_CLAIMS,
  W3_O04_E_BINDING_FINDINGS,
  W3_O04_E_CAPABILITY_EVOLUTION,
  W3_O04_E_INTEGRITY_NON_EXPANSION,
  W3_O04_E_KILL_SWITCH_OWNER,
  W3_O04_E_OPERATIONAL_MATURITY,
  W3_O04_E_REQUIRED_REPORTS,
  W3_O04_E_REQUIRED_SLICE_REPORTS,
  W3_O04_E_SLICE_ID,
  W3_O04_E_TECHNICAL_DEBT_DELTA,
  W3_O04_E_TRANSITION_MATRIX,
} from './w3-o04-e-close-evidence';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');

function readWave3(name: string): string {
  return readFileSync(join(WAVE3, name), 'utf8');
}

describe('W3-O04-e package close evidence — unit', () => {
  it('approved slices a–d recorded PASS for validation / architecture / security / product', () => {
    expect(W3_O04_E_SLICE_ID).toBe('W3-O04-e');
    expect(W3_O04_E_KILL_SWITCH_OWNER).toBe('trading-session');
    expect(W3_O04_E_APPROVED_SLICES.map((s) => s.id)).toEqual([
      'W3-O04-a',
      'W3-O04-b',
      'W3-O04-c',
      'W3-O04-d',
    ]);
    expect(
      W3_O04_E_APPROVED_SLICES.every(
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
    expect(W3_O04_E_BINDING_FINDINGS.operationalJourneyWorks).toBe(true);
  });

  it('Honest Product enforcement intact', () => {
    const honest = verifyHonestProduct();
    expect(honest.ok).toBe(true);
    expect(honest.operationalContinuityNotExecution).toBe(true);
    expect(honest.restartRecoveryNotProductionRestartSafe).toBe(true);
    expect(honest.platformReadinessNotLiveTrading).toBe(true);
    expect(honest.killSwitchCompleteNotAuthorized).toBe(true);
    expect(honest.admissionNotWired).toBe(true);
    expect(W3_O04_E_BINDING_FINDINGS.honestProductEnforcementIntact).toBe(true);
  });

  it('governance: trading-session sole owner; no second engine / persistence / controller', () => {
    const gov = verifyGovernanceIntegrity();
    expect(gov.ok).toBe(true);
    expect(gov.tradingSessionSoleOwner).toBe(true);
    expect(gov.noSecondKillSwitchEngine).toBe(true);
    expect(gov.noSecondPersistenceOwner).toBe(true);
    expect(gov.noSecondRuntimeController).toBe(true);
    expect(gov.inactivePolicyStubHonest).toBe(true);
  });

  it('ownership and architecture integrity hold across a–e', () => {
    const arch = verifyArchitectureIntegrity();
    expect(arch.ok).toBe(true);
    expect(arch.ownershipUnchanged).toBe(true);
    expect(arch.noNewBoundedContext).toBe(true);
    expect(arch.noNewSourceOfTruth).toBe(true);
    expect(arch.masterPlanUnchanged).toBe(true);
    expect(arch.version2Unchanged).toBe(true);
    expect(W3_O04_E_BINDING_FINDINGS.ownershipBoundariesChanged).toBe(false);
    expect(W3_O04_E_BINDING_FINDINGS.architecturalDeviations).toBe(false);
  });

  it('this slice does not declare package CLOSED, Kill Switch COMPLETE, or Wave 3 COMPLETE', () => {
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.killSwitchCompleteClaimed).toBe(false);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.productionRestartSafeClaimed).toBe(false);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.wave3DeclaredComplete).toBe(false);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.w3O05Opened).toBe(false);
    expect(W3_O04_E_BINDING_FINDINGS.packageDeclaredClosed).toBe(false);
    const diagnostics = buildCloseEvidenceDiagnostics();
    expect(diagnostics.packageDeclaredClosed).toBe(false);
  });
});

describe('W3-O04-e package close evidence — integration / planning', () => {
  it('transition safety answers hold', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.version2Unchanged).toBe(true);
    expect(answers.wave1Unchanged).toBe(true);
    expect(answers.wave2Unchanged).toBe(true);
    expect(answers.packageNotDeclaredClosed).toBe(true);
    expect(answers.wave3NotDeclaredComplete).toBe(true);
    expect(answers.w3O05NotOpened).toBe(true);
    expect(answers.killSwitchCompleteNotClaimed).toBe(true);
    expect(answers.productionRestartSafeNotClaimed).toBe(true);
    for (const claims of [
      W3_O04_A_ARCHITECTURE_CLAIMS,
      W3_O04_B_ARCHITECTURE_CLAIMS,
      W3_O04_C_ARCHITECTURE_CLAIMS,
      W3_O04_D_ARCHITECTURE_CLAIMS,
    ]) {
      expect(claims.ownershipBoundariesChanged).toBe(false);
      expect(claims.masterPlanModified).toBe(false);
      expect(claims.newPersistenceOwner).toBe(false);
      expect(claims.newBoundedContext).toBe(false);
      expect(claims.newKillSwitchEngine).toBe(false);
    }
  });

  it('architecture non-claims: no new capability / no silent expansion', () => {
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.newCustomerFunctionality).toBe(false);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.newApi).toBe(false);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.newUi).toBe(false);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.newPersistence).toBe(false);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.killSwitchExecutionImplemented).toBe(false);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.commandCenterControls).toBe(false);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.admissionPolicyWired).toBe(false);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.monitoringPlatform).toBe(false);
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.liveTrading).toBe(false);
    expect(W3_O04_E_INTEGRITY_NON_EXPANSION).toContain('Kill Switch Execution');
    expect(W3_O04_E_INTEGRITY_NON_EXPANSION).toContain('W3-O05 Opened');
  });

  it('product verification claims hold across c/d', () => {
    expect(W3_O04_C_ARCHITECTURE_CLAIMS.recoveryDeterministic).toBe(true);
    expect(W3_O04_C_ARCHITECTURE_CLAIMS.recoveryIdempotent).toBe(true);
    expect(W3_O04_C_ARCHITECTURE_CLAIMS.killSwitchStateRestoredAfterRestart).toBe(true);
    expect(W3_O04_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W3_O04_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W3_O04_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
    expect(OPERATIONAL_STATES).toEqual(['Recovering', 'Ready', 'Degraded', 'Unavailable']);
  });

  it('required close evidence reports exist', () => {
    for (const name of W3_O04_E_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE3, name)), name).toBe(true);
    }
    for (const name of W3_O04_E_REQUIRED_SLICE_REPORTS) {
      expect(existsSync(join(WAVE3, name)), name).toBe(true);
    }
    expect(existsSync(join(WAVE3, 'durable-kill-switch-overview.md'))).toBe(true);
    expect(existsSync(join(WAVE3, 'w3-o04-validation-plan.md'))).toBe(true);
    expect(existsSync(join(WAVE3, 'wave-3-progress.md'))).toBe(true);
    expect(existsSync(join(WAVE3, 'operational-state-matrix.md'))).toBe(true);
  });

  it('transition / maturity / capability / debt registries are complete', () => {
    expect(W3_O04_E_TRANSITION_MATRIX.before.length).toBeGreaterThan(0);
    expect(W3_O04_E_TRANSITION_MATRIX.after.length).toBeGreaterThan(0);
    expect(W3_O04_E_TRANSITION_MATRIX.stillMissing).toContain(
      'Product Owner Package Close declaration',
    );
    expect(W3_O04_E_OPERATIONAL_MATURITY.after).toContain('Package Close Evidence');
    expect(W3_O04_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(/restart recovery/);
    expect(W3_O04_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(
      /without Kill Switch execution/,
    );
    expect(W3_O04_E_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W3_O04_E_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
  });

  it('platform readiness exposes kill switch continuity without arm/clear controls', () => {
    const view = readFileSync(
      join(REPO_ROOT, 'apps/web/src/operational-continuity/OperationalContinuityView.tsx'),
      'utf8',
    );
    const api = readFileSync(join(REPO_ROOT, 'apps/web/src/shared/api.ts'), 'utf8');
    expect(api).toContain('KillSwitchContinuityView');
    expect(view).toMatch(/Kill switch|killSwitch/i);
    expect(view).toContain('recoveryTimestamp');
    expect(view).toContain('armedCount');
    expect(view).not.toMatch(/Arm kill switch|Command Center|Admission block/i);
  });

  it('status docs: W3-O04 CLOSED by Product Owner; Wave 3 COMPLETE and O05 implementation not opened', () => {
    const progress = readWave3('wave-3-progress.md');
    const overview = readWave3('durable-kill-switch-overview.md');
    const close = readWave3('w3-o04-close-package-report.md');
    const summary = readWave3('w3-o04-package-summary.md');
    const poClose = readWave3('w3-o04-product-owner-close-record.md');
    expect(progress).toMatch(/CLOSED by Product Owner|Package \*\*CLOSED\*\*/);
    expect(progress).toMatch(/Wave 3 COMPLETE[\s\S]*Not claimed|Not claimed[\s\S]*Wave 3 COMPLETE/);
    expect(progress).toMatch(/W3-O05/);
    expect(progress).toMatch(/Not opened|not opened|Awaiting W3-O05-a/i);
    expect(progress).toMatch(/Close Evidence|W3-O04-e/);
    expect(overview).toMatch(/\*\*CLOSED\*\* by Product Owner|CLOSED by Product Owner/);
    expect(overview).toMatch(/STOP/);
    expect(overview).toMatch(/Kill Switch Complete[\s\S]*\*\*Not claimed\*\*/);
    expect(close).toMatch(
      /Package \*\*CLOSED\*\* by Product Owner|\*\*CLOSED\*\* by Product Owner|CLOSED by Product Owner/,
    );
    expect(close).toMatch(
      /Wave 3 is \*\*NOT\*\* declared COMPLETE|Wave 3 is \*\*NOT\*\*|NOT.*Wave 3 COMPLETE/i,
    );
    expect(close).toMatch(
      /W3-O05.*NOT.*opened|NOT.*opened.*W3-O05|implementation is \*\*NOT\*\* opened/i,
    );
    expect(summary).toMatch(/\*\*CLOSED\*\* by Product Owner/);
    expect(poClose).toMatch(
      /officially CLOSED|Decision:\*\* \*\*CLOSED\*\*|Decision: \*\*CLOSED\*\*/,
    );
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    // W3-O04-e registry still records that the e slice itself did not declare Close;
    // Product Owner Close is recorded in status docs.
    expect(W3_O04_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
  });

  it('slice validation reports a–d exist and record PASS', () => {
    for (const slice of ['a', 'b', 'c', 'd'] as const) {
      const report = readWave3(`w3-o04-${slice}-validation-report.md`);
      expect(report).toMatch(/PASS/);
    }
  });
});

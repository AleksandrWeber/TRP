import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import { W3_O02_A_ARCHITECTURE_CLAIMS } from './w3-o02-a-notification-queue-inventory';
import { W3_O02_B_ARCHITECTURE_CLAIMS } from './w3-o02-b-durable-queue-persistence';
import { W3_O02_C_ARCHITECTURE_CLAIMS } from './w3-o02-c-restart-recovery';
import { W3_O02_D_ARCHITECTURE_CLAIMS } from './w3-o02-d-operational-continuity';
import {
  transitionSafetyAnswers,
  W3_O02_E_APPROVED_SLICES,
  W3_O02_E_ARCHITECTURE_CLAIMS,
  W3_O02_E_CAPABILITY_EVOLUTION,
  W3_O02_E_INTEGRITY_NON_EXPANSION,
  W3_O02_E_OPERATIONAL_MATURITY,
  W3_O02_E_QUEUE_OWNER,
  W3_O02_E_REQUIRED_REPORTS,
  W3_O02_E_SLICE_ID,
  W3_O02_E_TECHNICAL_DEBT_DELTA,
  W3_O02_E_TRANSITION_MATRIX,
} from './w3-o02-e-close-evidence';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');

function readWave3(name: string): string {
  return readFileSync(join(WAVE3, name), 'utf8');
}

describe('W3-O02-e package close evidence', () => {
  it('approved slices a–d recorded PASS', () => {
    expect(W3_O02_E_SLICE_ID).toBe('W3-O02-e');
    expect(W3_O02_E_QUEUE_OWNER).toBe('notification-delivery');
    expect(W3_O02_E_APPROVED_SLICES.map((s) => s.id)).toEqual([
      'W3-O02-a',
      'W3-O02-b',
      'W3-O02-c',
      'W3-O02-d',
    ]);
    expect(W3_O02_E_APPROVED_SLICES.every((s) => s.validation === 'PASS')).toBe(true);
  });

  it('architecture non-claims: no new capability / no silent expansion', () => {
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.newCustomerFunctionality).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.newApi).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.newUi).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.newPersistence).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.newRecoveryLogic).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.secondQueue).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.secondOutbox).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.secondNotificationLifecycle).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.businessContinuity).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.monitoringPlatform).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.highAvailability).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.disasterRecovery).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.wave5TransportsClaimed).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.wave3DeclaredComplete).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.w3O03Opened).toBe(false);
    expect(W3_O02_E_INTEGRITY_NON_EXPANSION).toContain('Business Continuity');
    expect(W3_O02_E_INTEGRITY_NON_EXPANSION).toContain('Retry Engine');
    expect(W3_O02_E_INTEGRITY_NON_EXPANSION).toContain('Wave 5 Notification Providers');
  });

  it('transition safety: V2 / Wave 1 / Wave 2 / owners unchanged across a–d', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.version2Unchanged).toBe(true);
    expect(answers.wave1Unchanged).toBe(true);
    expect(answers.wave2Unchanged).toBe(true);
    expect(answers.w3O01UnchangedAsRedesign).toBe(true);
    expect(answers.noNewPersistenceOwners).toBe(true);
    expect(answers.noSecondQueue).toBe(true);
    expect(answers.noSecondOutbox).toBe(true);
    expect(answers.packageNotDeclaredClosed).toBe(true);
    expect(answers.wave3NotDeclaredComplete).toBe(true);
    expect(answers.w3O03NotOpened).toBe(true);
    for (const claims of [
      W3_O02_A_ARCHITECTURE_CLAIMS,
      W3_O02_B_ARCHITECTURE_CLAIMS,
      W3_O02_C_ARCHITECTURE_CLAIMS,
      W3_O02_D_ARCHITECTURE_CLAIMS,
    ]) {
      expect(claims.ownershipBoundariesChanged).toBe(false);
      expect(claims.masterPlanModified).toBe(false);
      expect(claims.version2Redesigned).toBe(false);
      expect(claims.newPersistenceOwner).toBe(false);
      expect(claims.newBoundedContext).toBe(false);
      expect(claims.newOutbox).toBe(false);
      expect(claims.td045MergedIntoTd035).toBe(false);
    }
  });

  it('product verification claims hold across c/d', () => {
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.recoveryDeterministic).toBe(true);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.recoveryIdempotent).toBe(true);
    expect(W3_O02_C_ARCHITECTURE_CLAIMS.queuedNotificationsSurviveRestartClaimed).toBe(true);
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.operationalContinuityDerived).toBe(true);
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.neverHardcodesReady).toBe(true);
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.canFabricateReadiness).toBe(false);
    expect(W3_O02_D_ARCHITECTURE_CLAIMS.retryExecutionImplemented).toBe(false);
    expect(OPERATIONAL_STATES).toEqual(['Recovering', 'Ready', 'Degraded', 'Unavailable']);
  });

  it('required close evidence reports exist', () => {
    for (const name of W3_O02_E_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE3, name)), name).toBe(true);
    }
    expect(existsSync(join(WAVE3, 'notification-durable-queue-overview.md'))).toBe(true);
    expect(existsSync(join(WAVE3, 'w3-o02-validation-plan.md'))).toBe(true);
    expect(existsSync(join(WAVE3, 'wave-3-progress.md'))).toBe(true);
    expect(existsSync(join(WAVE3, 'operational-state-matrix.md'))).toBe(true);
  });

  it('transition / maturity / capability / debt registries are complete', () => {
    expect(W3_O02_E_TRANSITION_MATRIX.before.length).toBeGreaterThan(0);
    expect(W3_O02_E_TRANSITION_MATRIX.after.length).toBeGreaterThan(0);
    expect(W3_O02_E_TRANSITION_MATRIX.stillMissing).toContain(
      'Product Owner Package Close declaration',
    );
    expect(W3_O02_E_OPERATIONAL_MATURITY.after).toContain('Package Close Evidence');
    expect(W3_O02_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(/normal process restart/);
    expect(W3_O02_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(
      /without introducing Retry Engine/,
    );
    expect(W3_O02_E_CAPABILITY_EVOLUTION.packageClosedCapability).toMatch(/Wave 5 providers/);
    expect(W3_O02_E_TECHNICAL_DEBT_DELTA.resolved.length).toBeGreaterThan(0);
    expect(W3_O02_E_TECHNICAL_DEBT_DELTA.introduced).toEqual([]);
    expect(W3_O02_E_TECHNICAL_DEBT_DELTA.deferred.some((d) => d.includes('retry'))).toBe(true);
  });

  it('platform readiness exposes notification queue continuity without retry controls', () => {
    const view = readFileSync(
      join(REPO_ROOT, 'apps/web/src/operational-continuity/OperationalContinuityView.tsx'),
      'utf8',
    );
    const api = readFileSync(join(REPO_ROOT, 'apps/web/src/shared/api.ts'), 'utf8');
    expect(api).toContain('NotificationQueueContinuityView');
    expect(view).toMatch(/Notification queue|notificationQueue/i);
    expect(view).toContain('recoveryTimestamp');
    expect(view).toContain('recoveryDurationMs');
    expect(view).not.toMatch(/Retry control|Replay|Queue editor|Scheduler|Incident management/i);
  });

  it('status docs: W3-O02 CLOSED by Product Owner; Wave 3 COMPLETE and O03 not opened', () => {
    const progress = readWave3('wave-3-progress.md');
    const overview = readWave3('notification-durable-queue-overview.md');
    const close = readWave3('w3-o02-close-package-report.md');
    const summary = readWave3('w3-o02-package-summary.md');
    const poClose = readWave3('w3-o02-product-owner-close-record.md');
    expect(progress).toMatch(/CLOSED by Product Owner|Package \*\*CLOSED\*\*/);
    expect(progress).toMatch(/Wave 3 COMPLETE[\s\S]*Not claimed|Not claimed[\s\S]*Wave 3 COMPLETE/);
    expect(progress).toMatch(/W3-O03/);
    expect(progress).toMatch(/Not opened/);
    expect(overview).toMatch(/\*\*CLOSED\*\* by Product Owner|CLOSED by Product Owner/);
    expect(overview).toMatch(/STOP/);
    expect(close).toMatch(
      /Package \*\*CLOSED\*\* by Product Owner|\*\*CLOSED\*\* by Product Owner|CLOSED by Product Owner/,
    );
    expect(close).toMatch(/Wave 3 is \*\*NOT\*\* declared COMPLETE|Wave 3 is \*\*NOT\*\*/i);
    expect(close).toMatch(/W3-O03 is \*\*NOT\*\* opened|NOT.*open W3-O03/i);
    expect(summary).toMatch(/\*\*CLOSED\*\* by Product Owner/);
    expect(poClose).toMatch(
      /officially CLOSED|Decision:\*\* \*\*CLOSED\*\*|Decision: \*\*CLOSED\*\*/,
    );
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
    // W3-O02-e registry still records that the e slice itself did not declare Close;
    // Product Owner Close is recorded in status docs.
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.wave3DeclaredComplete).toBe(false);
    expect(W3_O02_E_ARCHITECTURE_CLAIMS.w3O03Opened).toBe(false);
  });

  it('slice validation reports a–d exist and record PASS', () => {
    for (const slice of ['a', 'b', 'c', 'd'] as const) {
      const report = readWave3(`w3-o02-${slice}-validation-report.md`);
      expect(report).toMatch(/PASS/);
    }
  });
});

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONTINUITY_AUDIT_EVENT_TYPES } from '../modules/operational-continuity/operational-continuity-audit';
import { OPERATIONAL_STATES } from '../modules/operational-continuity/operational-readiness';
import {
  W3_O01_C_RECOVERY_DEPENDENCIES,
  W3_O01_C_RECOVERY_ORDER,
} from '../persistence/analytical-restart-recovery';
import { W3_O01_D_ARCHITECTURE_CLAIMS } from './w3-o01-d-operational-continuity';
import { W3_O01_C_ARCHITECTURE_CLAIMS } from './w3-o01-c-restart-recovery';
import { W3_O01_B_ARCHITECTURE_CLAIMS } from './w3-o01-b-durable-persistence';
import { W3_O01_A_ARCHITECTURE_CLAIMS } from './w3-o01-a-analytical-inventory';
import {
  transitionSafetyAnswers,
  W3_O01_E_APPROVED_SLICES,
  W3_O01_E_ARCHITECTURE_CLAIMS,
  W3_O01_E_INTEGRITY_NON_EXPANSION,
  W3_O01_E_REQUIRED_REPORTS,
  W3_O01_E_SLICE_ID,
} from './w3-o01-e-close-evidence';

const REPO_ROOT = join(__dirname, '../../../..');
const WAVE3 = join(REPO_ROOT, 'docs/project/version-3/wave-3');

function readWave3(name: string): string {
  return readFileSync(join(WAVE3, name), 'utf8');
}

describe('W3-O01-e package close evidence', () => {
  it('approved slices a–d recorded PASS', () => {
    expect(W3_O01_E_SLICE_ID).toBe('W3-O01-e');
    expect(W3_O01_E_APPROVED_SLICES.map((s) => s.id)).toEqual([
      'W3-O01-a',
      'W3-O01-b',
      'W3-O01-c',
      'W3-O01-d',
    ]);
    expect(W3_O01_E_APPROVED_SLICES.every((s) => s.validation === 'PASS')).toBe(true);
  });

  it('architecture non-claims: no new capability / no silent expansion', () => {
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.newCustomerFunctionality).toBe(false);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.newApi).toBe(false);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.newUi).toBe(false);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.newPersistence).toBe(false);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.newRecoveryLogic).toBe(false);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.businessContinuity).toBe(false);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.monitoringPlatform).toBe(false);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.highAvailability).toBe(false);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.disasterRecovery).toBe(false);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.incidentManagement).toBe(false);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.packageDeclaredClosed).toBe(false);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.wave3DeclaredComplete).toBe(false);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.w3O02Opened).toBe(false);
    expect(W3_O01_E_INTEGRITY_NON_EXPANSION).toContain('Business Continuity');
    expect(W3_O01_E_INTEGRITY_NON_EXPANSION).toContain('Monitoring Platform');
  });

  it('transition safety: V2 / Wave 1 / Wave 2 / owners unchanged', () => {
    const answers = transitionSafetyAnswers();
    expect(answers.version2Unchanged).toBe(true);
    expect(answers.wave1Unchanged).toBe(true);
    expect(answers.wave2Unchanged).toBe(true);
    expect(answers.noNewPersistenceOwners).toBe(true);
    expect(answers.noNewRecoveryOwners).toBe(true);
    expect(answers.noDuplicateOperationalEngine).toBe(true);
    expect(answers.packageNotDeclaredClosed).toBe(true);
    for (const claims of [
      W3_O01_A_ARCHITECTURE_CLAIMS,
      W3_O01_B_ARCHITECTURE_CLAIMS,
      W3_O01_C_ARCHITECTURE_CLAIMS,
      W3_O01_D_ARCHITECTURE_CLAIMS,
    ]) {
      expect(claims.ownershipBoundariesChanged).toBe(false);
      expect(claims.masterPlanModified).toBe(false);
      expect(claims.version2Redesigned).toBe(false);
      expect(claims.newPersistenceOwner).toBe(false);
      expect(claims.newBoundedContext).toBe(false);
    }
  });

  it('required close evidence reports exist', () => {
    for (const name of W3_O01_E_REQUIRED_REPORTS) {
      expect(existsSync(join(WAVE3, name)), name).toBe(true);
    }
    expect(existsSync(join(WAVE3, 'operational-state-matrix.md'))).toBe(true);
  });

  it('operational consistency audit: matrix ↔ recovery ↔ states ↔ audits', () => {
    const matrix = readWave3('operational-state-matrix.md');
    for (const owner of W3_O01_C_RECOVERY_ORDER) {
      expect(matrix).toContain(owner);
      const deps = W3_O01_C_RECOVERY_DEPENDENCIES[owner];
      for (const dep of deps) {
        expect(matrix).toContain(dep);
      }
    }
    expect(matrix).toMatch(/Recovering/);
    expect(matrix).toMatch(/Ready/);
    expect(matrix).toMatch(/Degraded/);
    expect(matrix).toMatch(/Unavailable/);
    expect(OPERATIONAL_STATES).toEqual(['Recovering', 'Ready', 'Degraded', 'Unavailable']);
    expect(Object.values(CONTINUITY_AUDIT_EVENT_TYPES)).toEqual([
      'continuity.recovery-completed',
      'continuity.owner-ready',
      'continuity.owner-degraded',
      'continuity.owner-unavailable',
    ]);
  });

  it('readiness API and operator UI remain aligned (no e expansion)', () => {
    const controller = readFileSync(
      join(
        REPO_ROOT,
        'apps/api/src/modules/operational-continuity/operational-continuity.controller.ts',
      ),
      'utf8',
    );
    const api = readFileSync(join(REPO_ROOT, 'apps/web/src/shared/api.ts'), 'utf8');
    const page = readFileSync(
      join(REPO_ROOT, 'apps/web/src/operational-continuity/OperationalContinuityPage.tsx'),
      'utf8',
    );
    const view = readFileSync(
      join(REPO_ROOT, 'apps/web/src/operational-continuity/OperationalContinuityView.tsx'),
      'utf8',
    );
    expect(controller).toContain("path: 'operational-continuity'");
    expect(controller).toContain("'readiness'");
    expect(api).toContain('/operational-continuity/readiness');
    expect(page).toContain('getOperationalContinuityReadiness');
    expect(view).toContain('platformState');
    expect(view).toContain('degradedOwners');
    expect(view).toContain('unavailableOwners');
    expect(view).toContain('recoveryTimestamp');
    expect(view).toContain('recoveryDurationMs');
    expect(view).not.toMatch(/Incident management|Cluster state|Replication/i);
  });

  it('status docs do not declare CLOSED or Wave 3 COMPLETE or open O02', () => {
    const progress = readWave3('wave-3-progress.md');
    const overview = readWave3('durability-overview.md');
    const close = readWave3('w3-o01-close-package-report.md');
    expect(progress).toMatch(/Not claimed/);
    expect(progress).toMatch(/W3-O01 Closed/);
    expect(progress).toMatch(/NOT CLOSED|Not claimed/);
    expect(progress).toMatch(/W3-O02/);
    expect(progress).toMatch(/Not opened/);
    expect(overview).toMatch(/NOT declared CLOSED|NOT CLOSED/i);
    expect(close).toMatch(/NOT declared CLOSED|not declare.*CLOSED|awaiting Product Owner/i);
    expect(W3_O01_E_ARCHITECTURE_CLAIMS.packageCloseEvidenceAssembled).toBe(true);
  });
});

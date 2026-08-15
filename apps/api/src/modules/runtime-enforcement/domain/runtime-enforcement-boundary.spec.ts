import { describe, expect, it } from 'vitest';
import {
  RUNTIME_ENFORCEMENT_AUTHORITY_CLASS,
  RUNTIME_ENFORCEMENT_BOUNDARY,
  RUNTIME_ENFORCEMENT_DISTINCT_FROM,
  RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES,
  RUNTIME_ENFORCEMENT_MODULE_ID,
  RUNTIME_ENFORCEMENT_NON_OWNED,
  RUNTIME_ENFORCEMENT_OWNED_CONCERNS,
  isRuntimeEnforcementForbiddenCapability,
  isRuntimeEnforcementOwnedConcern,
  knowledgeLakeAuthorizesEnforcement,
  resolveDeploymentBindingConflict,
  resolveEnforcementOutcomeConflict,
  resolveLakeAuthorityConflict,
  resolveLibraryAuthorityConflict,
  resolveSessionLifecycleConflict,
  runtimeEnforcementOwnsPassFail,
  runtimeOwnsCertification,
  runtimeSelectsStrategies,
  validatesDoesNotDecide,
} from './runtime-enforcement-boundary';

describe('RC-23 Epic 1 — Runtime Enforcement boundary', () => {
  it('exposes an immutable Gate boundary for deployment validation', () => {
    expect(Object.isFrozen(RUNTIME_ENFORCEMENT_BOUNDARY)).toBe(true);
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.moduleId).toBe(RUNTIME_ENFORCEMENT_MODULE_ID);
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.moduleId).toBe('runtime-enforcement');
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.authorityClass).toBe(RUNTIME_ENFORCEMENT_AUTHORITY_CLASS);
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.authorityClass).toBe('gate');
    expect(runtimeEnforcementOwnsPassFail()).toBe(true);
  });

  it('declares owned gate concerns without implementing validation', () => {
    expect(RUNTIME_ENFORCEMENT_OWNED_CONCERNS).toEqual([
      'deployment-validation-boundary',
      'runtime-verification-contract',
      'enforcement-pass-fail',
      'rejection-reason-catalog',
    ]);
    for (const concern of RUNTIME_ENFORCEMENT_OWNED_CONCERNS) {
      expect(isRuntimeEnforcementOwnedConcern(concern)).toBe(true);
      expect(RUNTIME_ENFORCEMENT_BOUNDARY.ownedConcerns).toContain(concern);
    }
    expect(isRuntimeEnforcementOwnedConcern('strategy-certification')).toBe(false);
  });

  it('does not own certification, eligibility, envelope, session, or selection', () => {
    expect(RUNTIME_ENFORCEMENT_NON_OWNED).toEqual(
      expect.arrayContaining([
        'strategy-certification',
        'strategy-eligibility',
        'library-tactical-envelope',
        'strategy-library',
        'trading-session',
        'strategy-deployment',
        'knowledge-lake',
        'trading-orchestrator',
        'market-state-engine',
        'strategy-selection',
        'risk-engine',
        'execution-engine',
      ]),
    );
    for (const owner of RUNTIME_ENFORCEMENT_NON_OWNED) {
      expect(RUNTIME_ENFORCEMENT_BOUNDARY.nonOwned).toContain(owner);
    }
  });

  it('stays distinct from Library, Session, Orchestrator, and Selector', () => {
    expect(RUNTIME_ENFORCEMENT_DISTINCT_FROM).toEqual(
      expect.arrayContaining([
        'strategy-library',
        'trading-session',
        'strategy-deployment',
        'strategy-runtime',
        'knowledge-lake',
        'bot-facade',
        'trading-orchestrator',
        'strategy-selection',
      ]),
    );
    expect(RUNTIME_ENFORCEMENT_MODULE_ID).not.toBe('strategy-library');
    expect(RUNTIME_ENFORCEMENT_MODULE_ID).not.toBe('trading-orchestrator');
    expect(RUNTIME_ENFORCEMENT_MODULE_ID).not.toBe('strategy-selection');
    expect(RUNTIME_ENFORCEMENT_MODULE_ID).not.toBe('strategy-runtime');
  });

  it('forbids certify, select, Lake-as-authority, soft-fail, and Orchestrator', () => {
    for (const capability of [
      'certify-strategy',
      'deprecate-certification',
      'archive-certification',
      'mutate-eligibility',
      'mutate-envelope',
      'select-strategy',
      'authorize-from-lake',
      'own-session-lifecycle',
      'own-deployment-binding',
      'implement-orchestrator',
      'implement-market-state',
      'approve-risk',
      'submit-execution',
      'mutate-orders',
      'soft-fail-warn-and-continue',
      'write-library-certification',
    ] as const) {
      expect(isRuntimeEnforcementForbiddenCapability(capability)).toBe(true);
      expect(RUNTIME_ENFORCEMENT_FORBIDDEN_CAPABILITIES).toContain(capability);
    }
    expect(isRuntimeEnforcementForbiddenCapability('validate-deployment')).toBe(false);
  });

  it('activates Library reads + validateDeployment Gate (Epic 3)', () => {
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.activePorts).toEqual({
      validateDeployment: true,
      libraryLookup: true,
      libraryEligibility: true,
      persistence: false,
      rest: true,
    });
  });

  it('treats Library as read-only consumer target; Lake never authorizes', () => {
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.strategyLibraryRole).toBe('read-only-consumer');
    expect(RUNTIME_ENFORCEMENT_BOUNDARY.knowledgeLakeRole).toBe('never-authority');
    expect(knowledgeLakeAuthorizesEnforcement()).toBe(false);
  });

  it('asserts validates ≠ decides and never owns certification or selection', () => {
    expect(validatesDoesNotDecide()).toBe(true);
    expect(runtimeOwnsCertification()).toBe(false);
    expect(runtimeSelectsStrategies()).toBe(false);
  });

  it('resolves membership conflicts to Strategy Library; PASS/FAIL to Enforcement', () => {
    expect(resolveLibraryAuthorityConflict('certified-membership')).toBe('strategy-library');
    expect(resolveLibraryAuthorityConflict('certification-status')).toBe('strategy-library');
    expect(resolveLibraryAuthorityConflict('eligibility-status')).toBe('strategy-library');
    expect(resolveLibraryAuthorityConflict('tactical-envelope')).toBe('strategy-library');
    expect(resolveEnforcementOutcomeConflict()).toBe('runtime-enforcement');
  });

  it('does not steal Session / Deployment / Lake authority', () => {
    expect(resolveSessionLifecycleConflict()).toBe('trading-session');
    expect(resolveDeploymentBindingConflict()).toBe('strategy-deployment');
    expect(resolveLakeAuthorityConflict()).toBe('never-authority');
  });
});

import { Injectable } from '@nestjs/common';
import {
  RUNTIME_ENFORCEMENT_BOUNDARY,
  type RuntimeEnforcementBoundary,
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
} from './domain/runtime-enforcement-boundary';

/**
 * RC-23 Epic 1 — injectable boundary descriptor.
 *
 * Read-only access to Runtime Enforcement ownership invariants.
 * No validation, Library consumption, or Session/Deployment hooks.
 */
@Injectable()
export class RuntimeEnforcementBoundaryService {
  /** Immutable Runtime Enforcement boundary (Gate). */
  getBoundary(): RuntimeEnforcementBoundary {
    return RUNTIME_ENFORCEMENT_BOUNDARY;
  }

  /** Enforcement owns PASS/FAIL only. */
  ownsPassFail(): true {
    return runtimeEnforcementOwnsPassFail();
  }

  /** Runtime never owns certification. */
  ownsCertification(): false {
    return runtimeOwnsCertification();
  }

  /** Runtime never selects strategies. */
  selectsStrategies(): false {
    return runtimeSelectsStrategies();
  }

  /** Mantra: validates ≠ decides. */
  validatesDoesNotDecide(): true {
    return validatesDoesNotDecide();
  }

  /** Knowledge Lake never authorizes enforcement. */
  knowledgeLakeAuthorizes(): false {
    return knowledgeLakeAuthorizesEnforcement();
  }

  /**
   * On membership / certification / eligibility / envelope disputes,
   * Strategy Library wins.
   */
  resolveLibraryConflict(
    concern:
      'certified-membership' | 'certification-status' | 'eligibility-status' | 'tactical-envelope',
  ): 'strategy-library' {
    return resolveLibraryAuthorityConflict(concern);
  }

  /** Session lifecycle stays with Trading Session. */
  resolveSessionConflict(): 'trading-session' {
    return resolveSessionLifecycleConflict();
  }

  /** Deployment binding stays with Strategy Deployment. */
  resolveDeploymentConflict(): 'strategy-deployment' {
    return resolveDeploymentBindingConflict();
  }

  /** PASS/FAIL outcomes stay with Runtime Enforcement. */
  resolveOutcomeConflict(): 'runtime-enforcement' {
    return resolveEnforcementOutcomeConflict();
  }

  /** Lake never authorizes. */
  resolveLakeConflict(): 'never-authority' {
    return resolveLakeAuthorityConflict();
  }
}

import { Injectable } from '@nestjs/common';
import {
  STRATEGY_LIBRARY_BOUNDARY,
  type StrategyLibraryBoundary,
  knowledgeLakeOwnsLibraryMembership,
  registryActiveMeansCertified,
  resolveLibraryAuthorityConflict,
  resolveNonLibraryConflict,
  strategyLibraryOwnsCertifiedMembership,
} from './domain/strategy-library-boundary';

/**
 * RC-22 Epic 1 — injectable boundary descriptor.
 *
 * Read-only access to Strategy Library ownership invariants.
 * No certification, eligibility, envelope, or persistence commands.
 */
@Injectable()
export class StrategyLibraryBoundaryService {
  /** Immutable Strategy Library boundary (certified-strategy SoT). */
  getBoundary(): StrategyLibraryBoundary {
    return STRATEGY_LIBRARY_BOUNDARY;
  }

  /** Library owns certified membership SoT (Spec §5.2). */
  ownsCertifiedMembership(): true {
    return strategyLibraryOwnsCertifiedMembership();
  }

  /** Registry `active` is never certification. */
  registryActiveMeansCertified(): false {
    return registryActiveMeansCertified();
  }

  /** Knowledge Lake never owns Library membership. */
  knowledgeLakeOwnsMembership(): false {
    return knowledgeLakeOwnsLibraryMembership();
  }

  /**
   * On certified membership / envelope / eligibility disputes,
   * Strategy Library wins over Lake and UI caches.
   */
  resolveLibraryConflict(
    concern: 'certified-membership' | 'tactical-envelope' | 'eligibility-status',
  ): 'strategy-library' {
    return resolveLibraryAuthorityConflict(concern);
  }

  /**
   * Non-Library concerns stay with their owners.
   */
  resolveForeignConflict(
    concern: 'session-lifecycle' | 'paper-trading' | 'execution' | 'knowledge-lake-facts',
  ): 'trading-session' | 'paper-trading' | 'execution-engine' | 'knowledge-lake-projection' {
    return resolveNonLibraryConflict(concern);
  }
}

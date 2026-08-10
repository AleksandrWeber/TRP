import { Injectable } from '@nestjs/common';
import {
  REPORTING_BOUNDARY,
  type ReportingBoundary,
  reportingAuthorizes,
  reportingIsSourceOfTruth,
  reportingOwnsBusinessState,
  reportingTrades,
  reportingValidatesStrategies,
  resolveEnforcementConflict,
  resolveLakeStorageConflict,
  resolveLibraryConflict,
  resolveReportingAuthorityConflict,
} from './domain/reporting-boundary';

/**
 * RC-24 Epic 1 — injectable Reporting boundary descriptor.
 *
 * Read-only access to Reporting ownership invariants.
 * No report generation, aggregation, narrative, or SoT command methods.
 */
@Injectable()
export class ReportingBoundaryService {
  /** Immutable Reporting boundary (projection owner). */
  getBoundary(): ReportingBoundary {
    return REPORTING_BOUNDARY;
  }

  /** Reporting never owns business state (Authority Matrix). */
  ownsBusinessState(): false {
    return reportingOwnsBusinessState();
  }

  /** Reporting never becomes Source of Truth. */
  isSourceOfTruth(): false {
    return reportingIsSourceOfTruth();
  }

  /** Reporting never authorizes deployment / capital. */
  authorizes(): false {
    return reportingAuthorizes();
  }

  /** Reporting never trades. */
  trades(): false {
    return reportingTrades();
  }

  /** Reporting never validates / certifies strategies. */
  validatesStrategies(): false {
    return reportingValidatesStrategies();
  }

  /**
   * On cash / fills / orders / lifecycle / certification disputes, SoT wins.
   * Reporting loses by design.
   */
  resolveConflict(
    concern: 'cash' | 'fills' | 'orders' | 'session-lifecycle' | 'certification',
  ): 'source-of-truth' {
    return resolveReportingAuthorityConflict(concern);
  }

  /** Lake remains analytical warehouse owner. */
  resolveLakeStorage(): 'knowledge-lake' {
    return resolveLakeStorageConflict();
  }

  /** Runtime Enforcement remains the Gate. */
  resolveEnforcement(): 'runtime-enforcement' {
    return resolveEnforcementConflict();
  }

  /** Strategy Library remains certification SoT. */
  resolveLibrary(): 'strategy-library' {
    return resolveLibraryConflict();
  }
}

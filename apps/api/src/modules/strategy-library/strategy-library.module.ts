import { Module } from '@nestjs/common';
import { StrategyLibraryBoundaryService } from './strategy-library-boundary.service';

/**
 * RC-22 Strategy Library Nest module.
 *
 * Epic 1: certified-strategy SoT boundary + ownership invariants.
 * Epic 2: Strategy + StrategyVersion domain model.
 * Epic 3: StrategyCertification + CertificationEvidence domain (no app ports).
 * Epic 4: LibraryTacticalEnvelope binding on certification (configuration only).
 * Epic 5: StrategyEligibility domain gate (no runtime / Session wiring).
 * Epic 6: Strategy lifecycle deprecate/archive (immutable records; no runtime).
 *
 * Does not expose persistence, REST, UI, or application ports yet.
 * Distinct from {@link StrategiesModule} (experimental registry) and
 * {@link KnowledgeLakeModule} (projection warehouse).
 */
@Module({
  providers: [StrategyLibraryBoundaryService],
  exports: [StrategyLibraryBoundaryService],
})
export class StrategyLibraryModule {}

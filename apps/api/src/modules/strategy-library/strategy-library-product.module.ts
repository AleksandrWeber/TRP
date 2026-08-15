import { Module } from '@nestjs/common';
import { WorkspaceModule } from '../workspace';
import { StrategyLibraryCertificationController } from './strategy-library-certification.controller';
import { StrategyLibraryController } from './strategy-library.controller';
import { StrategyLibraryModule } from './strategy-library.module';

/**
 * PC-01 / PC-02 — HTTP product adapter for Strategy Library Lookup, Eligibility, and Certification.
 *
 * Does not own Library SoT. Certification writes through the existing Library buffer.
 * Distinct from {@link StrategiesModule} (`/v1/strategies`).
 */
@Module({
  imports: [StrategyLibraryModule, WorkspaceModule],
  controllers: [StrategyLibraryController, StrategyLibraryCertificationController],
})
export class StrategyLibraryProductModule {}

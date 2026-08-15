import { Module } from '@nestjs/common';
import { WorkspaceModule } from '../workspace';
import { InMemoryRuntimeValidationStore } from './in-memory-runtime-validation.store';
import { RuntimeEnforcementModule } from './runtime-enforcement.module';
import { RuntimeValidationController } from './runtime-validation.controller';
import { RuntimeValidationService } from './runtime-validation.service';

/**
 * PC-04 — HTTP product adapter for Runtime Enforcement validateDeployment.
 *
 * Does not own PASS/FAIL. Does not redesign the Gate. Deployment and Session stay unchanged.
 */
@Module({
  imports: [RuntimeEnforcementModule, WorkspaceModule],
  controllers: [RuntimeValidationController],
  providers: [InMemoryRuntimeValidationStore, RuntimeValidationService],
})
export class RuntimeValidationProductModule {}

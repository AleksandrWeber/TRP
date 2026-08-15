import { Module } from '@nestjs/common';
import {
  STRATEGY_LIBRARY_ELIGIBILITY_PORT,
  STRATEGY_LIBRARY_LOOKUP_PORT,
  StrategyLibraryModule,
} from '../strategy-library';
import {
  RUNTIME_ENFORCEMENT_PORT,
  STRATEGY_LIBRARY_ELIGIBILITY_CONSUMER,
  STRATEGY_LIBRARY_LOOKUP_CONSUMER,
} from './ports/runtime-enforcement.port';
import { RuntimeEnforcementBoundaryService } from './runtime-enforcement-boundary.service';
import { RuntimeEnforcementGateService } from './runtime-enforcement-gate.service';
import { RuntimeEnforcementLibraryReadService } from './runtime-enforcement-library-read.service';

/**
 * RC-23 Runtime Enforcement Nest module.
 *
 * Epic 1: Gate boundary + ownership invariants.
 * Epic 2: Library read consumption (Lookup / Eligibility).
 * Epic 3: validateDeployment Gate sequence (callable; no Session/Deployment hooks).
 * Epic 4: Strategy Deployment bind hook.
 * Epic 5: Trading Session start refusal.
 * Epic 6: Fail-closed coverage + close readiness.
 *
 * Persistence remains process-local. REST lives in RuntimeValidationProductModule (PC-04).
 * Distinct from Strategy Library (SoT) and Strategy Runtime (evaluation loop).
 *
 * Dependency direction: Enforcement consumes Library reads;
 * Strategy Library must never depend on Runtime Enforcement.
 */
@Module({
  imports: [StrategyLibraryModule],
  providers: [
    RuntimeEnforcementBoundaryService,
    RuntimeEnforcementLibraryReadService,
    RuntimeEnforcementGateService,
    {
      provide: STRATEGY_LIBRARY_LOOKUP_CONSUMER,
      useFactory: (port: unknown) => port,
      inject: [STRATEGY_LIBRARY_LOOKUP_PORT],
    },
    {
      provide: STRATEGY_LIBRARY_ELIGIBILITY_CONSUMER,
      useFactory: (port: unknown) => port,
      inject: [STRATEGY_LIBRARY_ELIGIBILITY_PORT],
    },
    {
      provide: RUNTIME_ENFORCEMENT_PORT,
      useFactory: (gate: RuntimeEnforcementGateService) => gate,
      inject: [RuntimeEnforcementGateService],
    },
  ],
  exports: [
    RuntimeEnforcementBoundaryService,
    RuntimeEnforcementLibraryReadService,
    RuntimeEnforcementGateService,
    RUNTIME_ENFORCEMENT_PORT,
  ],
})
export class RuntimeEnforcementModule {}

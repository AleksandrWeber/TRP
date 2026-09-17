import { Global, Module } from '@nestjs/common';
import { RuntimeEnforcementModule } from '../modules/runtime-enforcement/runtime-enforcement.module';
import { LIVE_ADMISSION_GATE_PORT } from '../modules/trading-session/live-admission/live-admission-gate.port';
import { RealLiveAdmissionGatePort } from './real-live-admission-gate.port';

/**
 * PROPOSED-V3-L01-S04 — production Gate binding for live admission.
 *
 * Global so LiveAdmissionService can inject LIVE_ADMISSION_GATE_PORT without
 * Trading Session importing Runtime Enforcement (RC-23 / RC-28).
 */
@Global()
@Module({
  imports: [RuntimeEnforcementModule],
  providers: [
    RealLiveAdmissionGatePort,
    {
      provide: LIVE_ADMISSION_GATE_PORT,
      useExisting: RealLiveAdmissionGatePort,
    },
  ],
  exports: [LIVE_ADMISSION_GATE_PORT, RealLiveAdmissionGatePort],
})
export class LiveAdmissionGatePortsModule {}

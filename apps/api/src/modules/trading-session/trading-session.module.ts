import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { EventProcessingModule } from '../event-processing';
import { PaperAccountModule } from '../paper-account';
import { StrategyDeploymentModule } from '../strategy-deployment';
import { StrategyRuntimeModule } from '../strategy-runtime';
import { TRADING_SESSION_REPOSITORY } from './persistence/trading-session.repository';
import { PrismaTradingSessionRepository } from './persistence/prisma-trading-session.repository';
import {
  InactiveRecoveryEventAdmissionPolicy,
  RECOVERY_EVENT_ADMISSION_POLICY,
} from './ports/recovery-event-admission-policy.port';
import { RecoveryEventAdmissionService } from './recovery/recovery-event-admission.service';
import {
  RECOVERY_RECONCILIATION_PORTS,
  StubRecoveryReconciliationPorts,
} from './ports/recovery-reconciliation.ports';
import { RecoveryCheckpointValidationService } from './recovery/recovery-checkpoint-validation.service';
import { RecoveryLeaseAcquisitionService } from './recovery/recovery-lease-acquisition.service';
import { RecoveryRuntimeArmingService } from './recovery/recovery-runtime-arming.service';
import { RecoveryRuntimeResumeService } from './recovery/recovery-runtime-resume.service';
import { RecoveryStateReconciliationService } from './recovery/recovery-state-reconciliation.service';
import { RecoveryStrategyEvaluationService } from './recovery/recovery-strategy-evaluation.service';
import { RecoverySignalIntentGenerationService } from './recovery/recovery-signal-intent-generation.service';
import { RecoveryCompletionService } from './recovery/recovery-completion.service';
import { StartupRecoveryDiscoveryService } from './recovery/startup-recovery-discovery.service';
import { TradingSessionService } from './trading-session.service';

/**
 * Trading Session bounded context (US156 / US157 / US217 / US240–US249).
 * Owns lifecycle + Deployment identity binding. Depends on Strategy Deployment
 * and StrategyRuntimePort only among Runtime modules — never Orders/Risk/Execution.
 *
 * US240–US244: discovery → lease → checkpoint validation → reconciliation →
 * deterministic runtime READY hydration.
 * US245: deterministic event admission only; no evaluation / SignalIntent / Orders.
 * US246: deterministic Runtime arming (EVENT_ADMISSION_ENABLED → ARMED); no
 * evaluation / SignalIntent / Orders.
 * US247: first deterministic strategy evaluation after ARMED; decision only —
 * no SignalIntent / Orders / checkpoint writes.
 * US248: deterministic SignalIntent generation from evaluated decisions —
 * no Orders / Execution Engine / Accounting / checkpoint writes.
 * US249: recovery completion + Session exit from RECOVERING; lease release;
 * no Orders / Runtime lifecycle mutation.
 */
@Module({
  imports: [
    EventProcessingModule,
    PaperAccountModule,
    StrategyDeploymentModule,
    StrategyRuntimeModule,
  ],
  providers: [
    {
      provide: TRADING_SESSION_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaTradingSessionRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: RECOVERY_EVENT_ADMISSION_POLICY,
      useClass: InactiveRecoveryEventAdmissionPolicy,
    },
    {
      provide: RECOVERY_RECONCILIATION_PORTS,
      useClass: StubRecoveryReconciliationPorts,
    },
    TradingSessionService,
    StartupRecoveryDiscoveryService,
    RecoveryLeaseAcquisitionService,
    RecoveryCheckpointValidationService,
    RecoveryStateReconciliationService,
    RecoveryRuntimeResumeService,
    RecoveryEventAdmissionService,
    RecoveryRuntimeArmingService,
    RecoveryStrategyEvaluationService,
    RecoverySignalIntentGenerationService,
    RecoveryCompletionService,
  ],
  exports: [
    TRADING_SESSION_REPOSITORY,
    TradingSessionService,
    StartupRecoveryDiscoveryService,
    RecoveryLeaseAcquisitionService,
    RecoveryCheckpointValidationService,
    RecoveryStateReconciliationService,
    RecoveryRuntimeResumeService,
    RecoveryEventAdmissionService,
    RecoveryRuntimeArmingService,
    RecoveryStrategyEvaluationService,
    RecoverySignalIntentGenerationService,
    RecoveryCompletionService,
    RECOVERY_EVENT_ADMISSION_POLICY,
    RECOVERY_RECONCILIATION_PORTS,
  ],
})
export class TradingSessionModule {}

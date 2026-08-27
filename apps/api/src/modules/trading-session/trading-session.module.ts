import { Module } from '@nestjs/common';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { EventProcessingModule } from '../event-processing';
import { PaperAccountModule } from '../paper-account';
import { StrategyDeploymentModule } from '../strategy-deployment';
import { StrategyRuntimeModule } from '../strategy-runtime';
import { RECOVERY_INCIDENT_REPOSITORY } from './domain/recovery-incident.repository';
import { RECOVERY_STATE_REPOSITORY } from './domain/recovery-state.repository';
import { KILL_SWITCH_STATE_REPOSITORY } from './domain/kill-switch-state.repository';
import { TRADING_SESSION_REPOSITORY } from './persistence/trading-session.repository';
import { PrismaTradingSessionRepository } from './persistence/prisma-trading-session.repository';
import { PrismaRecoveryStateRepository } from './persistence/prisma-recovery-state.repository';
import { PrismaRecoveryIncidentRepository } from './persistence/prisma-recovery-incident.repository';
import { PrismaKillSwitchStateRepository } from './persistence/prisma-kill-switch-state.repository';
import {
  InactiveRecoveryEventAdmissionPolicy,
  RECOVERY_EVENT_ADMISSION_POLICY,
} from './ports/recovery-event-admission-policy.port';
import { RecoveryEventAdmissionService } from './recovery/recovery-event-admission.service';
import { RecoveryCheckpointValidationService } from './recovery/recovery-checkpoint-validation.service';
import { RecoveryLeaseAcquisitionService } from './recovery/recovery-lease-acquisition.service';
import { RecoveryPhaseProgressService } from './recovery/recovery-phase-progress.service';
import { RecoveryIncidentFailClosedService } from './recovery/recovery-incident-fail-closed.service';
import { RecoveryRuntimeArmingService } from './recovery/recovery-runtime-arming.service';
import { RecoveryRuntimeResumeService } from './recovery/recovery-runtime-resume.service';
import { RecoveryStateReconciliationService } from './recovery/recovery-state-reconciliation.service';
import { RecoveryStrategyEvaluationService } from './recovery/recovery-strategy-evaluation.service';
import { RecoverySignalIntentGenerationService } from './recovery/recovery-signal-intent-generation.service';
import { RecoveryCompletionService } from './recovery/recovery-completion.service';
import { StartupRecoveryDiscoveryService } from './recovery/startup-recovery-discovery.service';
import { KillSwitchPersistenceService } from './kill-switch/kill-switch-persistence.service';
import { KillSwitchRecoveryStore } from './kill-switch/kill-switch-recovery-store';
import { KillSwitchRestartRecoveryService } from './kill-switch/kill-switch-restart-recovery.service';
import { TradingSessionService } from './trading-session.service';

/**
 * Trading Session bounded context (US156 / US157 / US217 / US240–US249 / US290–US293).
 * Owns lifecycle + Deployment identity binding. Depends on Strategy Deployment
 * and StrategyRuntimePort only among Runtime modules — never Orders/Risk/Execution.
 *
 * US240–US244: discovery → lease → checkpoint validation → reconciliation →
 * deterministic runtime READY hydration.
 * US290: force/confirm Session `RECOVERING` on discovery open.
 * US291: production `RECOVERY_RECONCILIATION_PORTS` bind at composition root.
 * US292: durable RecoveryState + RecoveryPhase machine (progress within RECOVERING).
 * US293: minimal durable Recovery Incident + fail-closed Session FAILED.
 * US245–US249: admission → arm → evaluate → SignalIntent → completion/exit.
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
      provide: RECOVERY_STATE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaRecoveryStateRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: RECOVERY_INCIDENT_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaRecoveryIncidentRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: KILL_SWITCH_STATE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaKillSwitchStateRepository(prisma),
      inject: [PrismaService],
    },
    {
      provide: RECOVERY_EVENT_ADMISSION_POLICY,
      useClass: InactiveRecoveryEventAdmissionPolicy,
    },
    TradingSessionService,
    RecoveryPhaseProgressService,
    RecoveryIncidentFailClosedService,
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
    KillSwitchPersistenceService,
    KillSwitchRecoveryStore,
    KillSwitchRestartRecoveryService,
  ],
  exports: [
    TRADING_SESSION_REPOSITORY,
    RECOVERY_STATE_REPOSITORY,
    RECOVERY_INCIDENT_REPOSITORY,
    KILL_SWITCH_STATE_REPOSITORY,
    TradingSessionService,
    RecoveryPhaseProgressService,
    RecoveryIncidentFailClosedService,
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
    KillSwitchPersistenceService,
    KillSwitchRecoveryStore,
    KillSwitchRestartRecoveryService,
    RECOVERY_EVENT_ADMISSION_POLICY,
  ],
})
export class TradingSessionModule {}

/**
 * PROPOSED-V3-L01-S04 — Live admission Nest module.
 *
 * Intentionally does NOT import WorkspaceModule (avoids AdminService/LOGGER coupling).
 * Consumes S02 policy via direct persistence adapter. Consumes durable KS via Prisma.
 * Consumes Gate via LIVE_ADMISSION_GATE_PORT bound at composition root
 * (LiveAdmissionGatePortsModule) — Session must not import Runtime Enforcement.
 */

import { Module } from '@nestjs/common';
import { PrismaService } from '../../../storage/prisma/prisma.module';
import { PrismaWorkspaceLivePolicyStateRepository } from '../../workspace/live-policy/persistence/prisma-workspace-live-policy-state.repository';
import { WorkspaceLivePolicyPersistenceService } from '../../workspace/live-policy/workspace-live-policy-persistence.service';
import { LIVE_POLICY_STATE_REPOSITORY } from '../../workspace/live-policy/workspace-live-policy-state.repository';
import { KILL_SWITCH_STATE_REPOSITORY } from '../domain/kill-switch-state.repository';
import { KillSwitchPersistenceService } from '../kill-switch/kill-switch-persistence.service';
import { KillSwitchRecoveryStore } from '../kill-switch/kill-switch-recovery-store';
import { PrismaKillSwitchStateRepository } from '../persistence/prisma-kill-switch-state.repository';
import { HUMAN_START_PROOF_STORE } from './human-start-proof.tokens';
import { InMemoryHumanStartProofStore } from './in-memory-human-start-proof.store';
import { LiveAdmissionService } from './live-admission.service';

@Module({
  providers: [
    {
      provide: HUMAN_START_PROOF_STORE,
      useClass: InMemoryHumanStartProofStore,
    },
    {
      provide: LIVE_POLICY_STATE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaWorkspaceLivePolicyStateRepository(prisma),
      inject: [PrismaService],
    },
    WorkspaceLivePolicyPersistenceService,
    {
      provide: KILL_SWITCH_STATE_REPOSITORY,
      useFactory: (prisma: PrismaService) => new PrismaKillSwitchStateRepository(prisma),
      inject: [PrismaService],
    },
    KillSwitchRecoveryStore,
    KillSwitchPersistenceService,
    LiveAdmissionService,
  ],
  exports: [LiveAdmissionService, HUMAN_START_PROOF_STORE],
})
export class LiveAdmissionModule {}

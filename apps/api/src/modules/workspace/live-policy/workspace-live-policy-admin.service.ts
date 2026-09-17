import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { Logger } from '../../../logging/logger';
import { LOGGER } from '../../../logging/logger.token';
import {
  PrismaTransactionService,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import { SecurityAuditService } from '../../security-audit/security-audit.service';
import {
  livePolicyAuthorizesAdmission,
  livePolicyAuthorizesExecution,
  livePolicyAuthorizesLiveTrading,
  WorkspaceLivePolicy,
  type DurableWorkspaceLivePolicyState,
} from './durable-workspace-live-policy-state';
import { recordWorkspaceLivePolicyChange } from './workspace-live-policy.audit';
import { WorkspaceLivePolicyPersistenceService } from './workspace-live-policy-persistence.service';

export type WorkspaceLivePolicyAdminView = Readonly<{
  workspaceId: string;
  policy: WorkspaceLivePolicy;
  schemaVersion: number;
  updatedAt: string;
  /** Honesty: persisted policy never authorizes live trading / admission / execution. */
  liveTradingAuthorized: boolean;
  liveAdmissionAuthorized: boolean;
  liveExecutionAuthorized: boolean;
}>;

/**
 * PROPOSED-V3-L01-S03 — Admin enable/disable orchestration over the S02 SoT.
 * Control-plane only. No Gate / KS / Session / credentials / LiveCommand.
 *
 * V3-L02-S-EM1: disable → PAPER does not invoke EmergencyManager / cancel-all.
 */
@Injectable()
export class WorkspaceLivePolicyAdminService {
  private readonly logger: Logger;

  constructor(
    @Inject(WorkspaceLivePolicyPersistenceService)
    private readonly livePolicy: WorkspaceLivePolicyPersistenceService,
    @Inject(PrismaTransactionService) private readonly transactions: PrismaTransactionService,
    @Inject(SecurityAuditService) private readonly audit: SecurityAuditService,
    @Inject(LOGGER) logger: Logger,
  ) {
    this.logger = logger.child('WorkspaceLivePolicyAdminService');
  }

  async enable(input: {
    workspaceId: string;
    actorUserId: string;
    correlationId?: string;
  }): Promise<WorkspaceLivePolicyAdminView> {
    return this.transition({
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      correlationId: input.correlationId,
      target: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
    });
  }

  async disable(input: {
    workspaceId: string;
    actorUserId: string;
    correlationId?: string;
  }): Promise<WorkspaceLivePolicyAdminView> {
    return this.transition({
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      correlationId: input.correlationId,
      target: WorkspaceLivePolicy.PAPER,
    });
  }

  private async transition(input: {
    workspaceId: string;
    actorUserId: string;
    correlationId?: string;
    target: WorkspaceLivePolicy;
  }): Promise<WorkspaceLivePolicyAdminView> {
    const effective = await this.livePolicy.resolveEffectivePolicy(input.workspaceId);

    if (effective === input.target) {
      const existing = await this.livePolicy.loadState(input.workspaceId);
      if (existing) {
        return toAdminView(existing);
      }
      // Missing row resolving as PAPER — seed Paper for a durable response without audit.
      const seeded = await this.livePolicy.ensurePaperDefault(input.workspaceId);
      return toAdminView(seeded);
    }

    try {
      const committed = await this.transactions.run(async (transaction) => {
        const outcome = await this.livePolicy.persistPolicy(
          {
            workspaceId: input.workspaceId,
            policy: input.target,
          },
          transaction,
        );
        if (!outcome.ok) {
          throw new BadRequestException(
            `invalid workspace live policy transition: ${outcome.reason}`,
          );
        }
        await this.appendTransitionAudit(
          {
            actorUserId: input.actorUserId,
            workspaceId: input.workspaceId,
            fromPolicy: effective,
            toPolicy: input.target,
            correlationId: input.correlationId,
          },
          transaction,
        );
        return outcome.state;
      });
      return toAdminView(committed);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const text = error instanceof Error ? error.message : String(error);
      if (/unsupported Workspace live policy/i.test(text)) {
        throw new BadRequestException(text);
      }
      throw error;
    }
  }

  private async appendTransitionAudit(
    payload: {
      actorUserId: string;
      workspaceId: string;
      fromPolicy: WorkspaceLivePolicy;
      toPolicy: WorkspaceLivePolicy;
      correlationId?: string;
    },
    transaction: TransactionContext,
  ): Promise<void> {
    await recordWorkspaceLivePolicyChange(
      this.logger,
      {
        outcome: 'changed',
        actorUserId: payload.actorUserId,
        workspaceId: payload.workspaceId,
        fromPolicy: payload.fromPolicy,
        toPolicy: payload.toPolicy,
        correlationId: payload.correlationId,
      },
      this.audit,
      transaction,
    );
  }
}

export function toAdminView(state: DurableWorkspaceLivePolicyState): WorkspaceLivePolicyAdminView {
  return Object.freeze({
    workspaceId: state.workspaceId,
    policy: state.policy,
    schemaVersion: state.schemaVersion,
    updatedAt: state.updatedAt,
    liveTradingAuthorized: livePolicyAuthorizesLiveTrading(state),
    liveAdmissionAuthorized: livePolicyAuthorizesAdmission(state),
    liveExecutionAuthorized: livePolicyAuthorizesExecution(state),
  });
}

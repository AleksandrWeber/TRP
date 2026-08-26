import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';

export const PAPER_EXECUTION_AUDIT_OUTCOMES = [
  'paper_fill_created',
  'paper_execution_completed',
  'paper_execution_rejected',
] as const;

export type PaperExecutionAuditOutcome = (typeof PAPER_EXECUTION_AUDIT_OUTCOMES)[number];

/**
 * Paper Execution audit (W2-S04-c).
 * Reuses Security Audit persistence and connection.lifecycle event type.
 */
@Injectable()
export class PaperExecutionAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: PaperExecutionAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    paperOrderId: string;
    paperFillId?: string;
    exchange?: string;
    symbol?: string;
    reason?: string;
  }): Promise<void> {
    await this.audit.record({
      eventType: 'connection.lifecycle',
      outcome: input.outcome,
      source: 'paper-trading-foundation',
      attribution: {
        workspaceId: input.workspaceId,
        actorId: input.actorUserId,
        resourceType: 'paper_execution',
        resourceId: input.paperFillId ?? input.paperOrderId,
      },
      payload: {
        paperExecution: true,
        paperOrderId: input.paperOrderId,
        ...(input.paperFillId ? { paperFillId: input.paperFillId } : {}),
        ...(input.exchange ? { exchange: input.exchange } : {}),
        ...(input.symbol ? { symbol: input.symbol } : {}),
        ...(input.reason ? { reason: input.reason } : {}),
      },
    });
  }
}

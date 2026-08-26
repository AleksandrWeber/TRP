import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';

export const PAPER_ORDER_AUDIT_OUTCOMES = [
  'paper_order_created',
  'paper_order_updated',
  'paper_order_cancelled',
  'paper_order_rejected',
] as const;

export type PaperOrderAuditOutcome = (typeof PAPER_ORDER_AUDIT_OUTCOMES)[number];

/**
 * Paper Order lifecycle audit (W2-S04-b).
 * Reuses Security Audit persistence and connection.lifecycle event type.
 */
@Injectable()
export class PaperOrderAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: PaperOrderAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    paperOrderId: string;
    status: string;
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
        resourceType: 'paper_order',
        resourceId: input.paperOrderId,
      },
      payload: {
        paperOrder: true,
        status: input.status,
        ...(input.exchange ? { exchange: input.exchange } : {}),
        ...(input.symbol ? { symbol: input.symbol } : {}),
        ...(input.reason ? { reason: input.reason } : {}),
      },
    });
  }
}

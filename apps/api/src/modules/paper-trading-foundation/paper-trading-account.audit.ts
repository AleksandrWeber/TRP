import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';

export const PAPER_ACCOUNT_AUDIT_OUTCOMES = [
  'paper_account_created',
  'paper_account_activated',
  'paper_account_disabled',
] as const;

export type PaperAccountAuditOutcome = (typeof PAPER_ACCOUNT_AUDIT_OUTCOMES)[number];

/**
 * Paper Account lifecycle audit (W2-S04-a).
 *
 * Reuses Security Audit persistence and the existing connection.lifecycle
 * event type. Does not add event types or redesign the store.
 */
@Injectable()
export class PaperTradingAccountAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: PaperAccountAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    paperAccountId: string;
    status: string;
    baseCurrency?: string;
  }): Promise<void> {
    await this.audit.record({
      eventType: 'connection.lifecycle',
      outcome: input.outcome,
      source: 'paper-trading-foundation',
      attribution: {
        workspaceId: input.workspaceId,
        actorId: input.actorUserId,
        resourceType: 'paper_account',
        resourceId: input.paperAccountId,
      },
      payload: {
        paperAccount: true,
        status: input.status,
        ...(input.baseCurrency ? { baseCurrency: input.baseCurrency } : {}),
      },
    });
  }
}

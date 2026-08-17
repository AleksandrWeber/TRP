import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';

export const EXCHANGE_SESSION_AUDIT_OUTCOMES = [
  'session_established',
  'session_expired',
  'connection_lost',
  'reconnect_required',
] as const;

export type ExchangeSessionAuditOutcome = (typeof EXCHANGE_SESSION_AUDIT_OUTCOMES)[number];

/**
 * Session lifecycle audit (W2-S02-c).
 *
 * Reuses Security Audit persistence. Does not add event types or redesign the store.
 */
@Injectable()
export class ExchangeSessionAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: ExchangeSessionAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
    provider: string;
  }): Promise<void> {
    await this.audit.record({
      eventType: 'connection.lifecycle',
      outcome: input.outcome,
      source: 'exchange-connectivity',
      attribution: {
        workspaceId: input.workspaceId,
        actorId: input.actorUserId,
        resourceType: 'connection',
        resourceId: input.connectionId,
      },
      payload: {
        session: true,
        provider: input.provider,
      },
    });
  }
}

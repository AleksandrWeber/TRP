import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';

export const EXCHANGE_CAPABILITY_AUDIT_OUTCOMES = [
  'capability_verification_started',
  'capability_verification_completed',
  'capability_verification_failed',
] as const;

export type ExchangeCapabilityAuditOutcome = (typeof EXCHANGE_CAPABILITY_AUDIT_OUTCOMES)[number];

/**
 * Capability verification audit (W2-S02-d).
 *
 * Reuses Security Audit persistence. Does not add event types or redesign the store.
 */
@Injectable()
export class ExchangeCapabilityAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: ExchangeCapabilityAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
    provider: string;
  }): Promise<void> {
    await this.audit.record({
      eventType: 'connection.validation',
      outcome: input.outcome,
      source: 'exchange-connectivity',
      attribution: {
        workspaceId: input.workspaceId,
        actorId: input.actorUserId,
        resourceType: 'connection',
        resourceId: input.connectionId,
      },
      payload: {
        capabilityVerification: true,
        provider: input.provider,
      },
    });
  }
}

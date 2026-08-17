import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import type { ExchangeHandshakeOutcome } from './exchange-handshake.result';

export type ExchangeHandshakeAuditOutcome =
  'handshake_started' | 'handshake_succeeded' | 'handshake_failed';

@Injectable()
export class ExchangeHandshakeAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: ExchangeHandshakeAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
    provider: string;
    failure?: Exclude<ExchangeHandshakeOutcome, 'CONNECTED'>;
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
        handshake: true,
        provider: input.provider,
        ...(input.failure ? { failure: input.failure } : {}),
      },
    });
  }
}

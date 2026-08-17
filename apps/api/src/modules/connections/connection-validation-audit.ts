import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import type { ConnectionProvider } from './connection-catalog';

export type ConnectionValidationAuditOutcome = 'started' | 'succeeded' | 'failed';

@Injectable()
export class ConnectionValidationAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: ConnectionValidationAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
    provider: ConnectionProvider;
  }): Promise<void> {
    await this.audit.record({
      eventType: 'connection.validation',
      outcome: input.outcome,
      source: 'connections',
      attribution: {
        workspaceId: input.workspaceId,
        actorId: input.actorUserId,
        resourceType: 'connection',
        resourceId: input.connectionId,
      },
      payload: { provider: input.provider },
    });
  }
}

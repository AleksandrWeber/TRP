import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import type { ConnectionProvider } from './connection-catalog';

export type ConnectionLifecycleAuditOutcome =
  'credentials_replaced' | 'disconnected' | 'disabled' | 'revoked';

@Injectable()
export class ConnectionLifecycleAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(input: {
    outcome: ConnectionLifecycleAuditOutcome;
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
    provider: ConnectionProvider;
  }): Promise<void> {
    await this.audit.record({
      eventType: 'connection.lifecycle',
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

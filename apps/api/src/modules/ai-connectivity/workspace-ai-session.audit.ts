import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';

/**
 * Workspace AI Session audits (W2-S05-c).
 *
 * Emits AI Session Created / Closed through existing Security Audit
 * `connection.lifecycle`. Does not redesign Security Audit.
 */
@Injectable()
export class WorkspaceAiSessionAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async created(input: {
    workspaceId: string;
    actorUserId: string;
    sessionId: string;
  }): Promise<void> {
    await this.lifecycle('workspace_ai_session_created', input);
  }

  async closed(input: {
    workspaceId: string;
    actorUserId: string;
    sessionId: string;
  }): Promise<void> {
    await this.lifecycle('workspace_ai_session_closed', input);
  }

  private async lifecycle(
    outcome: 'workspace_ai_session_created' | 'workspace_ai_session_closed',
    input: {
      workspaceId: string;
      actorUserId: string;
      sessionId: string;
    },
  ): Promise<void> {
    await this.audit.record({
      eventType: 'connection.lifecycle',
      outcome,
      source: 'ai-connectivity',
      attribution: {
        workspaceId: input.workspaceId,
        actorId: input.actorUserId,
        resourceType: 'ai_session',
        resourceId: input.sessionId,
      },
      payload: {
        workspaceAiSession: true,
      },
    });
  }
}

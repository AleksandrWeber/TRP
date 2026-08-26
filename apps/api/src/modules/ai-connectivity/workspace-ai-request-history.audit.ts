import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';

/**
 * Workspace AI Request History audits (W2-S05-d).
 *
 * Emits AI History Viewed through existing Security Audit `connection.lifecycle`.
 * Does not redesign Security Audit.
 */
@Injectable()
export class WorkspaceAiRequestHistoryAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async viewed(input: {
    workspaceId: string;
    actorUserId: string;
    historyId?: string;
  }): Promise<void> {
    await this.audit.record({
      eventType: 'connection.lifecycle',
      outcome: 'workspace_ai_history_viewed',
      source: 'ai-connectivity',
      attribution: {
        workspaceId: input.workspaceId,
        actorId: input.actorUserId,
        resourceType: 'ai_request_history',
        resourceId: input.historyId ?? input.workspaceId,
      },
      payload: {
        workspaceAiRequestHistory: true,
        ...(input.historyId ? { historyId: input.historyId } : { list: true }),
      },
    });
  }
}

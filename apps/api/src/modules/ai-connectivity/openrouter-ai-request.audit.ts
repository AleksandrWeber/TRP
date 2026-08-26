import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import type {
  WorkspaceAiRequestFailureReason,
  WorkspaceAiRequestStatus,
} from './openrouter-ai-request';

/**
 * Workspace AI request audits (W2-S05-b).
 *
 * Emits AI Request Executed / Failed through existing Security Audit
 * `connection.validation` event type. Does not redesign Security Audit.
 */
@Injectable()
export class OpenRouterAiRequestAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async executed(input: {
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
  }): Promise<void> {
    await this.record({
      outcome: 'openrouter_ai_request_executed',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: input.connectionId,
      status: 'SUCCEEDED',
    });
  }

  async failed(input: {
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
    failureReason: WorkspaceAiRequestFailureReason;
  }): Promise<void> {
    await this.record({
      outcome: 'openrouter_ai_request_failed',
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      connectionId: input.connectionId,
      status:
        input.failureReason === 'CONNECTION_UNAVAILABLE' || input.failureReason === 'NOT_CONFIGURED'
          ? 'UNAVAILABLE'
          : 'FAILED',
      failureReason: input.failureReason,
    });
  }

  private async record(input: {
    outcome: 'openrouter_ai_request_executed' | 'openrouter_ai_request_failed';
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
    status: WorkspaceAiRequestStatus;
    failureReason?: WorkspaceAiRequestFailureReason;
  }): Promise<void> {
    await this.audit.record({
      eventType: 'connection.validation',
      outcome: input.outcome,
      source: 'ai-connectivity',
      attribution: {
        workspaceId: input.workspaceId,
        actorId: input.actorUserId,
        resourceType: 'connection',
        resourceId: input.connectionId,
      },
      payload: {
        openRouterAiRequest: true,
        provider: 'OPENROUTER',
        status: input.status,
        ...(input.failureReason ? { failureReason: input.failureReason } : {}),
      },
    });
  }
}

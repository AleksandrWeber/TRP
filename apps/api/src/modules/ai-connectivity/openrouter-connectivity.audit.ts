import { Injectable } from '@nestjs/common';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import type { OpenRouterConnectionTestOutcome } from './openrouter-connection-test.result';

/**
 * OpenRouter connectivity audits (W2-S05-a).
 *
 * Emits named product outcomes through existing Security Audit event types:
 * - OpenRouter Connection Created / Updated / Disabled → connection.lifecycle
 * - OpenRouter Connection Tested → connection.validation
 *
 * Does not redesign Security Audit.
 */
@Injectable()
export class OpenRouterConnectivityAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async created(input: {
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
  }): Promise<void> {
    await this.lifecycle('openrouter_connection_created', input);
  }

  async updated(input: {
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
  }): Promise<void> {
    await this.lifecycle('openrouter_connection_updated', input);
  }

  async disabled(input: {
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
  }): Promise<void> {
    await this.lifecycle('openrouter_connection_disabled', input);
  }

  async tested(input: {
    workspaceId: string;
    actorUserId: string;
    connectionId: string;
    outcome: OpenRouterConnectionTestOutcome;
  }): Promise<void> {
    await this.audit.record({
      eventType: 'connection.validation',
      outcome: 'openrouter_connection_tested',
      source: 'ai-connectivity',
      attribution: {
        workspaceId: input.workspaceId,
        actorId: input.actorUserId,
        resourceType: 'connection',
        resourceId: input.connectionId,
      },
      payload: {
        openRouterTest: true,
        provider: 'OPENROUTER',
        testOutcome: input.outcome,
      },
    });
  }

  private async lifecycle(
    outcome:
      | 'openrouter_connection_created'
      | 'openrouter_connection_updated'
      | 'openrouter_connection_disabled',
    input: {
      workspaceId: string;
      actorUserId: string;
      connectionId: string;
    },
  ): Promise<void> {
    await this.audit.record({
      eventType: 'connection.lifecycle',
      outcome,
      source: 'ai-connectivity',
      attribution: {
        workspaceId: input.workspaceId,
        actorId: input.actorUserId,
        resourceType: 'connection',
        resourceId: input.connectionId,
      },
      payload: { provider: 'OPENROUTER' },
    });
  }
}

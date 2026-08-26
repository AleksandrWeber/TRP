import { describe, expect, it } from 'vitest';
import { OpenRouterAiRequestAudit } from './openrouter-ai-request.audit';

describe('OpenRouterAiRequestAudit (W2-S05-b)', () => {
  it('emits AI Request Executed and Failed through Security Audit', async () => {
    const records: Array<{ eventType: string; outcome: string }> = [];
    const audit = new OpenRouterAiRequestAudit({
      record: async (input: { eventType: string; outcome: string }) => {
        records.push({ eventType: input.eventType, outcome: input.outcome });
      },
    } as never);

    await audit.executed({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      connectionId: 'conn-1',
    });
    await audit.failed({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      connectionId: 'conn-1',
      failureReason: 'AUTHENTICATION_FAILED',
    });

    expect(records).toEqual([
      { eventType: 'connection.validation', outcome: 'openrouter_ai_request_executed' },
      { eventType: 'connection.validation', outcome: 'openrouter_ai_request_failed' },
    ]);
  });
});

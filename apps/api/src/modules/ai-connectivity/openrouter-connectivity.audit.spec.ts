import { describe, expect, it } from 'vitest';
import { OpenRouterConnectivityAudit } from './openrouter-connectivity.audit';

describe('OpenRouterConnectivityAudit (W2-S05-a)', () => {
  it('emits OpenRouter connection lifecycle and test outcomes through Security Audit', async () => {
    const records: Array<{ eventType: string; outcome: string; payload: Record<string, unknown> }> =
      [];
    const audit = new OpenRouterConnectivityAudit({
      record: async (input: {
        eventType: string;
        outcome: string;
        payload?: Record<string, unknown>;
      }) => {
        records.push({
          eventType: input.eventType,
          outcome: input.outcome,
          payload: input.payload ?? {},
        });
      },
    } as never);

    await audit.created({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      connectionId: 'conn-1',
    });
    await audit.updated({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      connectionId: 'conn-1',
    });
    await audit.tested({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      connectionId: 'conn-1',
      outcome: 'CONNECTED',
    });
    await audit.disabled({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      connectionId: 'conn-1',
    });

    expect(records).toEqual([
      {
        eventType: 'connection.lifecycle',
        outcome: 'openrouter_connection_created',
        payload: { provider: 'OPENROUTER' },
      },
      {
        eventType: 'connection.lifecycle',
        outcome: 'openrouter_connection_updated',
        payload: { provider: 'OPENROUTER' },
      },
      {
        eventType: 'connection.validation',
        outcome: 'openrouter_connection_tested',
        payload: {
          openRouterTest: true,
          provider: 'OPENROUTER',
          testOutcome: 'CONNECTED',
        },
      },
      {
        eventType: 'connection.lifecycle',
        outcome: 'openrouter_connection_disabled',
        payload: { provider: 'OPENROUTER' },
      },
    ]);
  });
});

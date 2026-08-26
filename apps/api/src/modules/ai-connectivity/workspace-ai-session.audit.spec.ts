import { describe, expect, it, vi } from 'vitest';
import { WorkspaceAiSessionAudit } from './workspace-ai-session.audit';

describe('WorkspaceAiSessionAudit (W2-S05-c)', () => {
  it('emits AI Session Created through connection.lifecycle', async () => {
    const record = vi.fn(async () => undefined);
    const audit = new WorkspaceAiSessionAudit({ record } as never);

    await audit.created({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      sessionId: 'session-1',
    });

    expect(record).toHaveBeenCalledWith({
      eventType: 'connection.lifecycle',
      outcome: 'workspace_ai_session_created',
      source: 'ai-connectivity',
      attribution: {
        workspaceId: 'workspace-a',
        actorId: 'user-a',
        resourceType: 'ai_session',
        resourceId: 'session-1',
      },
      payload: { workspaceAiSession: true },
    });
  });

  it('emits AI Session Closed through connection.lifecycle', async () => {
    const record = vi.fn(async () => undefined);
    const audit = new WorkspaceAiSessionAudit({ record } as never);

    await audit.closed({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      sessionId: 'session-1',
    });

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'connection.lifecycle',
        outcome: 'workspace_ai_session_closed',
      }),
    );
  });
});

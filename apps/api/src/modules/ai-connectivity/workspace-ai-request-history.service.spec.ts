import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { WorkspaceAiRequestHistoryAudit } from './workspace-ai-request-history.audit';
import { WorkspaceAiRequestHistoryService } from './workspace-ai-request-history.service';

describe('WorkspaceAiRequestHistoryService (W2-S05-d)', () => {
  function prismaStub(state: {
    rows: Array<{
      id: string;
      workspaceId: string;
      sessionId: string;
      requestId: string;
      connectionId: string;
      executedAt: Date;
      status: string;
      model: string | null;
      durationMs: number;
    }>;
  }) {
    return {
      workspaceAiRequestHistory: {
        create: async ({
          data,
        }: {
          data: {
            id: string;
            workspaceId: string;
            sessionId: string;
            requestId: string;
            connectionId: string;
            executedAt: Date;
            status: string;
            model: string | null;
            durationMs: number;
          };
        }) => {
          state.rows.push(data);
          return data;
        },
        findMany: async ({
          where,
        }: {
          where: {
            workspaceId: string;
            sessionId?: string;
            status?: string;
            requestId?: string;
          };
        }) =>
          state.rows.filter(
            (row) =>
              row.workspaceId === where.workspaceId &&
              (where.sessionId ? row.sessionId === where.sessionId : true) &&
              (where.status ? row.status === where.status : true) &&
              (where.requestId ? row.requestId === where.requestId : true),
          ),
        findFirst: async ({ where }: { where: { id: string; workspaceId: string } }) =>
          state.rows.find((row) => row.id === where.id && row.workspaceId === where.workspaceId) ??
          null,
      },
    };
  }

  it('records history metadata without prompt or response bodies', async () => {
    const state = { rows: [] as never[] };
    const service = new WorkspaceAiRequestHistoryService(
      prismaStub(state) as never,
      { viewed: async () => undefined } as unknown as WorkspaceAiRequestHistoryAudit,
    );

    const view = await service.record({
      workspaceId: 'workspace-a',
      sessionId: 'session-1',
      requestId: 'req-1',
      connectionId: 'conn-1',
      executedAt: new Date('2026-08-26T19:30:00.000Z'),
      status: 'SUCCEEDED',
      model: 'openai/gpt-4o-mini',
      durationMs: 125,
    });

    expect(view).toMatchObject({
      workspaceId: 'workspace-a',
      sessionId: 'session-1',
      requestId: 'req-1',
      connectionId: 'conn-1',
      status: 'SUCCEEDED',
      model: 'openai/gpt-4o-mini',
      durationMs: 125,
      executedAt: '2026-08-26T19:30:00.000Z',
    });
    expect(JSON.stringify(view)).not.toContain('prompt');
    expect(JSON.stringify(view)).not.toContain('content');
  });

  it('lists and filters history within a workspace only', async () => {
    const executedAt = new Date('2026-08-26T19:30:00.000Z');
    const state = {
      rows: [
        {
          id: 'h-1',
          workspaceId: 'workspace-a',
          sessionId: 'session-1',
          requestId: 'req-1',
          connectionId: 'conn-1',
          executedAt,
          status: 'SUCCEEDED',
          model: 'm1',
          durationMs: 10,
        },
        {
          id: 'h-2',
          workspaceId: 'workspace-a',
          sessionId: 'session-2',
          requestId: 'req-2',
          connectionId: 'conn-1',
          executedAt,
          status: 'FAILED',
          model: null,
          durationMs: 5,
        },
        {
          id: 'h-3',
          workspaceId: 'workspace-b',
          sessionId: 'session-x',
          requestId: 'req-3',
          connectionId: 'conn-9',
          executedAt,
          status: 'SUCCEEDED',
          model: 'm1',
          durationMs: 8,
        },
      ],
    };
    const viewed: string[] = [];
    const service = new WorkspaceAiRequestHistoryService(
      prismaStub(state) as never,
      {
        viewed: async () => {
          viewed.push('list');
        },
      } as unknown as WorkspaceAiRequestHistoryAudit,
    );

    const all = await service.list('workspace-a', 'user-a');
    expect(all).toHaveLength(2);
    expect(all.every((item) => item.workspaceId === 'workspace-a')).toBe(true);

    const filtered = await service.list('workspace-a', 'user-a', {
      sessionId: 'session-1',
      status: 'SUCCEEDED',
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('h-1');
    expect(viewed).toEqual(['list', 'list']);
  });

  it('denies cross-workspace history get', async () => {
    const state = {
      rows: [
        {
          id: 'h-1',
          workspaceId: 'workspace-a',
          sessionId: 'session-1',
          requestId: 'req-1',
          connectionId: 'conn-1',
          executedAt: new Date('2026-08-26T19:30:00.000Z'),
          status: 'SUCCEEDED',
          model: null,
          durationMs: 1,
        },
      ],
    };
    const service = new WorkspaceAiRequestHistoryService(
      prismaStub(state) as never,
      { viewed: async () => undefined } as unknown as WorkspaceAiRequestHistoryAudit,
    );

    await expect(service.get('workspace-b', 'user-a', 'h-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('projects a single history entry and emits viewed audit', async () => {
    const state = {
      rows: [
        {
          id: 'h-1',
          workspaceId: 'workspace-a',
          sessionId: 'session-1',
          requestId: 'req-1',
          connectionId: 'conn-1',
          executedAt: new Date('2026-08-26T19:30:00.000Z'),
          status: 'SUCCEEDED',
          model: 'm1',
          durationMs: 42,
        },
      ],
    };
    const viewed: string[] = [];
    const service = new WorkspaceAiRequestHistoryService(
      prismaStub(state) as never,
      {
        viewed: async (input: { historyId?: string }) => {
          viewed.push(input.historyId ?? 'list');
        },
      } as unknown as WorkspaceAiRequestHistoryAudit,
    );

    const entry = await service.get('workspace-a', 'user-a', 'h-1');
    expect(entry.id).toBe('h-1');
    expect(entry.durationMs).toBe(42);
    expect(viewed).toEqual(['h-1']);
  });
});

describe('WorkspaceAiRequestHistoryAudit (W2-S05-d)', () => {
  it('emits AI History Viewed through connection.lifecycle', async () => {
    const record = vi.fn(async () => undefined);
    const audit = new WorkspaceAiRequestHistoryAudit({ record } as never);

    await audit.viewed({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      historyId: 'h-1',
    });

    expect(record).toHaveBeenCalledWith({
      eventType: 'connection.lifecycle',
      outcome: 'workspace_ai_history_viewed',
      source: 'ai-connectivity',
      attribution: {
        workspaceId: 'workspace-a',
        actorId: 'user-a',
        resourceType: 'ai_request_history',
        resourceId: 'h-1',
      },
      payload: {
        workspaceAiRequestHistory: true,
        historyId: 'h-1',
      },
    });
  });
});

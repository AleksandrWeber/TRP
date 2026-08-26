import { describe, expect, it } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WorkspaceAiSessionAudit } from './workspace-ai-session.audit';
import { WorkspaceAiSessionService } from './workspace-ai-session.service';

describe('WorkspaceAiSessionService (W2-S05-c)', () => {
  function prismaStub(state: {
    sessions: Array<{
      id: string;
      workspaceId: string;
      displayName: string;
      status: string;
      createdBy: string;
      createdAt: Date;
      closedAt: Date | null;
      updatedAt: Date;
      memberships: Array<{
        requestId: string;
        connectionId: string;
        status: string;
        requestedAt: Date;
      }>;
    }>;
  }) {
    return {
      workspaceAiSession: {
        findMany: async ({ where }: { where: { workspaceId: string } }) =>
          state.sessions.filter((row) => row.workspaceId === where.workspaceId),
        findFirst: async ({ where }: { where: { id: string; workspaceId: string } }) =>
          state.sessions.find(
            (row) => row.id === where.id && row.workspaceId === where.workspaceId,
          ) ?? null,
        create: async ({
          data,
        }: {
          data: {
            id: string;
            workspaceId: string;
            displayName: string;
            status: string;
            createdBy: string;
            createdAt: Date;
          };
        }) => {
          const row = {
            ...data,
            closedAt: null,
            updatedAt: data.createdAt,
            memberships: [] as Array<{
              requestId: string;
              connectionId: string;
              status: string;
              requestedAt: Date;
            }>,
          };
          state.sessions.push(row);
          return row;
        },
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { displayName?: string; status?: string; closedAt?: Date };
        }) => {
          const row = state.sessions.find((item) => item.id === where.id);
          if (!row) throw new Error('missing');
          if (data.displayName !== undefined) row.displayName = data.displayName;
          if (data.status !== undefined) row.status = data.status;
          if (data.closedAt !== undefined) row.closedAt = data.closedAt;
          row.updatedAt = new Date();
          return row;
        },
      },
      workspaceAiSessionRequest: {
        create: async ({
          data,
        }: {
          data: {
            id: string;
            sessionId: string;
            workspaceId: string;
            connectionId: string;
            requestId: string;
            status: string;
            requestedAt: Date;
          };
        }) => {
          const session = state.sessions.find((item) => item.id === data.sessionId);
          if (!session) throw new Error('missing session');
          session.memberships.push({
            requestId: data.requestId,
            connectionId: data.connectionId,
            status: data.status,
            requestedAt: data.requestedAt,
          });
          return data;
        },
      },
    };
  }

  it('creates an OPEN session with empty request membership', async () => {
    const state = { sessions: [] as never[] };
    const audits: string[] = [];
    const service = new WorkspaceAiSessionService(
      prismaStub(state) as never,
      {
        created: async () => {
          audits.push('created');
        },
        closed: async () => {
          audits.push('closed');
        },
      } as unknown as WorkspaceAiSessionAudit,
    );

    const view = await service.create({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      displayName: ' Ops Session ',
    });

    expect(view).toMatchObject({
      workspaceId: 'workspace-a',
      displayName: 'Ops Session',
      status: 'OPEN',
      createdBy: 'user-a',
      closedAt: null,
      requests: [],
    });
    expect(audits).toEqual(['created']);
  });

  it('lists only sessions owned by the workspace', async () => {
    const now = new Date('2026-08-26T19:00:00.000Z');
    const state = {
      sessions: [
        {
          id: 's-a',
          workspaceId: 'workspace-a',
          displayName: 'A',
          status: 'OPEN',
          createdBy: 'user-a',
          createdAt: now,
          closedAt: null,
          updatedAt: now,
          memberships: [],
        },
        {
          id: 's-b',
          workspaceId: 'workspace-b',
          displayName: 'B',
          status: 'OPEN',
          createdBy: 'user-b',
          createdAt: now,
          closedAt: null,
          updatedAt: now,
          memberships: [],
        },
      ],
    };
    const service = new WorkspaceAiSessionService(
      prismaStub(state) as never,
      {
        created: async () => undefined,
        closed: async () => undefined,
      } as unknown as WorkspaceAiSessionAudit,
    );

    const listed = await service.list('workspace-a');
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe('s-a');
  });

  it('denies cross-workspace session get', async () => {
    const now = new Date('2026-08-26T19:00:00.000Z');
    const state = {
      sessions: [
        {
          id: 's-a',
          workspaceId: 'workspace-a',
          displayName: 'A',
          status: 'OPEN',
          createdBy: 'user-a',
          createdAt: now,
          closedAt: null,
          updatedAt: now,
          memberships: [],
        },
      ],
    };
    const service = new WorkspaceAiSessionService(
      prismaStub(state) as never,
      {
        created: async () => undefined,
        closed: async () => undefined,
      } as unknown as WorkspaceAiSessionAudit,
    );

    await expect(service.get('workspace-b', 's-a')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('closes an open session and emits closed audit', async () => {
    const now = new Date('2026-08-26T19:00:00.000Z');
    const state = {
      sessions: [
        {
          id: 's-a',
          workspaceId: 'workspace-a',
          displayName: 'A',
          status: 'OPEN',
          createdBy: 'user-a',
          createdAt: now,
          closedAt: null,
          updatedAt: now,
          memberships: [],
        },
      ],
    };
    const audits: string[] = [];
    const service = new WorkspaceAiSessionService(
      prismaStub(state) as never,
      {
        created: async () => undefined,
        closed: async () => {
          audits.push('closed');
        },
      } as unknown as WorkspaceAiSessionAudit,
    );

    const view = await service.close({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      sessionId: 's-a',
    });
    expect(view.status).toBe('CLOSED');
    expect(view.closedAt).not.toBeNull();
    expect(audits).toEqual(['closed']);
  });

  it('rejects rename and grouping after close', async () => {
    const now = new Date('2026-08-26T19:00:00.000Z');
    const state = {
      sessions: [
        {
          id: 's-a',
          workspaceId: 'workspace-a',
          displayName: 'A',
          status: 'CLOSED',
          createdBy: 'user-a',
          createdAt: now,
          closedAt: now,
          updatedAt: now,
          memberships: [],
        },
      ],
    };
    const service = new WorkspaceAiSessionService(
      prismaStub(state) as never,
      {
        created: async () => undefined,
        closed: async () => undefined,
      } as unknown as WorkspaceAiSessionAudit,
    );

    await expect(
      service.rename({ workspaceId: 'workspace-a', sessionId: 's-a', displayName: 'B' }),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(service.assertOpenForGrouping('workspace-a', 's-a')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('attaches request membership without storing prompt or response bodies', async () => {
    const now = new Date('2026-08-26T19:00:00.000Z');
    const state = {
      sessions: [
        {
          id: 's-a',
          workspaceId: 'workspace-a',
          displayName: 'A',
          status: 'OPEN',
          createdBy: 'user-a',
          createdAt: now,
          closedAt: null,
          updatedAt: now,
          memberships: [] as Array<{
            requestId: string;
            connectionId: string;
            status: string;
            requestedAt: Date;
          }>,
        },
      ],
    };
    const service = new WorkspaceAiSessionService(
      prismaStub(state) as never,
      {
        created: async () => undefined,
        closed: async () => undefined,
      } as unknown as WorkspaceAiSessionAudit,
    );

    await service.attachRequest({
      workspaceId: 'workspace-a',
      sessionId: 's-a',
      connectionId: 'conn-1',
      requestId: 'req-1',
      status: 'SUCCEEDED',
      requestedAt: now,
    });

    const view = await service.get('workspace-a', 's-a');
    expect(view.requests).toEqual([
      {
        requestId: 'req-1',
        connectionId: 'conn-1',
        status: 'SUCCEEDED',
        requestedAt: now.toISOString(),
      },
    ]);
    expect(JSON.stringify(view)).not.toContain('prompt');
    expect(JSON.stringify(view)).not.toContain('content');
  });
});

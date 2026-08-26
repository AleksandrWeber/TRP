import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { WorkspaceAiSessionAudit } from './workspace-ai-session.audit';
import {
  isWorkspaceAiSessionStatus,
  type WorkspaceAiSessionRequestMembershipView,
  type WorkspaceAiSessionStatus,
  type WorkspaceAiSessionView,
} from './workspace-ai-session';

/**
 * Workspace AI Session Foundation (W2-S05-c).
 *
 * Owns session lifecycle and request membership metadata only.
 * Does not call OpenRouter. Does not store prompts or responses.
 * Does not reconstruct conversation context for AI.
 */
@Injectable()
export class WorkspaceAiSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionAudit: WorkspaceAiSessionAudit,
  ) {}

  async list(workspaceId: string): Promise<WorkspaceAiSessionView[]> {
    const rows = await this.prisma.workspaceAiSession.findMany({
      where: { workspaceId },
      include: { memberships: { orderBy: { requestedAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.view(row));
  }

  async get(workspaceId: string, sessionId: string): Promise<WorkspaceAiSessionView> {
    return this.view(await this.getRow(workspaceId, sessionId));
  }

  async create(input: {
    workspaceId: string;
    actorUserId: string;
    displayName: string;
  }): Promise<WorkspaceAiSessionView> {
    const now = new Date();
    const row = await this.prisma.workspaceAiSession.create({
      data: {
        id: randomUUID(),
        workspaceId: input.workspaceId,
        displayName: input.displayName.trim(),
        status: 'OPEN',
        createdBy: input.actorUserId,
        createdAt: now,
      },
      include: { memberships: true },
    });
    await this.sessionAudit
      .created({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        sessionId: row.id,
      })
      .catch(() => undefined);
    return this.view(row);
  }

  async rename(input: {
    workspaceId: string;
    sessionId: string;
    displayName: string;
  }): Promise<WorkspaceAiSessionView> {
    const existing = await this.getRow(input.workspaceId, input.sessionId);
    if (sessionStatus(existing.status) === 'CLOSED') {
      throw new ConflictException('Closed sessions cannot be renamed.');
    }
    const row = await this.prisma.workspaceAiSession.update({
      where: { id: existing.id },
      data: { displayName: input.displayName.trim() },
      include: { memberships: { orderBy: { requestedAt: 'asc' } } },
    });
    return this.view(row);
  }

  async close(input: {
    workspaceId: string;
    actorUserId: string;
    sessionId: string;
  }): Promise<WorkspaceAiSessionView> {
    const existing = await this.getRow(input.workspaceId, input.sessionId);
    if (sessionStatus(existing.status) === 'CLOSED') {
      throw new ConflictException('Session is already closed.');
    }
    const row = await this.prisma.workspaceAiSession.update({
      where: { id: existing.id },
      data: { status: 'CLOSED', closedAt: new Date() },
      include: { memberships: { orderBy: { requestedAt: 'asc' } } },
    });
    await this.sessionAudit
      .closed({
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        sessionId: row.id,
      })
      .catch(() => undefined);
    return this.view(row);
  }

  /**
   * Asserts the session is OPEN in this workspace. Does not load prior prompts.
   */
  async assertOpenForGrouping(workspaceId: string, sessionId: string): Promise<void> {
    const row = await this.prisma.workspaceAiSession.findFirst({
      where: { id: sessionId, workspaceId },
    });
    if (!row) {
      throw new NotFoundException('AI Session not found');
    }
    if (sessionStatus(row.status) !== 'OPEN') {
      throw new ConflictException('AI requests can only be grouped under an open session.');
    }
  }

  /**
   * Records request membership metadata only. Never stores prompt or response body.
   */
  async attachRequest(input: {
    workspaceId: string;
    sessionId: string;
    connectionId: string;
    requestId: string;
    status: string;
    requestedAt: Date;
  }): Promise<void> {
    await this.assertOpenForGrouping(input.workspaceId, input.sessionId);
    await this.prisma.workspaceAiSessionRequest.create({
      data: {
        id: randomUUID(),
        sessionId: input.sessionId,
        workspaceId: input.workspaceId,
        connectionId: input.connectionId,
        requestId: input.requestId,
        status: input.status,
        requestedAt: input.requestedAt,
      },
    });
  }

  private async getRow(workspaceId: string, sessionId: string) {
    const row = await this.prisma.workspaceAiSession.findFirst({
      where: { id: sessionId, workspaceId },
      include: { memberships: { orderBy: { requestedAt: 'asc' } } },
    });
    if (!row) {
      throw new NotFoundException('AI Session not found');
    }
    return row;
  }

  private view(row: {
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
  }): WorkspaceAiSessionView {
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      displayName: row.displayName,
      status: sessionStatus(row.status),
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      closedAt: row.closedAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
      requests: row.memberships.map((item): WorkspaceAiSessionRequestMembershipView => ({
        requestId: item.requestId,
        connectionId: item.connectionId,
        status: item.status,
        requestedAt: item.requestedAt.toISOString(),
      })),
    };
  }
}

function sessionStatus(status: string): WorkspaceAiSessionStatus {
  if (isWorkspaceAiSessionStatus(status)) {
    return status;
  }
  return 'CLOSED';
}

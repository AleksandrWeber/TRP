import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { WorkspaceAiRequestHistoryAudit } from './workspace-ai-request-history.audit';
import type {
  WorkspaceAiRequestHistoryFilter,
  WorkspaceAiRequestHistoryView,
} from './workspace-ai-request-history';

/**
 * Workspace AI Request History Foundation (W2-S05-d).
 *
 * Owns read-only history projection and metadata recording.
 * Does not store prompts or responses. Does not replay requests.
 * Does not influence AI Gateway / OpenRouter execution.
 */
@Injectable()
export class WorkspaceAiRequestHistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly historyAudit: WorkspaceAiRequestHistoryAudit,
  ) {}

  /**
   * Records history metadata for a session-scoped request.
   * Callers must supply sessionId — history entries belong to exactly one Session.
   */
  async record(input: {
    workspaceId: string;
    sessionId: string;
    requestId: string;
    connectionId: string;
    executedAt: Date;
    status: string;
    model: string | null;
    durationMs: number;
  }): Promise<WorkspaceAiRequestHistoryView> {
    const row = await this.prisma.workspaceAiRequestHistory.create({
      data: {
        id: randomUUID(),
        workspaceId: input.workspaceId,
        sessionId: input.sessionId,
        requestId: input.requestId,
        connectionId: input.connectionId,
        executedAt: input.executedAt,
        status: input.status,
        model: input.model,
        durationMs: Math.max(0, Math.floor(input.durationMs)),
      },
    });
    return this.view(row);
  }

  async list(
    workspaceId: string,
    actorUserId: string,
    filter: WorkspaceAiRequestHistoryFilter = {},
  ): Promise<WorkspaceAiRequestHistoryView[]> {
    const rows = await this.prisma.workspaceAiRequestHistory.findMany({
      where: {
        workspaceId,
        ...(filter.sessionId ? { sessionId: filter.sessionId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.requestId ? { requestId: filter.requestId } : {}),
      },
      orderBy: { executedAt: 'desc' },
    });
    await this.historyAudit.viewed({ workspaceId, actorUserId }).catch(() => undefined);
    return rows.map((row) => this.view(row));
  }

  async get(
    workspaceId: string,
    actorUserId: string,
    historyId: string,
  ): Promise<WorkspaceAiRequestHistoryView> {
    const row = await this.prisma.workspaceAiRequestHistory.findFirst({
      where: { id: historyId, workspaceId },
    });
    if (!row) {
      throw new NotFoundException('AI Request History entry not found');
    }
    await this.historyAudit
      .viewed({ workspaceId, actorUserId, historyId: row.id })
      .catch(() => undefined);
    return this.view(row);
  }

  private view(row: {
    id: string;
    workspaceId: string;
    sessionId: string;
    requestId: string;
    connectionId: string;
    executedAt: Date;
    status: string;
    model: string | null;
    durationMs: number;
  }): WorkspaceAiRequestHistoryView {
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      sessionId: row.sessionId,
      requestId: row.requestId,
      connectionId: row.connectionId,
      executedAt: row.executedAt.toISOString(),
      status: row.status,
      model: row.model,
      durationMs: row.durationMs,
    };
  }
}

import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { OpenRouterCompletionError, OpenRouterProvider } from '../ai/providers/openrouter.provider';
import type { Role } from '../identity/role';
import { PrismaService } from '../../storage/prisma/prisma.module';
import { OpenRouterAiRequestAudit } from './openrouter-ai-request.audit';
import { OpenRouterAiRequestCache } from './openrouter-ai-request.cache';
import {
  WORKSPACE_AI_REQUEST_SYSTEM_PROMPT,
  vendorVisibleMessageForAiRequest,
  type WorkspaceAiRequestFailureReason,
  type WorkspaceAiRequestStatus,
  type WorkspaceAiRequestView,
} from './openrouter-ai-request';
import { projectOpenRouterConnectivityStatus } from './openrouter-connectivity.status';
import { OpenRouterKeyResolution } from './openrouter-key-resolution';
import { WorkspaceAiRequestHistoryService } from './workspace-ai-request-history.service';
import { WorkspaceAiSessionService } from './workspace-ai-session.service';

export type WorkspaceAiRequestInput = Readonly<{
  workspaceId: string;
  actorUserId: string;
  actorRole: Role;
  connectionId: string;
  prompt: string;
  sessionId?: string;
}>;

export const OPENROUTER_AI_REQUEST_TIMEOUT_MS = Symbol('OPENROUTER_AI_REQUEST_TIMEOUT_MS');
export const OPENROUTER_AI_REQUEST_CLOCK = Symbol('OPENROUTER_AI_REQUEST_CLOCK');
export const DEFAULT_OPENROUTER_AI_REQUEST_TIMEOUT_MS = 30_000;

export type OpenRouterAiRequestClock = Readonly<{ nowMs: () => number }>;
export const SYSTEM_OPENROUTER_AI_REQUEST_CLOCK: OpenRouterAiRequestClock = {
  nowMs: () => Date.now(),
};

/**
 * Workspace AI Request Foundation (W2-S05-b) with optional Session grouping (W2-S05-c)
 * and History recording (W2-S05-d).
 *
 * Executes a single AI request using the workspace Vault-backed OpenRouter key.
 * Optional sessionId records membership and history metadata only — prior session
 * requests are never sent to the model. Does not store conversations or AI memory.
 */
@Injectable()
export class OpenRouterAiRequestService {
  private readonly timeoutMs: number;
  private readonly clock: OpenRouterAiRequestClock;

  constructor(
    private readonly prisma: PrismaService,
    private readonly keys: OpenRouterKeyResolution,
    private readonly provider: OpenRouterProvider,
    private readonly cache: OpenRouterAiRequestCache,
    private readonly requestAudit: OpenRouterAiRequestAudit,
    private readonly sessions: WorkspaceAiSessionService,
    private readonly history: WorkspaceAiRequestHistoryService,
    @Optional() @Inject(OPENROUTER_AI_REQUEST_TIMEOUT_MS) timeoutMs?: number,
    @Optional() @Inject(OPENROUTER_AI_REQUEST_CLOCK) clock?: OpenRouterAiRequestClock,
  ) {
    this.timeoutMs = timeoutMs ?? DEFAULT_OPENROUTER_AI_REQUEST_TIMEOUT_MS;
    this.clock = clock ?? SYSTEM_OPENROUTER_AI_REQUEST_CLOCK;
  }

  lastResult(workspaceId: string, connectionId: string): WorkspaceAiRequestView | null {
    return this.cache.get(workspaceId, connectionId);
  }

  clear(workspaceId: string, connectionId: string): void {
    this.cache.clear(workspaceId, connectionId);
  }

  async execute(input: WorkspaceAiRequestInput): Promise<WorkspaceAiRequestView> {
    const startedAtMs = this.clock.nowMs();
    const requestId = randomUUID();
    const sessionId = input.sessionId?.trim() || null;
    if (sessionId) {
      await this.sessions.assertOpenForGrouping(input.workspaceId, sessionId);
    }

    const prompt = input.prompt.trim();
    if (prompt === '') {
      return this.finish(input, requestId, sessionId, startedAtMs, {
        status: 'FAILED',
        content: null,
        model: null,
        failureReason: 'VALIDATION_FAILED',
      });
    }

    const connection = await this.prisma.connectionRecord.findFirst({
      where: { id: input.connectionId, workspaceId: input.workspaceId },
    });
    if (!connection) {
      throw new NotFoundException('Connection not found');
    }
    if (connection.connectionType !== 'AI' || connection.provider !== 'OPENROUTER') {
      return this.finish(input, requestId, sessionId, startedAtMs, {
        status: 'FAILED',
        content: null,
        model: null,
        failureReason: 'VALIDATION_FAILED',
      });
    }

    const credentialsStored = connection.vaultSecretId !== null && connection.status !== 'REVOKED';
    const connectivity = projectOpenRouterConnectivityStatus({
      connectionType: connection.connectionType,
      provider: connection.provider,
      status: connection.status,
      credentialsStored,
    });

    if (connectivity === 'NOT_CONFIGURED' || connection.vaultSecretId === null) {
      return this.finish(input, requestId, sessionId, startedAtMs, {
        status: 'UNAVAILABLE',
        content: null,
        model: null,
        failureReason: 'NOT_CONFIGURED',
      });
    }
    if (connectivity !== 'CONNECTED') {
      return this.finish(input, requestId, sessionId, startedAtMs, {
        status: 'UNAVAILABLE',
        content: null,
        model: null,
        failureReason: 'CONNECTION_UNAVAILABLE',
      });
    }

    const resolved = await this.keys.resolve({
      workspaceId: input.workspaceId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      expectedVaultSecretId: connection.vaultSecretId,
    });
    if (resolved === null) {
      return this.finish(input, requestId, sessionId, startedAtMs, {
        status: 'UNAVAILABLE',
        content: null,
        model: null,
        failureReason: 'NOT_CONFIGURED',
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      // Session membership and History never enter this call — only the current prompt.
      const result = await this.provider.completeWithKey(
        resolved.apiKey,
        WORKSPACE_AI_REQUEST_SYSTEM_PROMPT,
        prompt,
        controller.signal,
      );
      if (controller.signal.aborted) {
        return this.finish(input, requestId, sessionId, startedAtMs, {
          status: 'FAILED',
          content: null,
          model: null,
          failureReason: 'TIMEOUT',
        });
      }
      return this.finish(input, requestId, sessionId, startedAtMs, {
        status: 'SUCCEEDED',
        content: result.content,
        model: result.model,
        failureReason: null,
      });
    } catch (error) {
      return this.finish(input, requestId, sessionId, startedAtMs, {
        status: mapErrorStatus(error),
        content: null,
        model: null,
        failureReason: mapErrorReason(error),
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private async finish(
    input: WorkspaceAiRequestInput,
    requestId: string,
    sessionId: string | null,
    startedAtMs: number,
    result: {
      status: WorkspaceAiRequestStatus;
      content: string | null;
      model: string | null;
      failureReason: WorkspaceAiRequestFailureReason | null;
    },
  ): Promise<WorkspaceAiRequestView> {
    const endedAtMs = this.clock.nowMs();
    const requestedAt = new Date(endedAtMs);
    const durationMs = Math.max(0, endedAtMs - startedAtMs);
    const view: WorkspaceAiRequestView = {
      requestId,
      status: result.status,
      content: result.content,
      model: result.model,
      failureReason: result.failureReason,
      vendorVisibleMessage: vendorVisibleMessageForAiRequest(result.status, result.failureReason),
      requestedAt: requestedAt.toISOString(),
      connectionId: input.connectionId,
      workspaceId: input.workspaceId,
      sessionId,
    };
    this.cache.set(input.workspaceId, input.connectionId, view);

    if (sessionId) {
      await this.sessions
        .attachRequest({
          workspaceId: input.workspaceId,
          sessionId,
          connectionId: input.connectionId,
          requestId,
          status: result.status,
          requestedAt,
        })
        .catch(() => undefined);
      // History is metadata only — never stores prompt/response; never replayed to the model.
      await this.history
        .record({
          workspaceId: input.workspaceId,
          sessionId,
          requestId,
          connectionId: input.connectionId,
          executedAt: requestedAt,
          status: result.status,
          model: result.model,
          durationMs,
        })
        .catch(() => undefined);
    }

    if (result.status === 'SUCCEEDED') {
      await this.requestAudit
        .executed({
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          connectionId: input.connectionId,
        })
        .catch(() => undefined);
    } else {
      await this.requestAudit
        .failed({
          workspaceId: input.workspaceId,
          actorUserId: input.actorUserId,
          connectionId: input.connectionId,
          failureReason: result.failureReason ?? 'REQUEST_FAILED',
        })
        .catch(() => undefined);
    }
    return view;
  }
}

function mapErrorReason(error: unknown): WorkspaceAiRequestFailureReason {
  if (error instanceof OpenRouterCompletionError) {
    switch (error.kind) {
      case 'authentication_failed':
        return 'AUTHENTICATION_FAILED';
      case 'provider_unavailable':
        return 'PROVIDER_UNAVAILABLE';
      case 'timeout':
        return 'TIMEOUT';
      case 'failed':
        return 'REQUEST_FAILED';
    }
  }
  return 'REQUEST_FAILED';
}

function mapErrorStatus(error: unknown): WorkspaceAiRequestStatus {
  if (
    error instanceof OpenRouterCompletionError &&
    (error.kind === 'provider_unavailable' || error.kind === 'authentication_failed')
  ) {
    return 'UNAVAILABLE';
  }
  return 'FAILED';
}

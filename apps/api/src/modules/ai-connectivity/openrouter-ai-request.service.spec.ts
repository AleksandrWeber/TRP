import { describe, expect, it, vi } from 'vitest';
import { Role } from '../identity/role';
import { OpenRouterAiRequestAudit } from './openrouter-ai-request.audit';
import { OpenRouterAiRequestCache } from './openrouter-ai-request.cache';
import { OpenRouterAiRequestService } from './openrouter-ai-request.service';
import { OpenRouterKeyResolution } from './openrouter-key-resolution';
import { WorkspaceAiRequestHistoryService } from './workspace-ai-request-history.service';
import { WorkspaceAiSessionService } from './workspace-ai-session.service';

describe('OpenRouterAiRequestService (W2-S05-b/c/d)', () => {
  function prismaWith(row: {
    id: string;
    workspaceId: string;
    provider: string;
    connectionType: string;
    vaultSecretId: string | null;
    status: string;
  }) {
    return {
      connectionRecord: {
        findFirst: async ({ where }: { where: { id: string; workspaceId: string } }) =>
          row.id === where.id && row.workspaceId === where.workspaceId ? row : null,
      },
    };
  }

  function sessionsStub(overrides?: Partial<WorkspaceAiSessionService>) {
    return {
      assertOpenForGrouping: async () => undefined,
      attachRequest: async () => undefined,
      ...overrides,
    } as unknown as WorkspaceAiSessionService;
  }

  function historyStub(overrides?: Partial<WorkspaceAiRequestHistoryService>) {
    return {
      record: async () => ({
        id: 'hist-1',
        workspaceId: 'workspace-a',
        sessionId: 'session-1',
        requestId: 'req-1',
        connectionId: 'conn-1',
        executedAt: '2026-08-26T18:00:00.000Z',
        status: 'SUCCEEDED',
        model: null,
        durationMs: 0,
      }),
      ...overrides,
    } as unknown as WorkspaceAiRequestHistoryService;
  }

  function buildService(input: {
    row: {
      id: string;
      workspaceId: string;
      provider: string;
      connectionType: string;
      vaultSecretId: string | null;
      status: string;
    };
    completeWithKey?: ReturnType<typeof vi.fn>;
    keys?: OpenRouterKeyResolution;
    sessions?: WorkspaceAiSessionService;
    history?: WorkspaceAiRequestHistoryService;
    auditEvents?: string[];
    clockMs?: number;
  }) {
    const auditEvents = input.auditEvents ?? [];
    return new OpenRouterAiRequestService(
      prismaWith(input.row) as never,
      input.keys ??
        ({
          resolve: async () => ({ vaultSecretId: 'vault-or-1', apiKey: 'sk-or-workspace-a' }),
        } as unknown as OpenRouterKeyResolution),
      {
        completeWithKey: input.completeWithKey ?? vi.fn(async () => ({ content: 'x', model: 'm' })),
      } as never,
      new OpenRouterAiRequestCache(),
      {
        executed: async () => {
          auditEvents.push('executed');
        },
        failed: async () => {
          auditEvents.push('failed');
        },
      } as unknown as OpenRouterAiRequestAudit,
      input.sessions ?? sessionsStub(),
      input.history ?? historyStub(),
      1_000,
      { nowMs: () => input.clockMs ?? Date.parse('2026-08-26T18:00:00.000Z') },
    );
  }

  it('executes one AI request with the workspace Vault OpenRouter key', async () => {
    const completeWithKey = vi.fn(async () => ({
      content: 'Hello from OpenRouter',
      model: 'openai/gpt-4o-mini',
    }));
    const auditEvents: string[] = [];
    const service = buildService({
      row: {
        id: 'conn-1',
        workspaceId: 'workspace-a',
        provider: 'OPENROUTER',
        connectionType: 'AI',
        vaultSecretId: 'vault-or-1',
        status: 'CONNECTED',
      },
      completeWithKey,
      keys: {
        resolve: async (resolveInput: { workspaceId: string; expectedVaultSecretId: string }) => {
          expect(resolveInput.workspaceId).toBe('workspace-a');
          expect(resolveInput.expectedVaultSecretId).toBe('vault-or-1');
          return { vaultSecretId: 'vault-or-1', apiKey: 'sk-or-workspace-a' };
        },
      } as unknown as OpenRouterKeyResolution,
      auditEvents,
    });

    const view = await service.execute({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      connectionId: 'conn-1',
      prompt: 'Summarize connectivity.',
    });

    expect(view).toMatchObject({
      status: 'SUCCEEDED',
      content: 'Hello from OpenRouter',
      model: 'openai/gpt-4o-mini',
      failureReason: null,
      workspaceId: 'workspace-a',
      connectionId: 'conn-1',
      sessionId: null,
      requestedAt: '2026-08-26T18:00:00.000Z',
    });
    expect(view.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(completeWithKey).toHaveBeenCalledTimes(1);
    expect(completeWithKey).toHaveBeenCalledWith(
      'sk-or-workspace-a',
      expect.any(String),
      'Summarize connectivity.',
      expect.any(AbortSignal),
    );
    expect(auditEvents).toEqual(['executed']);
    expect(service.lastResult('workspace-a', 'conn-1')?.content).toBe('Hello from OpenRouter');
  });

  it('groups a request under an open session without sending prior requests to the model', async () => {
    const completeWithKey = vi.fn(async () => ({
      content: 'Independent answer',
      model: 'openai/gpt-4o-mini',
    }));
    const assertOpenForGrouping = vi.fn(async () => undefined);
    const attachRequest = vi.fn(async () => undefined);
    const record = vi.fn(
      async (input: { sessionId: string; requestId: string; durationMs: number }) => ({
        id: 'hist-1',
        workspaceId: 'workspace-a',
        sessionId: input.sessionId,
        requestId: input.requestId,
        connectionId: 'conn-1',
        executedAt: '2026-08-26T18:00:00.000Z',
        status: 'SUCCEEDED',
        model: 'openai/gpt-4o-mini',
        durationMs: input.durationMs,
      }),
    );
    const service = buildService({
      row: {
        id: 'conn-1',
        workspaceId: 'workspace-a',
        provider: 'OPENROUTER',
        connectionType: 'AI',
        vaultSecretId: 'vault-or-1',
        status: 'CONNECTED',
      },
      completeWithKey,
      sessions: sessionsStub({ assertOpenForGrouping, attachRequest }),
      history: historyStub({ record }),
    });

    const view = await service.execute({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      connectionId: 'conn-1',
      prompt: 'Second independent request',
      sessionId: 'session-1',
    });

    expect(view.sessionId).toBe('session-1');
    expect(assertOpenForGrouping).toHaveBeenCalledWith('workspace-a', 'session-1');
    expect(attachRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-a',
        sessionId: 'session-1',
        connectionId: 'conn-1',
        requestId: view.requestId,
        status: 'SUCCEEDED',
      }),
    );
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-a',
        sessionId: 'session-1',
        requestId: view.requestId,
        status: 'SUCCEEDED',
        model: 'openai/gpt-4o-mini',
      }),
    );
    expect(completeWithKey).toHaveBeenCalledWith(
      'sk-or-workspace-a',
      expect.any(String),
      'Second independent request',
      expect.any(AbortSignal),
    );
    expect(completeWithKey).toHaveBeenCalledTimes(1);
  });

  it('does not record history for requests without a session', async () => {
    const record = vi.fn();
    const service = buildService({
      row: {
        id: 'conn-1',
        workspaceId: 'workspace-a',
        provider: 'OPENROUTER',
        connectionType: 'AI',
        vaultSecretId: 'vault-or-1',
        status: 'CONNECTED',
      },
      history: historyStub({ record }),
    });

    await service.execute({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      connectionId: 'conn-1',
      prompt: 'No session grouping',
    });

    expect(record).not.toHaveBeenCalled();
  });

  it('fails honestly when OpenRouter connectivity is unavailable', async () => {
    const completeWithKey = vi.fn();
    const service = buildService({
      row: {
        id: 'conn-1',
        workspaceId: 'workspace-a',
        provider: 'OPENROUTER',
        connectionType: 'AI',
        vaultSecretId: 'vault-or-1',
        status: 'DISCONNECTED',
      },
      completeWithKey,
    });

    const view = await service.execute({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      connectionId: 'conn-1',
      prompt: 'Hello',
    });

    expect(view.status).toBe('UNAVAILABLE');
    expect(view.failureReason).toBe('CONNECTION_UNAVAILABLE');
    expect(view.content).toBeNull();
    expect(completeWithKey).not.toHaveBeenCalled();
  });

  it('maps invalid API key failures without echoing secrets', async () => {
    const { OpenRouterCompletionError } = await import('../ai/providers/openrouter.provider');
    const service = buildService({
      row: {
        id: 'conn-1',
        workspaceId: 'workspace-a',
        provider: 'OPENROUTER',
        connectionType: 'AI',
        vaultSecretId: 'vault-or-1',
        status: 'CONNECTED',
      },
      keys: {
        resolve: async () => ({ vaultSecretId: 'vault-or-1', apiKey: 'sk-or-bad' }),
      } as unknown as OpenRouterKeyResolution,
      completeWithKey: vi.fn(async () => {
        throw new OpenRouterCompletionError(
          'authentication_failed',
          'OpenRouter rejected the API key.',
        );
      }),
    });

    const view = await service.execute({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      connectionId: 'conn-1',
      prompt: 'Hello',
    });

    expect(view.status).toBe('UNAVAILABLE');
    expect(view.failureReason).toBe('AUTHENTICATION_FAILED');
    expect(JSON.stringify(view)).not.toContain('sk-or-bad');
  });

  it('denies cross-workspace AI requests', async () => {
    const service = buildService({
      row: {
        id: 'conn-1',
        workspaceId: 'workspace-a',
        provider: 'OPENROUTER',
        connectionType: 'AI',
        vaultSecretId: 'vault-or-1',
        status: 'CONNECTED',
      },
    });

    await expect(
      service.execute({
        workspaceId: 'workspace-b',
        actorUserId: 'user-a',
        actorRole: Role.Admin,
        connectionId: 'conn-1',
        prompt: 'Hello',
      }),
    ).rejects.toThrow('Connection not found');
  });

  it('rejects empty prompts as validation failures', async () => {
    const service = buildService({
      row: {
        id: 'conn-1',
        workspaceId: 'workspace-a',
        provider: 'OPENROUTER',
        connectionType: 'AI',
        vaultSecretId: 'vault-or-1',
        status: 'CONNECTED',
      },
    });

    const view = await service.execute({
      workspaceId: 'workspace-a',
      actorUserId: 'user-a',
      actorRole: Role.Admin,
      connectionId: 'conn-1',
      prompt: '   ',
    });
    expect(view.status).toBe('FAILED');
    expect(view.failureReason).toBe('VALIDATION_FAILED');
  });
});

import { describe, expect, it, vi } from 'vitest';
import type { SessionHandoffIntentView } from '../trading-orchestrator/ports/trading-orchestrator.port';
import { createTradingSession } from '../trading-session/domain/trading-session';
import { SessionHandoffConsumerService } from './session-handoff-consumer.service';
import { sessionHandoffIdempotencyKey } from './session-handoff-idempotency';

const at = '2026-08-15T14:00:00.000Z';

const intent: SessionHandoffIntentView = Object.freeze({
  sessionHandoffIntentId: 'handoff-1',
  orchestrationRunId: 'run-1',
  selectionDecisionId: 'sel-1',
  workspaceId: 'ws-1',
  deploymentBindRef: 'dep-approved',
  enforcementDecisionRef: 'gate-1',
  status: 'proposed',
  proposedAt: at,
  authorityClass: 'orchestration_artifact',
  isOrder: false,
  isRiskDecision: false,
  createsSession: false,
});

function createdSession() {
  return createTradingSession({
    id: 'session-1',
    workspaceId: 'ws-1',
    paperAccountId: 'acct-1',
    deploymentId: 'dep-approved',
    origin: 'strategy',
    actorId: 'op-1',
    correlationId: 'handoff-1',
    idempotencyKey: sessionHandoffIdempotencyKey('handoff-1'),
    createdAt: at,
    recordedAt: at,
  });
}

function harness(overrides?: {
  intent?: SessionHandoffIntentView | null;
  existing?: ReturnType<typeof createdSession> | null;
}) {
  const created = createdSession();
  const sessions = {
    create: vi.fn(async () => created),
    get: vi.fn(async () => created),
  };
  const sessionRepository = {
    findByIdempotencyKey: vi.fn(async () => overrides?.existing ?? null),
  };
  const resolvedIntent = overrides && 'intent' in overrides ? overrides.intent : intent;
  const orchestratorQuery = {
    getSessionHandoffIntent: vi.fn(() => resolvedIntent),
    listOrchestrationRuns: vi.fn(() =>
      resolvedIntent
        ? [
            Object.freeze({
              orchestrationRunId: resolvedIntent.orchestrationRunId,
              workspaceId: 'ws-1',
              exchangeScopeId: 'binance-spot',
              marketSymbol: 'BTCUSDT',
              modeContext: 'paper' as const,
              status: 'handed_off',
              marketStateId: 'ms-1',
              sessionHandoffIntentId: resolvedIntent.sessionHandoffIntentId,
              requiresConfirmation: false,
              createdAt: at,
              updatedAt: at,
              authorityClass: 'orchestration_artifact' as const,
              forcesTrade: false as const,
              approvesRisk: false as const,
              submitsOrders: false as const,
            }),
          ]
        : [],
    ),
  };
  const consumer = new SessionHandoffConsumerService(
    sessions as never,
    sessionRepository as never,
    orchestratorQuery as never,
  );
  return { consumer, sessions, sessionRepository, orchestratorQuery, created };
}

const command = Object.freeze({
  workspaceId: 'ws-1',
  paperAccountId: 'acct-1',
  deploymentId: 'dep-approved',
  origin: 'strategy' as const,
  idempotencyKey: 'cc-session:dep-approved:acct-1',
  actorId: 'op-1',
  createdAt: at,
  recordedAt: at,
});

describe('PC-15 15-a — SessionHandoffConsumerService', () => {
  it('creates a paper session from an explicit SessionHandoffIntent without mutating it', async () => {
    const { consumer, sessions, orchestratorQuery, created } = harness();
    const session = await consumer.consumeOrCreate({
      ...command,
      sessionHandoffIntentId: 'handoff-1',
    });
    expect(session.id).toBe(created.id);
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deploymentId: 'dep-approved',
        origin: 'strategy',
        idempotencyKey: 'handoff:handoff-1',
      }),
    );
    expect(orchestratorQuery.getSessionHandoffIntent).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      sessionHandoffIntentId: 'handoff-1',
    });
    expect(intent.createsSession).toBe(false);
    expect(intent.isOrder).toBe(false);
    expect(intent.isRiskDecision).toBe(false);
  });

  it('auto-matches an unconsumed handoff for the same Deployment bind', async () => {
    const { consumer, sessions } = harness();
    await consumer.consumeOrCreate(command);
    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deploymentId: 'dep-approved',
        idempotencyKey: 'handoff:handoff-1',
      }),
    );
  });

  it('falls back to ordinary Session create when no handoff exists', async () => {
    const { consumer, sessions } = harness({ intent: null });
    await consumer.consumeOrCreate(command);
    expect(sessions.create).toHaveBeenCalledWith(command);
  });

  it('does not auto-match a handoff that was already consumed', async () => {
    const { consumer, sessions } = harness({ existing: createdSession() });
    await consumer.consumeOrCreate(command);
    expect(sessions.create).toHaveBeenCalledWith(command);
  });

  it('rejects a missing explicit intent and a deployment mismatch', async () => {
    const missing = harness({ intent: null });
    await expect(
      missing.consumer.consumeOrCreate({ ...command, sessionHandoffIntentId: 'missing' }),
    ).rejects.toThrow('session handoff intent not found in workspace');

    const mismatched = harness();
    await expect(
      mismatched.consumer.consumeOrCreate({
        ...command,
        deploymentId: 'other-dep',
        sessionHandoffIntentId: 'handoff-1',
      }),
    ).rejects.toThrow('session handoff intent deployment bind does not match');
  });

  it('projects consumed handoff with createsSession false', async () => {
    const { consumer } = harness();
    const view = await consumer.projectConsume('ws-1', 'session-1');
    expect(view).toEqual({
      sessionHandoffIntentId: 'handoff-1',
      orchestrationRunId: 'run-1',
      consumed: true,
      createsSession: false,
    });
  });
});

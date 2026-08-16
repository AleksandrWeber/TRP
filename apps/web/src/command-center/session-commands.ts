import type { TradingSessionBotView } from '../shared/api';

export type SessionLifecycleAction = 'start' | 'pause' | 'resume' | 'stop';

export type ActionAvailability = 'available' | 'unavailable';

export type SessionCommandApi = {
  startTradingSession: (id: string) => Promise<TradingSessionBotView>;
  pauseTradingSession: (id: string) => Promise<TradingSessionBotView>;
  resumeTradingSession: (id: string) => Promise<TradingSessionBotView>;
  stopTradingSession: (id: string) => Promise<TradingSessionBotView>;
};

export function hasUsableLease(session: TradingSessionBotView): boolean {
  return session.leaseOwnerId !== null && session.fencingToken !== null;
}

export function sessionActionAvailability(
  session: TradingSessionBotView,
): Record<SessionLifecycleAction, ActionAvailability> {
  const leaseOk = hasUsableLease(session);
  const status = session.status.toLowerCase();
  return {
    start: status === 'created' ? 'available' : 'unavailable',
    pause: leaseOk && status === 'running' ? 'available' : 'unavailable',
    resume: leaseOk && status === 'paused' ? 'available' : 'unavailable',
    stop: leaseOk && (status === 'running' || status === 'paused') ? 'available' : 'unavailable',
  };
}

export function dialogCopy(action: SessionLifecycleAction, sessionId: string) {
  if (action === 'start') {
    return {
      title: 'Start session?',
      message: `Start ${sessionId}. Trading Session will arm paper runtime if the bound Deployment is approved. Closed-candle market events then evaluate the runtime and may create paper orders. This does not authorize live capital.`,
      confirmLabel: 'Start',
      variant: 'default' as const,
    };
  }
  if (action === 'pause') {
    return {
      title: 'Pause session?',
      message: `Pause ${sessionId}. Evaluation will halt safely. This does not delete ledger history or close positions.`,
      confirmLabel: 'Pause',
      variant: 'default' as const,
    };
  }
  if (action === 'resume') {
    return {
      title: 'Resume session?',
      message: `Resume ${sessionId}. Continues only if fail-closed policy allows. This does not bypass kill or recovery locks.`,
      confirmLabel: 'Resume',
      variant: 'default' as const,
    };
  }
  return {
    title: 'Stop session?',
    message: `Stop ${sessionId}. This ends the worker lifecycle and is irreversible for this run. This does not delete ledger history.`,
    confirmLabel: 'Stop',
    variant: 'danger' as const,
  };
}

/**
 * Issues a lifecycle command and waits for backend confirmation.
 * No optimistic UI — caller refreshes projections after success.
 */
export async function executeSessionLifecycleCommand(
  api: SessionCommandApi,
  action: SessionLifecycleAction,
  sessionId: string,
): Promise<TradingSessionBotView> {
  if (action === 'start') return api.startTradingSession(sessionId);
  if (action === 'pause') return api.pauseTradingSession(sessionId);
  if (action === 'resume') return api.resumeTradingSession(sessionId);
  return api.stopTradingSession(sessionId);
}

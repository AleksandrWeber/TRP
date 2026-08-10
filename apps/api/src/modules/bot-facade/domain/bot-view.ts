import type {
  TradingSession,
  TradingSessionOrigin,
} from '../../trading-session/domain/trading-session';
import { TradingSessionStatus } from '../../trading-session/domain/trading-session-status';

/**
 * RC-19 Epic 2 — Bot is a product facade over Trading Session.
 * Bot id === Trading Session id. No separate persistence or runtime.
 */

/** Bot Status ≡ Trading Session runtime status (same values, product name). */
export type BotStatus = TradingSessionStatus;

export const BotStatus = TradingSessionStatus;

/**
 * Bot Mission ≡ Strategy Deployment binding on the Session
 * (immutable configuration identity — not a second config store).
 */
export type BotMission = Readonly<{
  deploymentId: string;
}>;

/**
 * Product-facing Bot projection. All fields derive from one Trading Session.
 * `id` and `tradingSessionId` are always identical.
 */
export type BotView = Readonly<{
  /** Product Bot id — identical to Trading Session id. */
  id: string;
  /** Canonical runtime id (same value as `id`). */
  tradingSessionId: string;
  workspaceId: string;
  exchangeScopeId: string;
  paperAccountId: string;
  /** Bot Status ≡ Session runtime status. */
  status: BotStatus;
  /** Bot State ≡ Session lifecycle state (same field as status). */
  state: BotStatus;
  /** Bot Mission ≡ Deployment configuration bound to the Session. */
  mission: BotMission;
  origin: TradingSessionOrigin;
  version: number;
  failureReason: string | null;
  createdAt: string;
  recordedAt: string;
  actorId: string;
  correlationId: string | null;
  leaseOwnerId: string | null;
  fencingToken: number | null;
}>;

export function toBotView(session: TradingSession): BotView {
  return Object.freeze({
    id: session.id,
    tradingSessionId: session.id,
    workspaceId: session.workspaceId,
    exchangeScopeId: session.exchangeScopeId,
    paperAccountId: session.paperAccountId,
    status: session.status,
    state: session.status,
    mission: Object.freeze({ deploymentId: session.deploymentId }),
    origin: session.origin,
    version: session.version,
    failureReason: session.failureReason,
    createdAt: session.createdAt,
    recordedAt: session.recordedAt,
    actorId: session.actorId,
    correlationId: session.correlationId,
    leaseOwnerId: session.lease?.ownerId ?? null,
    fencingToken: session.lease?.fencingToken ?? null,
  });
}

export function assertBotIsSessionFacade(bot: BotView): void {
  if (bot.id !== bot.tradingSessionId) {
    throw new Error('Bot facade invariant violated: bot id must equal tradingSessionId');
  }
}

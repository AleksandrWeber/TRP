import {
  OrderSide,
  OrderType,
  type CreateOrderIntentInput,
  type OrderMarketCheckpoint,
} from './order-intent';

/**
 * Minimal Signal Intent fact consumed by Orders (US221 / ADR-012 / ADR-017).
 * Owned as an Orders intake contract — not a Runtime evaluation import.
 * Runtime produces the fact; Orders never invokes Runtime evaluation.
 */
export type SignalIntentIntake = Readonly<{
  id: string;
  intentHash: string;
  workspaceId: string;
  sessionId: string;
  instrument: string;
  direction: 'buy' | 'sell';
  marketCheckpoint: OrderMarketCheckpoint;
  generatedAt: string;
  actorId: string;
  correlationId: string | null;
}>;

export type ProposeOrderFromSignalIntentNoAction = Readonly<{
  kind: 'NO_ACTION';
  reason?: string;
}>;

export type ProposeOrderFromSignalIntentAction = Readonly<{
  kind: 'SIGNAL_INTENT';
  signalIntent: SignalIntentIntake;
  paperAccountId: string;
  sessionFencingToken: number;
  quantity: string;
  type?: OrderType;
  limitPrice?: string | null;
  recordedAt: string;
  eligibilityCheckedAt: string;
  actorId?: string;
  correlationId?: string | null;
}>;

export type ProposeOrderFromSignalIntentCommand =
  ProposeOrderFromSignalIntentNoAction | ProposeOrderFromSignalIntentAction;

export type ProposeOrderFromSignalIntentMapping =
  | Readonly<{ kind: 'NO_ACTION'; reason: string }>
  | Readonly<{
      kind: 'SIGNAL_INTENT';
      create: CreateOrderIntentInput;
      eligibilityCheckedAt: string;
    }>;

export const SIGNAL_INTENT_IDEMPOTENCY_PREFIX = 'signal-intent:';

/**
 * Pure Signal Intent → Order Intent mapping (US221).
 * NO_ACTION produces no Order Intent. Strategy origin + immutable Signal
 * Intent reference are structural. Idempotency keys derive from Signal Intent
 * identity so duplicate processing is effectively-once at the Orders boundary.
 */
export function mapProposeOrderFromSignalIntent(
  command: ProposeOrderFromSignalIntentCommand,
): ProposeOrderFromSignalIntentMapping {
  if (command.kind === 'NO_ACTION') {
    return Object.freeze({
      kind: 'NO_ACTION',
      reason: command.reason?.trim() || 'NO_ACTION',
    });
  }

  const signal = command.signalIntent;
  assertSignalIntentIntake(signal);
  const side = signal.direction === 'buy' ? OrderSide.BUY : OrderSide.SELL;
  const type = command.type ?? OrderType.MARKET;
  const create: CreateOrderIntentInput = Object.freeze({
    clientOrderId: signal.id,
    idempotencyKey: `${SIGNAL_INTENT_IDEMPOTENCY_PREFIX}${signal.intentHash}`,
    workspaceId: signal.workspaceId,
    paperAccountId: command.paperAccountId,
    tradingSessionId: signal.sessionId,
    sessionFencingToken: command.sessionFencingToken,
    mode: 'paper',
    origin: 'strategy',
    signalIntentId: signal.id,
    signalIntentHash: signal.intentHash,
    instrument: signal.instrument,
    side,
    type,
    quantity: command.quantity,
    limitPrice: command.limitPrice,
    reduceOnly: side === OrderSide.SELL ? true : undefined,
    marketCheckpoint: Object.freeze({ ...signal.marketCheckpoint }),
    actorId: command.actorId?.trim() || signal.actorId,
    correlationId: command.correlationId ?? signal.correlationId ?? undefined,
    occurredAt: signal.generatedAt,
    recordedAt: command.recordedAt,
  });

  return Object.freeze({
    kind: 'SIGNAL_INTENT',
    create,
    eligibilityCheckedAt: command.eligibilityCheckedAt,
  });
}

function assertSignalIntentIntake(signal: SignalIntentIntake): void {
  if (!signal.id?.trim()) throw new Error('signal intent id is required');
  if (!signal.intentHash?.trim()) throw new Error('signal intent hash is required');
  if (!signal.workspaceId?.trim()) throw new Error('signal intent workspace id is required');
  if (!signal.sessionId?.trim()) throw new Error('signal intent session id is required');
  if (signal.direction !== 'buy' && signal.direction !== 'sell') {
    throw new Error('signal intent direction must be buy or sell');
  }
}

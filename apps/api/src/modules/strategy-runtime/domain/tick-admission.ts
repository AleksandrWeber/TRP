import {
  CLOSED_CANDLE_TICK_EVENT_TYPE,
  createClosedCandleTickEvent,
  isClosedCandleTickEventType,
  type ClosedCandleTickEvent,
  type ClosedCandleTickEventInput,
} from './closed-candle-tick';
import {
  assertRuntimeLeaseValid,
  createRuntimeLeaseProof,
  type RuntimeLeaseProof,
  type RuntimeLeaseProofInput,
} from './runtime-lease-proof';
import type { StrategyCheckpoint } from './strategy-checkpoint';

/**
 * Deterministic semantic tick admission outcomes (US218).
 * Admission only — no strategy scoring, Intent emission, trading side-effects,
 * or checkpoint advance.
 */
export const TickAdmissionStatus = {
  ADMITTED: 'ADMITTED',
  REJECTED_NOT_CLOSED_CANDLE: 'REJECTED_NOT_CLOSED_CANDLE',
  REJECTED_LEASE_INVALID: 'REJECTED_LEASE_INVALID',
  REJECTED_DUPLICATE: 'REJECTED_DUPLICATE',
  REJECTED_STALE: 'REJECTED_STALE',
  REJECTED_OUT_OF_ORDER: 'REJECTED_OUT_OF_ORDER',
  REJECTED_STREAM_MISMATCH: 'REJECTED_STREAM_MISMATCH',
  REJECTED_RUNTIME_NOT_ARMED: 'REJECTED_RUNTIME_NOT_ARMED',
} as const;

export type TickAdmissionStatus = (typeof TickAdmissionStatus)[keyof typeof TickAdmissionStatus];

export type TickAdmissionResult = Readonly<{
  status: TickAdmissionStatus;
  admitted: boolean;
  reason: string;
  eventId: string | null;
  streamId: string | null;
  sequence: number | null;
}>;

export type AdmitClosedCandleTickInput = Readonly<{
  event: ClosedCandleTickEvent | ClosedCandleTickEventInput;
  lease: RuntimeLeaseProof | RuntimeLeaseProofInput;
  checkpoint: StrategyCheckpoint | null;
  expectedSessionId: string;
  expectedWorkspaceId: string;
  nowIso: string;
}>;

/**
 * Admit a semantic closed-candle tick under a valid Session lease.
 * Pure domain gate — does not score strategies or mutate checkpoints.
 */
export function admitClosedCandleTick(input: AdmitClosedCandleTickInput): TickAdmissionResult {
  const declaredType =
    typeof input.event.eventType === 'string' ? input.event.eventType.trim() : '';
  if (declaredType !== '' && !isClosedCandleTickEventType(declaredType)) {
    return rejected(
      TickAdmissionStatus.REJECTED_NOT_CLOSED_CANDLE,
      'event is not a closed candle',
      {
        eventId: optionalString(input.event, 'eventId'),
        streamId: optionalString(input.event, 'streamId'),
        sequence: optionalSequence(input.event),
      },
    );
  }

  let event: ClosedCandleTickEvent;
  try {
    event = createClosedCandleTickEvent({
      eventType: declaredType || CLOSED_CANDLE_TICK_EVENT_TYPE,
      eventId: input.event.eventId,
      workspaceId: input.event.workspaceId,
      streamId: input.event.streamId,
      sequence: input.event.sequence,
      openTime: input.event.openTime,
      closeTime: input.event.closeTime,
      instrument: input.event.instrument,
      timeframe: input.event.timeframe,
    });
  } catch (error) {
    return rejected(
      TickAdmissionStatus.REJECTED_NOT_CLOSED_CANDLE,
      error instanceof Error ? error.message : String(error),
      {
        eventId: optionalString(input.event, 'eventId'),
        streamId: optionalString(input.event, 'streamId'),
        sequence: optionalSequence(input.event),
      },
    );
  }

  const expectedWorkspaceId = required(input.expectedWorkspaceId, 'expected workspace id');
  if (event.workspaceId !== expectedWorkspaceId) {
    return rejected(
      TickAdmissionStatus.REJECTED_LEASE_INVALID,
      'tick workspace must match runtime workspace',
      {
        eventId: event.eventId,
        streamId: event.streamId,
        sequence: event.sequence,
      },
    );
  }

  try {
    const lease = createRuntimeLeaseProof({
      sessionId: input.lease.sessionId,
      fencingToken: input.lease.fencingToken,
      ownerId: input.lease.ownerId,
      expiresAt: input.lease.expiresAt,
      sessionStatus: input.lease.sessionStatus,
    });
    assertRuntimeLeaseValid(lease, input.expectedSessionId, input.nowIso);
  } catch (error) {
    return rejected(
      TickAdmissionStatus.REJECTED_LEASE_INVALID,
      error instanceof Error ? error.message : String(error),
      {
        eventId: event.eventId,
        streamId: event.streamId,
        sequence: event.sequence,
      },
    );
  }

  const checkpoint = input.checkpoint;
  if (checkpoint === null) {
    return admitted(event, 'first closed-candle tick admitted (no checkpoint)');
  }

  if (checkpoint.sessionId !== input.expectedSessionId) {
    return rejected(
      TickAdmissionStatus.REJECTED_LEASE_INVALID,
      'checkpoint session does not match runtime session',
      {
        eventId: event.eventId,
        streamId: event.streamId,
        sequence: event.sequence,
      },
    );
  }

  if (checkpoint.workspaceId !== expectedWorkspaceId) {
    return rejected(
      TickAdmissionStatus.REJECTED_LEASE_INVALID,
      'checkpoint workspace does not match runtime workspace',
      {
        eventId: event.eventId,
        streamId: event.streamId,
        sequence: event.sequence,
      },
    );
  }

  const last = checkpoint.lastProcessedCandle;
  if (event.streamId !== last.streamId) {
    return rejected(
      TickAdmissionStatus.REJECTED_STREAM_MISMATCH,
      'tick stream id does not match checkpoint stream',
      {
        eventId: event.eventId,
        streamId: event.streamId,
        sequence: event.sequence,
      },
    );
  }

  if (
    event.eventId === checkpoint.lastProcessedEventId ||
    (event.sequence === last.sequence && event.openTime === last.openTime)
  ) {
    return rejected(TickAdmissionStatus.REJECTED_DUPLICATE, 'duplicate closed-candle tick', {
      eventId: event.eventId,
      streamId: event.streamId,
      sequence: event.sequence,
    });
  }

  if (event.sequence < last.sequence || event.openTime < last.openTime) {
    return rejected(TickAdmissionStatus.REJECTED_STALE, 'stale closed-candle tick', {
      eventId: event.eventId,
      streamId: event.streamId,
      sequence: event.sequence,
    });
  }

  if (event.sequence === last.sequence) {
    return rejected(
      TickAdmissionStatus.REJECTED_OUT_OF_ORDER,
      'closed-candle sequence collides without duplicate identity',
      {
        eventId: event.eventId,
        streamId: event.streamId,
        sequence: event.sequence,
      },
    );
  }

  if (event.sequence !== last.sequence + 1 || event.openTime <= last.openTime) {
    return rejected(
      TickAdmissionStatus.REJECTED_OUT_OF_ORDER,
      'closed-candle tick is out of order relative to checkpoint',
      {
        eventId: event.eventId,
        streamId: event.streamId,
        sequence: event.sequence,
      },
    );
  }

  return admitted(event, 'closed-candle tick admitted');
}

function admitted(event: ClosedCandleTickEvent, reason: string): TickAdmissionResult {
  return Object.freeze({
    status: TickAdmissionStatus.ADMITTED,
    admitted: true,
    reason,
    eventId: event.eventId,
    streamId: event.streamId,
    sequence: event.sequence,
  });
}

function rejected(
  status: Exclude<TickAdmissionStatus, typeof TickAdmissionStatus.ADMITTED>,
  reason: string,
  identity: { eventId: string | null; streamId: string | null; sequence: number | null },
): TickAdmissionResult {
  return Object.freeze({
    status,
    admitted: false,
    reason,
    eventId: identity.eventId,
    streamId: identity.streamId,
    sequence: identity.sequence,
  });
}

function optionalString(
  event: ClosedCandleTickEvent | ClosedCandleTickEventInput,
  key: 'eventId' | 'streamId',
): string | null {
  const value = event[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function optionalSequence(
  event: ClosedCandleTickEvent | ClosedCandleTickEventInput,
): number | null {
  return typeof event.sequence === 'number' && Number.isInteger(event.sequence)
    ? event.sequence
    : null;
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

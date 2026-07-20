import { randomUUID } from 'node:crypto';
import { isTimeframe, type Timeframe } from '../../market-data/timeframe';
import {
  DuplicateRecoveryCompletionError,
  DuplicateRecoveryFailureError,
  DuplicateTradingSessionFailureError,
  DuplicateRuntimeLeaseError,
  ExpiredRuntimeLeaseError,
  InvalidRecoveryTimestampError,
  InvalidRuntimeHeartbeatTimestampError,
  InvalidLifecycleTimestampError,
  InvalidTradingSessionTransitionError,
  MissingRuntimeLeaseError,
  MissingRecoveryReasonError,
  MissingFailureReasonError,
  RecoveryAlreadyCompletedError,
  RecoveryInProgressError,
  RecoveryNotEligibleError,
  RecoveryNotInProgressError,
  RuntimeLeaseOwnerMismatchError,
} from './trading-session-errors';
import { RuntimeLease, type RuntimeLeaseProperties } from './runtime-lease';
import type { TradingSessionDomainEvent } from './trading-session-events';

export enum ExecutionMode {
  PAPER = 'PAPER',
  LIVE = 'LIVE',
  RESEARCH = 'RESEARCH',
}

export enum SessionState {
  CREATED = 'CREATED',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  PAUSING = 'PAUSING',
  PAUSED = 'PAUSED',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  FAILED = 'FAILED',
}

export enum RecoveryStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  ELIGIBLE = 'ELIGIBLE',
  RECOVERING = 'RECOVERING',
  RECOVERED = 'RECOVERED',
  FAILED = 'FAILED',
}

export const DEFAULT_RUNTIME_LEASE_DURATION_MS = 30_000;

const ALLOWED_TRANSITIONS: Readonly<Record<SessionState, ReadonlySet<SessionState>>> =
  Object.freeze({
    [SessionState.CREATED]: new Set([SessionState.STARTING]),
    [SessionState.STARTING]: new Set([SessionState.RUNNING, SessionState.FAILED]),
    [SessionState.RUNNING]: new Set([
      SessionState.PAUSING,
      SessionState.STOPPING,
      SessionState.FAILED,
    ]),
    [SessionState.PAUSING]: new Set([SessionState.PAUSED, SessionState.FAILED]),
    [SessionState.PAUSED]: new Set([
      SessionState.RUNNING,
      SessionState.STOPPING,
      SessionState.FAILED,
    ]),
    [SessionState.STOPPING]: new Set([SessionState.STOPPED, SessionState.FAILED]),
    [SessionState.STOPPED]: new Set<SessionState>(),
    [SessionState.FAILED]: new Set<SessionState>(),
  });

export type TradingSessionProperties = Readonly<{
  sessionId: string;
  workspaceId: string;
  deploymentId: string;
  strategyId: string;
  executionMode: ExecutionMode;
  marketType: string;
  exchange: string;
  symbol: string;
  timeframe: Timeframe;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  stoppedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  currentState: SessionState;
  metadataVersion: number;
  runtimeLease: RuntimeLeaseProperties | null;
  lastLeaseVersion: number;
  recoveryStatus?: RecoveryStatus;
  recoveryId?: string | null;
  recoveryAttempt?: number;
  recoveryStartedAt?: string | null;
  recoveryCompletedAt?: string | null;
  recoveryFailedAt?: string | null;
  recoveryFailureReason?: string | null;
}>;

export type RecoveryStateProperties = Readonly<{
  recoveryStatus: RecoveryStatus;
  recoveryId: string | null;
  recoveryAttempt: number;
  recoveryStartedAt: string | null;
  recoveryCompletedAt: string | null;
  recoveryFailedAt: string | null;
  recoveryFailureReason: string | null;
}>;

export type CreateTradingSessionProperties = Readonly<
  Omit<
    TradingSessionProperties,
    | 'updatedAt'
    | 'startedAt'
    | 'stoppedAt'
    | 'failedAt'
    | 'failureReason'
    | 'currentState'
    | 'runtimeLease'
    | 'lastLeaseVersion'
    | 'recoveryStatus'
    | 'recoveryId'
    | 'recoveryAttempt'
    | 'recoveryStartedAt'
    | 'recoveryCompletedAt'
    | 'recoveryFailedAt'
    | 'recoveryFailureReason'
  > & {
    updatedAt?: string;
  }
>;

export type AcquireRuntimeLeaseOptions = Readonly<{
  acquiredAt?: string;
  expiresAt?: string;
  heartbeatTimeoutMs?: number;
}>;

/**
 * Pure, immutable Trading Session aggregate for US184-US185.
 *
 * The existing US156 runtime session model remains separate until the
 * runtime ownership migration in US186.
 */
export class TradingSession {
  readonly sessionId: string;
  readonly workspaceId: string;
  readonly deploymentId: string;
  readonly strategyId: string;
  readonly executionMode: ExecutionMode;
  readonly marketType: string;
  readonly exchange: string;
  readonly symbol: string;
  readonly timeframe: Timeframe;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly startedAt: string | null;
  readonly stoppedAt: string | null;
  readonly failedAt: string | null;
  readonly failureReason: string | null;
  readonly metadataVersion: number;
  readonly recoveryId: string | null;
  readonly recoveryAttempt: number;
  readonly recoveryStartedAt: string | null;
  readonly recoveryCompletedAt: string | null;
  readonly recoveryFailedAt: string | null;
  readonly recoveryFailureReason: string | null;
  private readonly state: SessionState;
  private readonly lease: RuntimeLease | null;
  private readonly lastLeaseVersion: number;
  private readonly recovery: RecoveryStateProperties;
  private readonly pendingDomainEvents: readonly TradingSessionDomainEvent[];

  private constructor(
    properties: TradingSessionProperties,
    domainEvents: readonly TradingSessionDomainEvent[] = [],
  ) {
    const normalizedProperties = withRecoveryDefaults(properties);
    validateProperties(normalizedProperties);

    this.sessionId = required(normalizedProperties.sessionId, 'sessionId');
    this.workspaceId = required(normalizedProperties.workspaceId, 'workspaceId');
    this.deploymentId = required(normalizedProperties.deploymentId, 'deploymentId');
    this.strategyId = required(normalizedProperties.strategyId, 'strategyId');
    this.executionMode = normalizedProperties.executionMode;
    this.marketType = required(normalizedProperties.marketType, 'marketType');
    this.exchange = required(normalizedProperties.exchange, 'exchange');
    this.symbol = required(normalizedProperties.symbol, 'symbol');
    this.timeframe = normalizedProperties.timeframe;
    this.createdAt = normalizedProperties.createdAt;
    this.updatedAt = normalizedProperties.updatedAt;
    this.startedAt = normalizedProperties.startedAt;
    this.stoppedAt = normalizedProperties.stoppedAt;
    this.failedAt = normalizedProperties.failedAt;
    this.failureReason = normalizedProperties.failureReason?.trim() ?? null;
    this.state = normalizedProperties.currentState;
    this.metadataVersion = normalizedProperties.metadataVersion;
    this.lease =
      normalizedProperties.runtimeLease === null
        ? null
        : RuntimeLease.restore(normalizedProperties.runtimeLease);
    this.lastLeaseVersion = normalizedProperties.lastLeaseVersion;
    this.recovery = Object.freeze({
      recoveryStatus: normalizedProperties.recoveryStatus,
      recoveryId: normalizedProperties.recoveryId,
      recoveryAttempt: normalizedProperties.recoveryAttempt,
      recoveryStartedAt: normalizedProperties.recoveryStartedAt,
      recoveryCompletedAt: normalizedProperties.recoveryCompletedAt,
      recoveryFailedAt: normalizedProperties.recoveryFailedAt,
      recoveryFailureReason: normalizedProperties.recoveryFailureReason?.trim() ?? null,
    });
    this.recoveryId = this.recovery.recoveryId;
    this.recoveryAttempt = this.recovery.recoveryAttempt;
    this.recoveryStartedAt = this.recovery.recoveryStartedAt;
    this.recoveryCompletedAt = this.recovery.recoveryCompletedAt;
    this.recoveryFailedAt = this.recovery.recoveryFailedAt;
    this.recoveryFailureReason = this.recovery.recoveryFailureReason;
    this.pendingDomainEvents = Object.freeze([...domainEvents]);

    Object.freeze(this);
  }

  static create(properties: CreateTradingSessionProperties): TradingSession {
    return new TradingSession({
      ...properties,
      updatedAt: properties.updatedAt ?? properties.createdAt,
      startedAt: null,
      stoppedAt: null,
      failedAt: null,
      failureReason: null,
      currentState: SessionState.CREATED,
      runtimeLease: null,
      lastLeaseVersion: 0,
      recoveryStatus: RecoveryStatus.NOT_REQUIRED,
      recoveryId: null,
      recoveryAttempt: 0,
      recoveryStartedAt: null,
      recoveryCompletedAt: null,
      recoveryFailedAt: null,
      recoveryFailureReason: null,
    });
  }

  /** Validates and restores an aggregate from a repository snapshot. */
  static restore(properties: TradingSessionProperties): TradingSession {
    return new TradingSession(properties);
  }

  canTransitionTo(nextState: SessionState): boolean {
    return isSessionState(nextState) && ALLOWED_TRANSITIONS[this.state].has(nextState);
  }

  start(occurredAt?: string): TradingSession {
    return this.transitionTo(SessionState.STARTING, occurredAt);
  }

  pause(occurredAt?: string): TradingSession {
    return this.transitionTo(SessionState.PAUSING, occurredAt);
  }

  resume(occurredAt?: string): TradingSession {
    return this.transitionTo(SessionState.RUNNING, occurredAt);
  }

  stop(occurredAt?: string): TradingSession {
    return this.transitionTo(SessionState.STOPPING, occurredAt);
  }

  fail(reason: string, occurredAt?: string): TradingSession {
    if (this.isFailed()) {
      throw new DuplicateTradingSessionFailureError();
    }
    const normalizedReason = typeof reason === 'string' ? reason.trim() : '';
    if (normalizedReason === '') {
      throw new MissingFailureReasonError();
    }

    return this.applyTransition(
      SessionState.FAILED,
      resolveOccurredAt(occurredAt, this.updatedAt),
      {
        failureReason: normalizedReason,
      },
    );
  }

  transitionTo(nextState: SessionState, occurredAt?: string): TradingSession {
    return this.applyTransition(nextState, resolveOccurredAt(occurredAt, this.updatedAt));
  }

  currentState(): SessionState {
    return this.state;
  }

  isRunning(): boolean {
    return this.state === SessionState.RUNNING;
  }

  isPaused(): boolean {
    return this.state === SessionState.PAUSED;
  }

  isStopped(): boolean {
    return this.state === SessionState.STOPPED;
  }

  isFailed(): boolean {
    return this.state === SessionState.FAILED;
  }

  isTerminal(): boolean {
    return this.isStopped() || this.isFailed();
  }

  acquireLease(ownerId: string, options: AcquireRuntimeLeaseOptions = {}): TradingSession {
    const normalizedOwnerId = required(ownerId, 'ownerId');
    const acquiredAt = options.acquiredAt ?? new Date().toISOString();
    assertCanonicalIso(acquiredAt, 'acquiredAt');

    if (!this.canAcquire(normalizedOwnerId, acquiredAt)) {
      throw new DuplicateRuntimeLeaseError();
    }
    assertLifecycleTimestamp(acquiredAt, this.updatedAt);

    const expiresAt =
      options.expiresAt ??
      new Date(Date.parse(acquiredAt) + DEFAULT_RUNTIME_LEASE_DURATION_MS).toISOString();
    const nextLease = RuntimeLease.create({
      sessionId: this.sessionId,
      ownerId: normalizedOwnerId,
      acquiredAt,
      expiresAt,
      leaseVersion: this.lastLeaseVersion + 1,
      heartbeatTimeoutMs: options.heartbeatTimeoutMs,
    });

    const expirationEvent: TradingSessionDomainEvent[] =
      this.lease !== null
        ? [
            Object.freeze({
              eventType: 'RuntimeLeaseExpired' as const,
              sessionId: this.sessionId,
              workspaceId: this.workspaceId,
              occurredAt: this.lease.expiresAt,
              metadataVersion: this.metadataVersion,
              lease: this.lease.toProperties(),
              expiredAt: this.lease.expiresAt,
            }),
          ]
        : [];
    const acquiredEvent = Object.freeze({
      eventType: 'RuntimeLeaseAcquired' as const,
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      occurredAt: acquiredAt,
      metadataVersion: this.metadataVersion,
      lease: nextLease.toProperties(),
    });

    return new TradingSession(
      {
        ...this.toProperties(),
        updatedAt: acquiredAt,
        runtimeLease: nextLease.toProperties(),
        lastLeaseVersion: nextLease.leaseVersion,
      },
      [...this.pendingDomainEvents, ...expirationEvent, acquiredEvent],
    );
  }

  releaseLease(ownerId: string, releasedAt = new Date().toISOString()): TradingSession {
    const normalizedOwnerId = required(ownerId, 'ownerId');
    assertCanonicalIso(releasedAt, 'releasedAt');

    if (this.lease === null) {
      throw new MissingRuntimeLeaseError();
    }
    if (this.lease.isExpired(releasedAt)) {
      throw new ExpiredRuntimeLeaseError();
    }
    if (this.lease.ownerId !== normalizedOwnerId) {
      throw new RuntimeLeaseOwnerMismatchError();
    }
    assertLifecycleTimestamp(releasedAt, this.updatedAt);

    const releasedEvent = Object.freeze({
      eventType: 'RuntimeLeaseReleased' as const,
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      occurredAt: releasedAt,
      metadataVersion: this.metadataVersion,
      lease: this.lease.toProperties(),
      releasedAt,
    });

    return new TradingSession(
      {
        ...this.toProperties(),
        updatedAt: releasedAt,
        runtimeLease: null,
      },
      [...this.pendingDomainEvents, releasedEvent],
    );
  }

  heartbeat(ownerId: string, now = new Date().toISOString()): TradingSession {
    const normalizedOwnerId = required(ownerId, 'ownerId');
    assertCanonicalIso(now, 'now');

    if (this.lease === null) {
      throw new MissingRuntimeLeaseError();
    }
    if (this.lease.isExpired(now)) {
      throw new ExpiredRuntimeLeaseError();
    }
    if (this.lease.ownerId !== normalizedOwnerId) {
      throw new RuntimeLeaseOwnerMismatchError('heartbeated');
    }
    if (Date.parse(now) <= Date.parse(this.lease.lastHeartbeatAt)) {
      throw new InvalidRuntimeHeartbeatTimestampError('heartbeat timestamp must move forward');
    }

    const heartbeatExpiredEvent: TradingSessionDomainEvent[] = this.lease.isHeartbeatExpired(now)
      ? [
          Object.freeze({
            eventType: 'RuntimeHeartbeatExpired' as const,
            sessionId: this.sessionId,
            workspaceId: this.workspaceId,
            occurredAt: now,
            metadataVersion: this.metadataVersion,
            lease: this.lease.toProperties(),
            lastHeartbeatAt: this.lease.lastHeartbeatAt,
            expiredAt: new Date(
              Date.parse(this.lease.lastHeartbeatAt) + this.lease.heartbeatTimeoutMs,
            ).toISOString(),
          }),
        ]
      : [];
    const refreshedLease = this.lease.heartbeat(now);
    const heartbeatReceivedEvent = Object.freeze({
      eventType: 'RuntimeHeartbeatReceived' as const,
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      occurredAt: now,
      metadataVersion: this.metadataVersion,
      lease: refreshedLease.toProperties(),
      heartbeatAt: now,
    });

    return new TradingSession(
      {
        ...this.toProperties(),
        runtimeLease: refreshedLease.toProperties(),
      },
      [...this.pendingDomainEvents, ...heartbeatExpiredEvent, heartbeatReceivedEvent],
    );
  }

  lastHeartbeat(): string | null {
    return this.lease?.lastHeartbeat() ?? null;
  }

  heartbeatAge(now: string): number | null {
    assertCanonicalIso(now, 'now');
    return this.lease?.heartbeatAge(now) ?? null;
  }

  isHeartbeatExpired(now: string): boolean {
    assertCanonicalIso(now, 'now');
    return this.lease?.isHeartbeatExpired(now) ?? false;
  }

  requiresHeartbeat(now: string): boolean {
    assertCanonicalIso(now, 'now');
    return this.lease?.requiresHeartbeat(now) ?? false;
  }

  hasLease(now = new Date().toISOString()): boolean {
    return this.lease !== null && !this.lease.isExpired(now);
  }

  leaseOwner(now = new Date().toISOString()): string | null {
    return this.hasLease(now) ? (this.lease as RuntimeLease).ownerId : null;
  }

  isLeaseExpired(now: string): boolean {
    assertCanonicalIso(now, 'now');
    return this.lease?.isExpired(now) ?? false;
  }

  canAcquire(ownerId: string, now = new Date().toISOString()): boolean {
    required(ownerId, 'ownerId');
    assertCanonicalIso(now, 'now');
    return this.lease === null || this.lease.isExpired(now);
  }

  canRelease(ownerId: string, now = new Date().toISOString()): boolean {
    const normalizedOwnerId = required(ownerId, 'ownerId');
    assertCanonicalIso(now, 'now');
    return (
      this.lease !== null && this.lease.ownerId === normalizedOwnerId && !this.lease.isExpired(now)
    );
  }

  canRecover(now: string): boolean {
    assertCanonicalIso(now, 'now');
    if (
      (!this.isRunning() && !this.isPaused()) ||
      this.lease === null ||
      this.isRecovering() ||
      this.isRecovered()
    ) {
      return false;
    }

    const heartbeatCanBeEvaluated = Date.parse(now) >= Date.parse(this.lease.lastHeartbeatAt);
    return (
      this.lease.isExpired(now) || (heartbeatCanBeEvaluated && this.lease.isHeartbeatExpired(now))
    );
  }

  beginRecovery(now: string): TradingSession {
    assertRecoveryTimestamp(now, 'now');
    if (this.isRecovering()) {
      throw new RecoveryInProgressError();
    }
    if (this.isRecovered()) {
      throw new RecoveryAlreadyCompletedError();
    }
    if (!this.canRecover(now)) {
      throw new RecoveryNotEligibleError();
    }

    const recoveryId = randomUUID();
    const recoveryAttempt = this.recovery.recoveryAttempt + 1;
    const event = Object.freeze({
      eventType: 'TradingSessionRecoveryStarted' as const,
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      occurredAt: now,
      metadataVersion: this.metadataVersion,
      recoveryId,
      recoveryAttempt,
      recoveryStartedAt: now,
      recoveryStatus: RecoveryStatus.RECOVERING,
    });

    return this.withRecoveryState(
      {
        recoveryStatus: RecoveryStatus.RECOVERING,
        recoveryId,
        recoveryAttempt,
        recoveryStartedAt: now,
        recoveryCompletedAt: null,
        recoveryFailedAt: null,
        recoveryFailureReason: null,
      },
      event,
    );
  }

  completeRecovery(now: string): TradingSession {
    assertRecoveryTimestamp(now, 'now');
    if (this.isRecovered()) {
      throw new DuplicateRecoveryCompletionError();
    }
    if (!this.isRecovering()) {
      throw new RecoveryNotInProgressError();
    }
    assertRecoveryOrder(now, this.recovery.recoveryStartedAt as string);

    const event = Object.freeze({
      eventType: 'TradingSessionRecoveryCompleted' as const,
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      occurredAt: now,
      metadataVersion: this.metadataVersion,
      recoveryId: this.recovery.recoveryId as string,
      recoveryAttempt: this.recovery.recoveryAttempt,
      recoveryCompletedAt: now,
      recoveryStatus: RecoveryStatus.RECOVERED,
    });

    return this.withRecoveryState(
      {
        ...this.recovery,
        recoveryStatus: RecoveryStatus.RECOVERED,
        recoveryCompletedAt: now,
      },
      event,
    );
  }

  failRecovery(reason: string): TradingSession {
    if (this.recovery.recoveryStatus === RecoveryStatus.FAILED) {
      throw new DuplicateRecoveryFailureError();
    }
    if (!this.isRecovering()) {
      throw new RecoveryNotInProgressError();
    }
    const normalizedReason = normalizeRecoveryReason(reason);
    const failedAt = resolveRecoveryAt(this.recovery.recoveryStartedAt as string);

    const event = Object.freeze({
      eventType: 'TradingSessionRecoveryFailed' as const,
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      occurredAt: failedAt,
      metadataVersion: this.metadataVersion,
      recoveryId: this.recovery.recoveryId as string,
      recoveryAttempt: this.recovery.recoveryAttempt,
      recoveryFailedAt: failedAt,
      reason: normalizedReason,
      recoveryStatus: RecoveryStatus.FAILED,
    });

    return this.withRecoveryState(
      {
        ...this.recovery,
        recoveryStatus: RecoveryStatus.FAILED,
        recoveryFailedAt: failedAt,
        recoveryFailureReason: normalizedReason,
      },
      event,
    );
  }

  skipRecovery(reason: string): TradingSession {
    if (this.isRecovering()) {
      throw new RecoveryInProgressError();
    }
    if (this.isRecovered()) {
      throw new RecoveryAlreadyCompletedError();
    }
    if (this.recovery.recoveryStatus === RecoveryStatus.FAILED) {
      throw new DuplicateRecoveryFailureError();
    }
    const normalizedReason = normalizeRecoveryReason(reason);
    const occurredAt = resolveRecoveryAt(this.updatedAt);
    const event = Object.freeze({
      eventType: 'TradingSessionRecoverySkipped' as const,
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      occurredAt,
      metadataVersion: this.metadataVersion,
      reason: normalizedReason,
      recoveryStatus: RecoveryStatus.NOT_REQUIRED,
    });

    return this.withRecoveryState(
      {
        ...this.recovery,
        recoveryStatus: RecoveryStatus.NOT_REQUIRED,
      },
      event,
    );
  }

  isRecovering(): boolean {
    return this.recovery.recoveryStatus === RecoveryStatus.RECOVERING;
  }

  isRecovered(): boolean {
    return this.recovery.recoveryStatus === RecoveryStatus.RECOVERED;
  }

  isRecoveryRequired(now: string): boolean {
    return this.canRecover(now);
  }

  recoveryStatus(): RecoveryStatus {
    return this.recovery.recoveryStatus;
  }

  recoveryState(): RecoveryStateProperties {
    return this.recovery;
  }

  domainEvents(): readonly TradingSessionDomainEvent[] {
    return this.pendingDomainEvents;
  }

  private withRecoveryState(
    recovery: RecoveryStateProperties,
    event: TradingSessionDomainEvent,
  ): TradingSession {
    return new TradingSession(
      {
        ...this.toProperties(),
        ...recovery,
      },
      [...this.pendingDomainEvents, event],
    );
  }

  private applyTransition(
    nextState: SessionState,
    occurredAt: string,
    failure?: Readonly<{ failureReason: string }>,
  ): TradingSession {
    if (!isSessionState(nextState) || !this.canTransitionTo(nextState)) {
      throw new InvalidTradingSessionTransitionError(this.state, nextState);
    }

    assertLifecycleTimestamp(occurredAt, this.updatedAt);

    const startedAt =
      nextState === SessionState.RUNNING && this.startedAt === null ? occurredAt : this.startedAt;
    const stoppedAt = nextState === SessionState.STOPPED ? occurredAt : this.stoppedAt;
    const failedAt = nextState === SessionState.FAILED ? occurredAt : this.failedAt;
    const failureReason =
      nextState === SessionState.FAILED ? (failure?.failureReason ?? null) : this.failureReason;

    if (nextState === SessionState.FAILED && failureReason === null) {
      throw new MissingFailureReasonError();
    }

    const event = this.eventForTransition(
      nextState,
      occurredAt,
      startedAt,
      stoppedAt,
      failedAt,
      failureReason,
    );

    return new TradingSession(
      {
        ...this.toProperties(),
        currentState: nextState,
        updatedAt: occurredAt,
        startedAt,
        stoppedAt,
        failedAt,
        failureReason,
      },
      event === null ? this.pendingDomainEvents : [...this.pendingDomainEvents, event],
    );
  }

  private eventForTransition(
    nextState: SessionState,
    occurredAt: string,
    startedAt: string | null,
    stoppedAt: string | null,
    failedAt: string | null,
    failureReason: string | null,
  ): TradingSessionDomainEvent | null {
    const base = {
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      occurredAt,
      metadataVersion: this.metadataVersion,
    };

    if (nextState === SessionState.RUNNING) {
      return Object.freeze(
        this.startedAt === null
          ? {
              ...base,
              eventType: 'TradingSessionStarted' as const,
              startedAt: startedAt as string,
              currentState: SessionState.RUNNING,
            }
          : {
              ...base,
              eventType: 'TradingSessionResumed' as const,
              resumedAt: occurredAt,
              currentState: SessionState.RUNNING,
            },
      );
    }
    if (nextState === SessionState.PAUSED) {
      return Object.freeze({
        ...base,
        eventType: 'TradingSessionPaused' as const,
        pausedAt: occurredAt,
        currentState: SessionState.PAUSED,
      });
    }
    if (nextState === SessionState.STOPPED) {
      return Object.freeze({
        ...base,
        eventType: 'TradingSessionStopped' as const,
        stoppedAt: stoppedAt as string,
        currentState: SessionState.STOPPED,
      });
    }
    if (nextState === SessionState.FAILED) {
      return Object.freeze({
        ...base,
        eventType: 'TradingSessionFailed' as const,
        failedAt: failedAt as string,
        reason: failureReason as string,
        currentState: SessionState.FAILED,
      });
    }
    return null;
  }

  toProperties(): TradingSessionProperties {
    return Object.freeze({
      sessionId: this.sessionId,
      workspaceId: this.workspaceId,
      deploymentId: this.deploymentId,
      strategyId: this.strategyId,
      executionMode: this.executionMode,
      marketType: this.marketType,
      exchange: this.exchange,
      symbol: this.symbol,
      timeframe: this.timeframe,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      startedAt: this.startedAt,
      stoppedAt: this.stoppedAt,
      failedAt: this.failedAt,
      failureReason: this.failureReason,
      currentState: this.state,
      metadataVersion: this.metadataVersion,
      runtimeLease: this.lease?.toProperties() ?? null,
      lastLeaseVersion: this.lastLeaseVersion,
      ...this.recovery,
    });
  }
}

export function isExecutionMode(value: unknown): value is ExecutionMode {
  return Object.values(ExecutionMode).includes(value as ExecutionMode);
}

export function isSessionState(value: unknown): value is SessionState {
  return Object.values(SessionState).includes(value as SessionState);
}

export function isRecoveryStatus(value: unknown): value is RecoveryStatus {
  return Object.values(RecoveryStatus).includes(value as RecoveryStatus);
}

type NormalizedTradingSessionProperties = TradingSessionProperties & RecoveryStateProperties;

function withRecoveryDefaults(
  properties: TradingSessionProperties,
): NormalizedTradingSessionProperties {
  return {
    ...properties,
    recoveryStatus: properties.recoveryStatus ?? RecoveryStatus.NOT_REQUIRED,
    recoveryId: properties.recoveryId ?? null,
    recoveryAttempt: properties.recoveryAttempt ?? 0,
    recoveryStartedAt: properties.recoveryStartedAt ?? null,
    recoveryCompletedAt: properties.recoveryCompletedAt ?? null,
    recoveryFailedAt: properties.recoveryFailedAt ?? null,
    recoveryFailureReason: properties.recoveryFailureReason ?? null,
  };
}

function validateProperties(properties: NormalizedTradingSessionProperties): void {
  required(properties.sessionId, 'sessionId');
  required(properties.workspaceId, 'workspaceId');
  required(properties.deploymentId, 'deploymentId');
  required(properties.strategyId, 'strategyId');
  required(properties.marketType, 'marketType');
  required(properties.exchange, 'exchange');
  required(properties.symbol, 'symbol');

  if (!isExecutionMode(properties.executionMode)) {
    throw new Error(`Invalid executionMode: ${String(properties.executionMode)}`);
  }
  if (!isSessionState(properties.currentState)) {
    throw new Error(`Invalid currentState: ${String(properties.currentState)}`);
  }
  if (!isRecoveryStatus(properties.recoveryStatus)) {
    throw new Error(`Invalid recoveryStatus: ${String(properties.recoveryStatus)}`);
  }
  if (!isTimeframe(properties.timeframe)) {
    throw new Error(`Invalid timeframe: ${String(properties.timeframe)}`);
  }
  if (!Number.isInteger(properties.metadataVersion) || properties.metadataVersion < 1) {
    throw new Error('metadataVersion must be a positive integer');
  }
  if (!Number.isInteger(properties.lastLeaseVersion) || properties.lastLeaseVersion < 0) {
    throw new Error('lastLeaseVersion must be a non-negative integer');
  }
  if (!Number.isInteger(properties.recoveryAttempt) || properties.recoveryAttempt < 0) {
    throw new Error('recoveryAttempt must be a non-negative integer');
  }
  if (properties.runtimeLease !== null) {
    const lease = RuntimeLease.restore(properties.runtimeLease);
    if (lease.sessionId !== properties.sessionId.trim()) {
      throw new Error('runtime lease sessionId must match TradingSession sessionId');
    }
    if (lease.leaseVersion !== properties.lastLeaseVersion) {
      throw new Error('runtime lease version must match lastLeaseVersion');
    }
  }

  assertCanonicalIso(properties.createdAt, 'createdAt');
  assertCanonicalIso(properties.updatedAt, 'updatedAt');
  assertOptionalCanonicalIso(properties.startedAt, 'startedAt');
  assertOptionalCanonicalIso(properties.stoppedAt, 'stoppedAt');
  assertOptionalCanonicalIso(properties.failedAt, 'failedAt');
  assertOptionalCanonicalIso(properties.recoveryStartedAt, 'recoveryStartedAt');
  assertOptionalCanonicalIso(properties.recoveryCompletedAt, 'recoveryCompletedAt');
  assertOptionalCanonicalIso(properties.recoveryFailedAt, 'recoveryFailedAt');

  const createdAt = Date.parse(properties.createdAt);
  const updatedAt = Date.parse(properties.updatedAt);
  if (updatedAt < createdAt) {
    throw new Error('updatedAt must not be before createdAt');
  }
  if (properties.startedAt !== null) {
    const startedAt = Date.parse(properties.startedAt);
    if (startedAt < createdAt || startedAt > updatedAt) {
      throw new Error('startedAt must be between createdAt and updatedAt');
    }
  }
  if (properties.stoppedAt !== null) {
    if (properties.startedAt === null) {
      throw new Error('stoppedAt requires startedAt');
    }
    const stoppedAt = Date.parse(properties.stoppedAt);
    if (stoppedAt < Date.parse(properties.startedAt) || stoppedAt > updatedAt) {
      throw new Error('stoppedAt must be between startedAt and updatedAt');
    }
  }
  if (properties.failedAt !== null) {
    const failedAt = Date.parse(properties.failedAt);
    if (failedAt < createdAt || failedAt > updatedAt) {
      throw new Error('failedAt must be between createdAt and updatedAt');
    }
  }

  const statesRequiringStart = new Set([
    SessionState.RUNNING,
    SessionState.PAUSING,
    SessionState.PAUSED,
    SessionState.STOPPING,
    SessionState.STOPPED,
  ]);
  if (statesRequiringStart.has(properties.currentState) && properties.startedAt === null) {
    throw new Error(`${properties.currentState} requires startedAt`);
  }
  if (
    [SessionState.CREATED, SessionState.STARTING].includes(properties.currentState) &&
    properties.startedAt !== null
  ) {
    throw new Error(`${properties.currentState} must not have startedAt`);
  }
  if (properties.currentState === SessionState.STOPPED && properties.stoppedAt === null) {
    throw new Error('STOPPED requires stoppedAt');
  }
  if (properties.currentState !== SessionState.STOPPED && properties.stoppedAt !== null) {
    throw new Error('stoppedAt is only valid for STOPPED sessions');
  }
  if (properties.currentState === SessionState.FAILED) {
    if (properties.failedAt === null) {
      throw new Error('FAILED requires failedAt');
    }
    if (properties.failureReason === null || properties.failureReason.trim() === '') {
      throw new MissingFailureReasonError();
    }
  } else {
    if (properties.failedAt !== null) {
      throw new Error('failedAt is only valid for FAILED sessions');
    }
    if (properties.failureReason !== null) {
      throw new Error('failureReason is only valid for FAILED sessions');
    }
  }

  validateRecoveryState(properties);
}

function validateRecoveryState(properties: NormalizedTradingSessionProperties): void {
  const {
    recoveryStatus,
    recoveryId,
    recoveryAttempt,
    recoveryStartedAt,
    recoveryCompletedAt,
    recoveryFailedAt,
    recoveryFailureReason,
  } = properties;

  if (recoveryId !== null) required(recoveryId, 'recoveryId');
  const hasAttemptIdentity =
    recoveryId !== null && recoveryAttempt > 0 && recoveryStartedAt !== null;
  const hasNoAttempt =
    recoveryId === null &&
    recoveryAttempt === 0 &&
    recoveryStartedAt === null &&
    recoveryCompletedAt === null &&
    recoveryFailedAt === null &&
    recoveryFailureReason === null;

  if (
    recoveryStatus === RecoveryStatus.NOT_REQUIRED ||
    recoveryStatus === RecoveryStatus.ELIGIBLE
  ) {
    if (!hasNoAttempt) {
      throw new Error(`${recoveryStatus} recovery must not contain attempt metadata`);
    }
    return;
  }
  if (!hasAttemptIdentity) {
    throw new Error(`${recoveryStatus} recovery requires recovery identity and start metadata`);
  }
  if (Date.parse(recoveryStartedAt as string) < Date.parse(properties.createdAt)) {
    throw new Error('recoveryStartedAt must not be before createdAt');
  }

  if (recoveryStatus === RecoveryStatus.RECOVERING) {
    if (
      recoveryCompletedAt !== null ||
      recoveryFailedAt !== null ||
      recoveryFailureReason !== null
    ) {
      throw new Error('RECOVERING must not contain final recovery metadata');
    }
    return;
  }
  if (recoveryStatus === RecoveryStatus.RECOVERED) {
    if (recoveryCompletedAt === null) {
      throw new Error('RECOVERED requires recoveryCompletedAt');
    }
    if (
      Date.parse(recoveryCompletedAt) < Date.parse(recoveryStartedAt as string) ||
      recoveryFailedAt !== null ||
      recoveryFailureReason !== null
    ) {
      throw new Error('RECOVERED contains invalid recovery metadata');
    }
    return;
  }
  if (
    recoveryFailedAt === null ||
    recoveryFailureReason === null ||
    recoveryFailureReason.trim() === ''
  ) {
    throw new MissingRecoveryReasonError();
  }
  if (
    Date.parse(recoveryFailedAt) < Date.parse(recoveryStartedAt as string) ||
    recoveryCompletedAt !== null
  ) {
    throw new Error('FAILED recovery contains invalid recovery metadata');
  }
}

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function assertOptionalCanonicalIso(value: string | null, field: string): void {
  if (value !== null) {
    assertCanonicalIso(value, field);
  }
}

function assertCanonicalIso(value: string, field: string): void {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${field} must be an ISO-8601 UTC timestamp`);
  }
}

function assertLifecycleTimestamp(occurredAt: string, updatedAt: string): void {
  const parsed = new Date(occurredAt);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== occurredAt) {
    throw new InvalidLifecycleTimestampError('occurredAt must be an ISO-8601 UTC timestamp');
  }
  if (parsed.getTime() < Date.parse(updatedAt)) {
    throw new InvalidLifecycleTimestampError('occurredAt must not be before updatedAt');
  }
}

function resolveOccurredAt(occurredAt: string | undefined, updatedAt: string): string {
  if (occurredAt !== undefined) return occurredAt;
  return new Date(Math.max(Date.now(), Date.parse(updatedAt) + 1)).toISOString();
}

function normalizeRecoveryReason(reason: string): string {
  const normalizedReason = typeof reason === 'string' ? reason.trim() : '';
  if (normalizedReason === '') {
    throw new MissingRecoveryReasonError();
  }
  return normalizedReason;
}

function assertRecoveryTimestamp(value: string, field: string): void {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new InvalidRecoveryTimestampError(`${field} must be an ISO-8601 UTC timestamp`);
  }
}

function assertRecoveryOrder(value: string, minimum: string): void {
  if (Date.parse(value) < Date.parse(minimum)) {
    throw new InvalidRecoveryTimestampError(
      'recovery timestamp must not be before recoveryStartedAt',
    );
  }
}

function resolveRecoveryAt(minimum: string): string {
  return new Date(Math.max(Date.now(), Date.parse(minimum))).toISOString();
}

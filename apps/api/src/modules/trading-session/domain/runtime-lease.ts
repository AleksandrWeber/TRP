import { randomUUID } from 'node:crypto';

export const DEFAULT_RUNTIME_HEARTBEAT_TIMEOUT_MS = 30_000;

export type RuntimeLeaseProperties = Readonly<{
  leaseId: string;
  sessionId: string;
  ownerId: string;
  acquiredAt: string;
  expiresAt: string;
  leaseVersion: number;
  lastHeartbeatAt: string;
  heartbeatTimeoutMs: number;
}>;

export type CreateRuntimeLeaseProperties = Readonly<
  Omit<RuntimeLeaseProperties, 'leaseId' | 'lastHeartbeatAt' | 'heartbeatTimeoutMs'> & {
    leaseId?: string;
    lastHeartbeatAt?: string;
    heartbeatTimeoutMs?: number;
  }
>;

/**
 * Infrastructure-independent, immutable ownership lease.
 */
export class RuntimeLease {
  readonly leaseId: string;
  readonly sessionId: string;
  readonly ownerId: string;
  readonly acquiredAt: string;
  readonly expiresAt: string;
  readonly leaseVersion: number;
  readonly lastHeartbeatAt: string;
  readonly heartbeatTimeoutMs: number;

  private constructor(properties: RuntimeLeaseProperties) {
    this.leaseId = required(properties.leaseId, 'leaseId');
    this.sessionId = required(properties.sessionId, 'sessionId');
    this.ownerId = required(properties.ownerId, 'ownerId');
    this.acquiredAt = canonicalIso(properties.acquiredAt, 'acquiredAt');
    this.expiresAt = canonicalIso(properties.expiresAt, 'expiresAt');

    if (Date.parse(this.expiresAt) <= Date.parse(this.acquiredAt)) {
      throw new Error('expiresAt must be greater than acquiredAt');
    }
    if (!Number.isInteger(properties.leaseVersion) || properties.leaseVersion < 1) {
      throw new Error('leaseVersion must be a positive integer');
    }
    this.leaseVersion = properties.leaseVersion;
    this.lastHeartbeatAt = canonicalIso(properties.lastHeartbeatAt, 'lastHeartbeatAt');
    if (
      Date.parse(this.lastHeartbeatAt) < Date.parse(this.acquiredAt) ||
      Date.parse(this.lastHeartbeatAt) >= Date.parse(this.expiresAt)
    ) {
      throw new Error('lastHeartbeatAt must be within the active lease period');
    }
    if (!Number.isInteger(properties.heartbeatTimeoutMs) || properties.heartbeatTimeoutMs <= 0) {
      throw new Error('heartbeatTimeoutMs must be a positive integer');
    }
    this.heartbeatTimeoutMs = properties.heartbeatTimeoutMs;

    Object.freeze(this);
  }

  static create(properties: CreateRuntimeLeaseProperties): RuntimeLease {
    return new RuntimeLease({
      ...properties,
      leaseId: properties.leaseId ?? randomUUID(),
      lastHeartbeatAt: properties.lastHeartbeatAt ?? properties.acquiredAt,
      heartbeatTimeoutMs: properties.heartbeatTimeoutMs ?? DEFAULT_RUNTIME_HEARTBEAT_TIMEOUT_MS,
    });
  }

  static restore(properties: RuntimeLeaseProperties): RuntimeLease {
    return new RuntimeLease(properties);
  }

  isExpired(now: string): boolean {
    return Date.parse(canonicalIso(now, 'now')) >= Date.parse(this.expiresAt);
  }

  heartbeat(now: string): RuntimeLease {
    const heartbeatAt = canonicalIso(now, 'now');
    if (this.isExpired(heartbeatAt)) {
      throw new Error('heartbeat cannot renew an expired runtime lease');
    }
    if (Date.parse(heartbeatAt) <= Date.parse(this.lastHeartbeatAt)) {
      throw new Error('heartbeat timestamp must move forward');
    }
    return new RuntimeLease({
      ...this.toProperties(),
      lastHeartbeatAt: heartbeatAt,
    });
  }

  lastHeartbeat(): string {
    return this.lastHeartbeatAt;
  }

  heartbeatAge(now: string): number {
    const evaluatedAt = canonicalIso(now, 'now');
    const age = Date.parse(evaluatedAt) - Date.parse(this.lastHeartbeatAt);
    if (age < 0) {
      throw new Error('now must not be before lastHeartbeatAt');
    }
    return age;
  }

  isHeartbeatExpired(now: string): boolean {
    return this.heartbeatAge(now) >= this.heartbeatTimeoutMs;
  }

  requiresHeartbeat(now: string): boolean {
    return !this.isExpired(now) && this.isHeartbeatExpired(now);
  }

  toProperties(): RuntimeLeaseProperties {
    return Object.freeze({
      leaseId: this.leaseId,
      sessionId: this.sessionId,
      ownerId: this.ownerId,
      acquiredAt: this.acquiredAt,
      expiresAt: this.expiresAt,
      leaseVersion: this.leaseVersion,
      lastHeartbeatAt: this.lastHeartbeatAt,
      heartbeatTimeoutMs: this.heartbeatTimeoutMs,
    });
  }
}

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

function canonicalIso(value: string, field: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) {
    throw new Error(`${field} must be an ISO-8601 UTC timestamp`);
  }
  return value;
}

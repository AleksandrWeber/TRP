import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  INVALID_SESSION_MESSAGE,
  REFRESH_TOKEN_TTL_MS,
  SYSTEM_CLOCK,
  type AuthSessionRecord,
  type Clock,
  type IssuedRefreshSecrets,
  type SessionRequestContext,
} from './auth-session';
import type { AuthSessionRepository } from './auth-session.repository';
import { AUTH_SESSION_CLOCK, AUTH_SESSION_REPOSITORY } from './auth-session.repository.token';

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function randomSecret(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Auth-owned operator session store (V3-S01-c).
 * Issues rotating refresh secrets, detects reuse, and supports revoke.
 * Not a trading session product.
 */
@Injectable()
export class AuthSessionStore {
  private readonly clock: Clock;

  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly repository: AuthSessionRepository,
    @Inject(AUTH_SESSION_CLOCK)
    clock?: Clock,
  ) {
    this.clock = clock ?? SYSTEM_CLOCK;
  }

  async issue(userId: string, request?: SessionRequestContext): Promise<IssuedRefreshSecrets> {
    const now = this.clock.now();
    const refreshToken = randomSecret();
    const record: AuthSessionRecord = {
      id: randomUUID(),
      familyId: randomUUID(),
      userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
      revokedAt: null,
      replacedById: null,
      ip: request?.ip ?? null,
      userAgent: request?.userAgent ?? null,
      mfaSatisfied: false,
      createdAt: now,
    };
    await this.repository.save(record);
    return {
      sessionId: record.id,
      familyId: record.familyId,
      userId: record.userId,
      refreshToken,
      csrfToken: randomSecret(),
    };
  }

  async rotate(
    presentedRefreshToken: string,
    request?: SessionRequestContext,
  ): Promise<IssuedRefreshSecrets> {
    const now = this.clock.now();
    const current = await this.repository.findByRefreshHash(
      hashRefreshToken(presentedRefreshToken),
    );

    if (!current) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }

    if (current.revokedAt) {
      await this.repository.revokeFamily(current.familyId, now);
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }

    if (current.expiresAt <= now) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }

    const refreshToken = randomSecret();
    const next: AuthSessionRecord = {
      id: randomUUID(),
      familyId: current.familyId,
      userId: current.userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
      revokedAt: null,
      replacedById: null,
      ip: request?.ip ?? current.ip,
      userAgent: request?.userAgent ?? current.userAgent,
      mfaSatisfied: current.mfaSatisfied,
      createdAt: now,
    };
    if (!(await this.repository.rotateIfActive(current.id, next, now))) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }
    return {
      sessionId: next.id,
      familyId: next.familyId,
      userId: next.userId,
      refreshToken,
      csrfToken: randomSecret(),
    };
  }

  async requireActive(sessionId: string, userId: string): Promise<AuthSessionRecord> {
    const record = await this.repository.findById(sessionId);
    const now = this.clock.now();
    if (
      !record ||
      record.userId !== userId ||
      record.revokedAt !== null ||
      record.expiresAt <= now
    ) {
      throw new UnauthorizedException(INVALID_SESSION_MESSAGE);
    }
    return record;
  }

  async listActive(userId: string): Promise<AuthSessionRecord[]> {
    return this.repository.findActiveByUserId(userId, this.clock.now());
  }

  async familyStartedAt(familyIds: string[]): Promise<Map<string, Date>> {
    return this.repository.findEarliestCreatedAtByFamilyIds(familyIds);
  }

  async findOwnActive(userId: string, sessionId: string): Promise<AuthSessionRecord | null> {
    const record = await this.repository.findById(sessionId);
    const now = this.clock.now();
    if (
      !record ||
      record.userId !== userId ||
      record.revokedAt !== null ||
      record.expiresAt <= now
    ) {
      return null;
    }
    return record;
  }

  async revoke(sessionId: string): Promise<void> {
    await this.repository.revoke(sessionId, { revokedAt: this.clock.now() });
  }

  async revokeFamilyOf(sessionId: string): Promise<AuthSessionRecord | null> {
    const record = await this.repository.findById(sessionId);
    if (!record) return null;
    await this.repository.revokeFamily(record.familyId, this.clock.now());
    return record;
  }

  async revokeOthers(userId: string, keepSessionId: string): Promise<number> {
    const now = this.clock.now();
    const active = await this.repository.findActiveByUserId(userId, now);
    const others = active.filter((session) => session.id !== keepSessionId);
    const families = new Set(others.map((session) => session.familyId));
    for (const familyId of families) {
      await this.repository.revokeFamily(familyId, now);
    }
    return others.length;
  }

  async revokeAllForUser(userId: string): Promise<number> {
    return this.repository.revokeAllForUser(userId, this.clock.now());
  }

  async revokeByRefresh(
    presentedRefreshToken: string,
  ): Promise<{ userId: string; sessionId: string } | null> {
    const current = await this.repository.findByRefreshHash(
      hashRefreshToken(presentedRefreshToken),
    );
    const now = this.clock.now();
    if (!current || current.revokedAt !== null || current.expiresAt <= now) {
      return null;
    }
    await this.repository.revoke(current.id, { revokedAt: now });
    return { userId: current.userId, sessionId: current.id };
  }
}

export function secretsMatch(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

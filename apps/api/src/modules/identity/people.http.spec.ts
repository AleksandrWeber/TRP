import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  VersioningType,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createValidationPipe, ValidationExceptionFilter } from '../../validation';
import type { LogContext, Logger } from '../../logging/logger';
import { LOGGER } from '../../logging/logger.token';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import { Role } from './role';
import type { AuthUser } from '../auth/jwt.strategy';
import {
  AUTHZ_DENY_EVENT,
  AUTHZ_ROLE_CHANGE_EVENT,
  authorizationEventLeaksSensitiveData,
} from '../auth/authorization-events';
import { RolesGuard } from '../auth/roles.guard';
import { PeopleController } from './people.controller';
import { InMemoryUserRepository } from './repositories/in-memory-user.repository';
import { UserDomainService } from './user-domain.service';

@Injectable()
class PeopleAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthUser;
    }>();
    const role = request.headers['x-test-role'];
    if (!role) {
      throw new UnauthorizedException();
    }
    request.user = {
      userId: request.headers['x-test-user-id'] ?? 'caller-1',
      email: 'caller@trp.local',
      displayName: 'Caller',
      role: role as Role,
    };
    return true;
  }
}

class RecordingLogger implements Logger {
  readonly entries: Array<{ level: string; message: string; context?: LogContext }> = [];

  child(_component: string): Logger {
    return this;
  }

  debug(message: string, context?: LogContext): void {
    this.entries.push({ level: 'debug', message, context });
  }

  info(message: string, context?: LogContext): void {
    this.entries.push({ level: 'info', message, context });
  }

  warn(message: string, context?: LogContext): void {
    this.entries.push({ level: 'warn', message, context });
  }

  error(message: string, context?: LogContext): void {
    this.entries.push({ level: 'error', message, context });
  }

  reset(): void {
    this.entries.length = 0;
  }
}

class NoopSecurityAuditService {
  async record(): Promise<{ id: string }> {
    return { id: 'audit-test' };
  }
}

/**
 * C6 Admin-only. Unauthenticated 401. Invalid role 400. Last Admin 409.
 * Role-change and C6-deny events are structured logs without secrets.
 */
describe('People HTTP (V3-S02-c)', () => {
  let app: NestFastifyApplication;
  let users: UserDomainService;
  let events: RecordingLogger;
  let sequence = 0;

  beforeAll(async () => {
    users = new UserDomainService(new InMemoryUserRepository());
    events = new RecordingLogger();
    const moduleRef = await Test.createTestingModule({
      controllers: [PeopleController],
      providers: [
        { provide: UserDomainService, useValue: users },
        { provide: LOGGER, useValue: events },
        { provide: SecurityAuditService, useClass: NoopSecurityAuditService },
        Reflector,
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(createValidationPipe());
    app.useGlobalFilters(new ValidationExceptionFilter());
    const reflector = app.get(Reflector);
    app.useGlobalGuards(new PeopleAuthGuard(), new RolesGuard(reflector, events));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    users = new UserDomainService(new InMemoryUserRepository());
    (app.get(PeopleController) as unknown as { users: UserDomainService }).users = users;
    events.reset();
  });

  function nextEmail(prefix: string): string {
    sequence += 1;
    return `${prefix}-${sequence}@example.com`;
  }

  async function assign(userId: string, body: object, role?: Role, callerId?: string) {
    return app.inject({
      method: 'PATCH',
      url: `/v1/people/${userId}/role`,
      headers: {
        ...(role ? { 'x-test-role': role } : {}),
        ...(callerId ? { 'x-test-user-id': callerId } : {}),
        'content-type': 'application/json',
      },
      payload: body,
    });
  }

  async function list(role?: Role) {
    return app.inject({
      method: 'GET',
      url: '/v1/people',
      headers: role ? { 'x-test-role': role } : {},
    });
  }

  it('lets Admin assign a role and applies it immediately', async () => {
    const operator = await users.create({ email: nextEmail('op'), displayName: 'Op' });

    const assigned = await assign(operator.id, { role: Role.Trader }, Role.Admin);

    expect(assigned.statusCode).toBe(200);
    expect(assigned.json()).toMatchObject({
      id: operator.id,
      email: operator.email,
      role: Role.Trader,
      status: 'Active',
    });
    expect(assigned.json()).not.toHaveProperty('passwordHash');
    expect(users.getById(operator.id)?.role).toBe(Role.Trader);
    expect(events.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: 'info',
          message: AUTHZ_ROLE_CHANGE_EVENT,
          context: expect.objectContaining({
            event: AUTHZ_ROLE_CHANGE_EVENT,
            outcome: 'assigned',
            actorUserId: 'caller-1',
            subjectUserId: operator.id,
            fromRole: Role.Researcher,
            toRole: Role.Trader,
          }),
        }),
      ]),
    );
    expect(events.entries[0].context).not.toHaveProperty('workspaceId');
    expect(authorizationEventLeaksSensitiveData(events.entries[0].context)).toBe(false);

    const listed = await list(Role.Admin);
    expect(listed.statusCode).toBe(200);
    expect(listed.json().operators).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: operator.id, role: Role.Trader })]),
    );
  });

  it('returns 403 when Reader, Researcher, or Trader assign a role', async () => {
    const operator = await users.create({ email: nextEmail('op'), displayName: 'Op' });

    for (const role of [Role.Reader, Role.Researcher, Role.Trader]) {
      const response = await assign(operator.id, { role: Role.Admin }, role, operator.id);
      expect(response.statusCode).toBe(403);
    }
    expect(users.getById(operator.id)?.role).toBe(Role.Researcher);
    const c6Denies = events.entries.filter((entry) => entry.message === AUTHZ_DENY_EVENT);
    expect(c6Denies).toHaveLength(3);
    expect(c6Denies.every((entry) => entry.context?.permission === 'C6')).toBe(true);
    expect(c6Denies.every((entry) => entry.context?.outcome === 'denied')).toBe(true);
    expect(c6Denies.every((entry) => entry.context?.reason === 'missing_permission')).toBe(true);
    expect(c6Denies.every((entry) => !authorizationEventLeaksSensitiveData(entry.context))).toBe(
      true,
    );
  });

  it('returns 403 when a Trader tries to assign Admin to self', async () => {
    const trader = await users.create({
      email: nextEmail('trader'),
      displayName: 'Trader',
      role: Role.Trader,
    });

    const response = await assign(trader.id, { role: Role.Admin }, Role.Trader, trader.id);
    expect(response.statusCode).toBe(403);
    expect(users.getById(trader.id)?.role).toBe(Role.Trader);
  });

  it('returns 403 when a Trader lists operators', async () => {
    await users.create({ email: nextEmail('hidden'), displayName: 'Hidden' });

    const response = await list(Role.Trader);
    expect(response.statusCode).toBe(403);
    expect(response.json()).not.toMatchObject({ operators: expect.anything() });
  });

  it('returns 401 when unauthenticated', async () => {
    const operator = await users.create({ email: nextEmail('op'), displayName: 'Op' });

    const response = await assign(operator.id, { role: Role.Trader });
    expect(response.statusCode).toBe(401);
    expect(users.getById(operator.id)?.role).toBe(Role.Researcher);
  });

  it('rejects an invalid role', async () => {
    const operator = await users.create({ email: nextEmail('op'), displayName: 'Op' });

    const response = await assign(operator.id, { role: 'Superuser' }, Role.Admin);
    expect(response.statusCode).toBe(400);
    expect(users.getById(operator.id)?.role).toBe(Role.Researcher);
  });

  it('rejects unknown fields on the assignment body', async () => {
    const operator = await users.create({ email: nextEmail('op'), displayName: 'Op' });

    const response = await assign(
      operator.id,
      { role: Role.Trader, password: 'secret' },
      Role.Admin,
    );
    expect(response.statusCode).toBe(400);
    expect(users.getById(operator.id)?.role).toBe(Role.Researcher);
  });

  it('returns 409 when demoting the last active Administrator', async () => {
    const onlyAdmin = await users.create({
      email: nextEmail('admin'),
      displayName: 'Admin',
      role: Role.Admin,
    });

    const response = await assign(onlyAdmin.id, { role: Role.Trader }, Role.Admin);
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      message: 'Cannot change the last active Administrator.',
    });
    expect(users.getById(onlyAdmin.id)?.role).toBe(Role.Admin);
    expect(events.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: AUTHZ_ROLE_CHANGE_EVENT,
          context: expect.objectContaining({
            outcome: 'denied',
            reason: 'last_admin',
            actorUserId: 'caller-1',
            subjectUserId: onlyAdmin.id,
            fromRole: Role.Admin,
            toRole: Role.Trader,
          }),
        }),
      ]),
    );
  });

  it('returns 409 when an Administrator changes their own role', async () => {
    const first = await users.create({
      email: nextEmail('admin-a'),
      displayName: 'Admin A',
      role: Role.Admin,
    });
    await users.create({
      email: nextEmail('admin-b'),
      displayName: 'Admin B',
      role: Role.Admin,
    });

    const response = await assign(first.id, { role: Role.Trader }, Role.Admin, first.id);
    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      message: 'You cannot change your own role.',
    });
    expect(users.getById(first.id)?.role).toBe(Role.Admin);
    expect(events.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: AUTHZ_ROLE_CHANGE_EVENT,
          context: expect.objectContaining({
            outcome: 'denied',
            reason: 'self_role',
            actorUserId: first.id,
            subjectUserId: first.id,
            fromRole: Role.Admin,
            toRole: Role.Trader,
          }),
        }),
      ]),
    );
  });

  it('returns 404 for a missing user without leaking credentials', async () => {
    const response = await assign(
      '11111111-1111-4111-8111-111111111111',
      { role: Role.Trader },
      Role.Admin,
    );
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ message: 'User not found' });
    expect(JSON.stringify(response.json())).not.toMatch(/password/i);
  });
});

import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LogContext, Logger } from '../../logging/logger';
import { Role } from '../identity/role';
import { AUTHZ_DENY_EVENT, authorizationEventLeaksSensitiveData } from './authorization-events';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { PERMISSION_KEY } from './decorators/require-permission.decorator';
import { ROLES_KEY } from './decorators/roles.decorator';
import { PermissionClass } from './permission-catalog';
import { RolesGuard } from './roles.guard';
import type { AuthUser } from './jwt.strategy';

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
}

function mockContext(user?: AuthUser): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard (US107 / V3-S02-a / V3-S02-b / V3-S02-e)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let logger: RecordingLogger;

  beforeEach(() => {
    reflector = new Reflector();
    logger = new RecordingLogger();
    guard = new RolesGuard(reflector, logger);
  });

  it('denies unclassified routes even for a known authenticated role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(
      guard.canActivate(
        mockContext({ userId: '1', email: 'a@b.c', displayName: 'A', role: Role.Reader }),
      ),
    ).toBe(false);
  });

  it('denies unclassified routes when the user is missing', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(mockContext(undefined))).toBe(false);
  });

  it('allows explicit @Public() without a session', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === IS_PUBLIC_KEY ? true : undefined,
    );

    expect(guard.canActivate(mockContext(undefined))).toBe(true);
  });

  it('denies an unknown role even when the route is unclassified', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(
      guard.canActivate(
        mockContext({
          userId: '1',
          email: 'a@b.c',
          displayName: 'A',
          role: 'Superuser' as Role,
        }),
      ),
    ).toBe(false);
  });

  it('allows Admin when @Roles(Admin) is required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === ROLES_KEY ? [Role.Admin] : undefined,
    );

    expect(
      guard.canActivate(
        mockContext({ userId: '1', email: 'a@b.c', displayName: 'A', role: Role.Admin }),
      ),
    ).toBe(true);
  });

  it('denies Researcher when @Roles(Admin) is required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === ROLES_KEY ? [Role.Admin] : undefined,
    );

    expect(
      guard.canActivate(
        mockContext({
          userId: '1',
          email: 'a@b.c',
          displayName: 'A',
          role: Role.Researcher,
        }),
      ),
    ).toBe(false);
  });

  it('denies when user is missing', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === ROLES_KEY ? [Role.Admin] : undefined,
    );

    expect(guard.canActivate(mockContext(undefined))).toBe(false);
  });

  it('allows Trader when @RequirePermission(PaperCommand) is set', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === PERMISSION_KEY ? PermissionClass.PaperCommand : undefined,
    );

    expect(
      guard.canActivate(
        mockContext({ userId: '1', email: 'a@b.c', displayName: 'A', role: Role.Trader }),
      ),
    ).toBe(true);
  });

  it('denies Researcher when @RequirePermission(PaperCommand) is set', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === PERMISSION_KEY ? PermissionClass.PaperCommand : undefined,
    );

    expect(
      guard.canActivate(
        mockContext({
          userId: '1',
          email: 'a@b.c',
          displayName: 'A',
          role: Role.Researcher,
        }),
      ),
    ).toBe(false);
  });

  it('records a C6 deny and does not record other permission denials', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === PERMISSION_KEY ? PermissionClass.RoleAdmin : undefined,
    );

    expect(
      guard.canActivate(
        mockContext({
          userId: 'trader-1',
          email: 'trader@example.com',
          displayName: 'Trader',
          role: Role.Trader,
        }),
      ),
    ).toBe(false);

    expect(logger.entries).toEqual([
      expect.objectContaining({
        level: 'warn',
        message: AUTHZ_DENY_EVENT,
        context: expect.objectContaining({
          event: AUTHZ_DENY_EVENT,
          outcome: 'denied',
          permission: PermissionClass.RoleAdmin,
          actorUserId: 'trader-1',
          role: Role.Trader,
          reason: 'missing_permission',
        }),
      }),
    ]);
    expect(authorizationEventLeaksSensitiveData(logger.entries[0].context)).toBe(false);

    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === PERMISSION_KEY ? PermissionClass.PaperCommand : undefined,
    );
    logger.entries.length = 0;

    expect(
      guard.canActivate(
        mockContext({
          userId: 'researcher-1',
          email: 'researcher@example.com',
          displayName: 'Researcher',
          role: Role.Researcher,
        }),
      ),
    ).toBe(false);
    expect(logger.entries).toEqual([]);
  });

  it('denies every role when @RequirePermission(LiveCommand) is set', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === PERMISSION_KEY ? PermissionClass.LiveCommand : undefined,
    );

    expect(
      guard.canActivate(
        mockContext({ userId: '1', email: 'a@b.c', displayName: 'A', role: Role.Admin }),
      ),
    ).toBe(false);
  });

  it('denies unknown permission metadata', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
      key === PERMISSION_KEY ? 'C99' : undefined,
    );

    expect(
      guard.canActivate(
        mockContext({ userId: '1', email: 'a@b.c', displayName: 'A', role: Role.Admin }),
      ),
    ).toBe(false);
  });
});

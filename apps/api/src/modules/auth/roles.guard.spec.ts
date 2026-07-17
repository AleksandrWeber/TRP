import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role } from '../identity/role';
import { ROLES_KEY } from './decorators/roles.decorator';
import { RolesGuard } from './roles.guard';
import type { AuthUser } from './jwt.strategy';

function mockContext(user?: AuthUser): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard (US107)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows when no @Roles metadata is set', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(
      guard.canActivate(
        mockContext({ userId: '1', email: 'a@b.c', displayName: 'A', role: Role.Reader }),
      ),
    ).toBe(true);
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
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);

    expect(guard.canActivate(mockContext(undefined))).toBe(false);
  });
});

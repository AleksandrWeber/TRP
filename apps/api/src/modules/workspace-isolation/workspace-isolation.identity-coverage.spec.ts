import { describe, expect, it } from 'vitest';
import { CommandAuthorizationService } from '../auth/command-authorization.service';
import { SESSION_NOT_FOUND_MESSAGE } from '../auth/auth-session';
import { Role } from '../identity/role';
import { createIsolationAuthentication, ISOLATION_TEST_PASSWORD } from './auth-isolation.fixture';
import { createDualWorkspaceIsolationFixture } from './dual-workspace.fixture';
import { IsolationMatrixRowId, matrixRow } from './isolation-matrix-contract';
import { expectNoForeignPayload } from './negative-proof';

describe('Workspace isolation identity coverage (V3-S06-b)', () => {
  it(`[${IsolationMatrixRowId.AuthenticationIdentityBinding}] runtime + regression: foreign session cannot bind to operator A`, async () => {
    const { sessions } = createIsolationAuthentication();
    const fixture = await createDualWorkspaceIsolationFixture();

    const sessionB = await sessions.issue(fixture.operatorBId);

    await expect(sessions.requireActive(sessionB.sessionId, fixture.operatorAId)).rejects.toThrow();
    await expect(
      sessions.findOwnActive(fixture.operatorAId, sessionB.sessionId),
    ).resolves.toBeNull();
  });

  it(`[${IsolationMatrixRowId.AuthenticationIdentityBinding}] runtime + regression: JWT resolves only the issued operator`, async () => {
    const { authentication } = createIsolationAuthentication();
    const operatorA = await authentication.register(
      'operator-a@example.com',
      'Operator A',
      ISOLATION_TEST_PASSWORD,
    );
    const operatorB = await authentication.register(
      'operator-b@example.com',
      'Operator B',
      ISOLATION_TEST_PASSWORD,
    );

    const authUserA = await authentication.validateToken(operatorA.accessToken);
    expect(authUserA.userId).toBe(operatorA.user.id);
    expect(authUserA.sessionId).toBe(operatorA.sessionId);

    const authUserB = await authentication.validateToken(operatorB.accessToken);
    expect(authUserB.userId).toBe(operatorB.user.id);
    expect(authUserB.userId).not.toBe(operatorA.user.id);
  });

  it(`[${IsolationMatrixRowId.Session}] runtime + regression: operator A cannot list or revoke operator B sessions`, async () => {
    const { authentication } = createIsolationAuthentication();
    const operatorA = await authentication.register(
      'session-a@example.com',
      'Session A',
      ISOLATION_TEST_PASSWORD,
    );
    const operatorB = await authentication.register(
      'session-b@example.com',
      'Session B',
      ISOLATION_TEST_PASSWORD,
    );

    const listed = await authentication.listSessions(operatorA.user.id, operatorA.sessionId);
    expect(listed.some((session) => session.id === operatorB.sessionId)).toBe(false);
    expectNoForeignPayload(listed, [operatorB.sessionId, operatorB.user.email]);

    await expect(
      authentication.revokeSession(operatorA.user.id, operatorB.sessionId, operatorA.sessionId),
    ).rejects.toMatchObject({ message: SESSION_NOT_FOUND_MESSAGE });
    await expect(authentication.validateToken(operatorB.accessToken)).resolves.toMatchObject({
      sessionId: operatorB.sessionId,
    });
  });

  it(`[${IsolationMatrixRowId.Session}] runtime + regression: revoked foreign session fails closed`, async () => {
    const { authentication } = createIsolationAuthentication();
    const operatorA = await authentication.register(
      'revoke-a@example.com',
      'Revoke A',
      ISOLATION_TEST_PASSWORD,
    );
    const operatorB = await authentication.register(
      'revoke-b@example.com',
      'Revoke B',
      ISOLATION_TEST_PASSWORD,
    );

    await expect(
      authentication.revokeSession(operatorA.user.id, operatorB.sessionId, operatorA.sessionId),
    ).rejects.toMatchObject({ message: SESSION_NOT_FOUND_MESSAGE });

    await expect(authentication.validateToken(operatorB.accessToken)).resolves.toMatchObject({
      userId: operatorB.user.id,
    });
    await expect(authentication.validateToken(operatorA.accessToken)).resolves.toMatchObject({
      userId: operatorA.user.id,
    });
  });

  it(`[${IsolationMatrixRowId.RbacPeopleRoleAssignment}] runtime + regression: Admin role does not create foreign workspace membership`, async () => {
    const fixture = await createDualWorkspaceIsolationFixture();
    const authorization = new CommandAuthorizationService(fixture.access);

    expect(() =>
      authorization.authorizeTradingCommand({
        user: {
          userId: fixture.operatorAId,
          email: 'operator-a@example.com',
          displayName: 'Operator A',
          role: Role.Admin,
        },
        workspaceId: fixture.workspaceB.id,
      }),
    ).toThrow('workspace access denied');

    const row = matrixRow(IsolationMatrixRowId.RbacPeopleRoleAssignment);
    expect(row.executionStatus).toBe('pass');
    expect(row.passReason).toMatch(/Identity-global/i);
    expect(row.negativeRegression).toMatch(/Workspace B/i);
  });

  it(`[${IsolationMatrixRowId.WorkspaceMembershipBoundary}] runtime + regression: foreign workspace id substitution denied`, async () => {
    const fixture = await createDualWorkspaceIsolationFixture();

    expect(fixture.access.isMember(fixture.workspaceA.id, fixture.operatorAId)).toBe(true);
    expect(fixture.access.isMember(fixture.workspaceB.id, fixture.operatorAId)).toBe(false);
    expect(
      fixture.access.resolveAccessibleWorkspaceId(fixture.workspaceB.id, fixture.operatorAId),
    ).toBeNull();
    expect(() => fixture.access.assertMember(fixture.workspaceB.id, fixture.operatorAId)).toThrow(
      'workspace access denied',
    );
  });
});

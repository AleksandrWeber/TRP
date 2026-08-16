import { describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { AuthorizationDecisionService } from './authorization-decision.service';
import { decideAuthorization } from './authorization-decision';
import { PermissionClass } from './permission-catalog';

describe('AuthorizationDecisionService (V3-S02-a)', () => {
  const decisions = new AuthorizationDecisionService();

  const fixtures = {
    reader: Role.Reader,
    researcher: Role.Researcher,
    trader: Role.Trader,
    admin: Role.Admin,
  };

  it('allows an explicit matrix cell', () => {
    expect(
      decisions.decide({
        role: fixtures.trader,
        action: PermissionClass.PaperCommand,
        workspaceMember: true,
      }),
    ).toEqual({ allowed: true });
  });

  it('denies a missing permission (default deny)', () => {
    expect(
      decisions.decide({
        role: fixtures.researcher,
        action: PermissionClass.PaperCommand,
      }),
    ).toEqual({ allowed: false, reason: 'missing_permission' });
  });

  it('denies an unknown permission', () => {
    expect(decisions.decide({ role: fixtures.trader, action: 'C99' })).toEqual({
      allowed: false,
      reason: 'unknown_permission',
    });
  });

  it('denies an unknown action', () => {
    expect(decisions.decide({ role: fixtures.admin, action: undefined })).toEqual({
      allowed: false,
      reason: 'unknown_action',
    });
    expect(decisions.decide({ role: fixtures.admin, action: '' })).toEqual({
      allowed: false,
      reason: 'unknown_action',
    });
  });

  it('denies an unknown role', () => {
    expect(decisions.decide({ role: 'Superuser', action: PermissionClass.Projection })).toEqual({
      allowed: false,
      reason: 'unknown_role',
    });
  });

  it('denies unauthorized actions for each fixture role', () => {
    expect(decisions.allows(fixtures.reader, PermissionClass.Research)).toBe(false);
    expect(decisions.allows(fixtures.reader, PermissionClass.PaperCommand)).toBe(false);
    expect(decisions.allows(fixtures.reader, PermissionClass.RoleAdmin)).toBe(false);
    expect(decisions.allows(fixtures.researcher, PermissionClass.PaperCommand)).toBe(false);
    expect(decisions.allows(fixtures.researcher, PermissionClass.RoleAdmin)).toBe(false);
    expect(decisions.allows(fixtures.trader, PermissionClass.RoleAdmin)).toBe(false);
    expect(decisions.allows(fixtures.admin, PermissionClass.LiveCommand)).toBe(false);
    expect(decisions.allows(fixtures.admin, PermissionClass.Bypass)).toBe(false);
  });

  it('lets ownership win over an allowed role', () => {
    expect(
      decideAuthorization({
        role: fixtures.admin,
        action: PermissionClass.PaperCommand,
        workspaceMember: false,
      }),
    ).toEqual({ allowed: false, reason: 'not_member' });
  });

  it('does not require workspace membership for self actions', () => {
    expect(
      decideAuthorization({
        role: fixtures.reader,
        action: PermissionClass.Self,
        workspaceMember: false,
      }),
    ).toEqual({ allowed: true });
  });

  it('does not treat signed-in as an implicit grant', () => {
    expect(decisions.allows(fixtures.reader, PermissionClass.RoleAdmin, true)).toBe(false);
    expect(decisions.allows(fixtures.trader, PermissionClass.LiveCommand, true)).toBe(false);
  });

  it('treats permissions as additive listed cells, not a walked hierarchy', () => {
    expect(decisions.allows(fixtures.admin, PermissionClass.PaperCommand)).toBe(true);
    expect(decisions.allows(fixtures.trader, PermissionClass.RoleAdmin)).toBe(false);
    expect(decisions.allows(fixtures.researcher, PermissionClass.PaperCommand)).toBe(false);
  });
});

describe('Permission model walkthrough (V3-S02-a)', () => {
  const decisions = new AuthorizationDecisionService();

  it('authorized action succeeds', () => {
    expect(
      decisions.decide({
        role: Role.Trader,
        action: PermissionClass.PaperCommand,
        workspaceMember: true,
      }).allowed,
    ).toBe(true);
  });

  it('missing permission denied', () => {
    expect(
      decisions.decide({
        role: Role.Researcher,
        action: PermissionClass.PaperCommand,
      }),
    ).toEqual({ allowed: false, reason: 'missing_permission' });
  });

  it('unknown permission denied', () => {
    expect(decisions.decide({ role: Role.Admin, action: 'not-a-permission' })).toEqual({
      allowed: false,
      reason: 'unknown_permission',
    });
  });

  it('unknown role denied', () => {
    expect(decisions.decide({ role: 'Operator', action: PermissionClass.Self })).toEqual({
      allowed: false,
      reason: 'unknown_role',
    });
  });

  it('unauthorized action denied', () => {
    expect(
      decisions.decide({
        role: Role.Reader,
        action: PermissionClass.Research,
      }),
    ).toEqual({ allowed: false, reason: 'missing_permission' });
  });
});

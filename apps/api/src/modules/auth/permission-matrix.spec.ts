import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Role } from '../identity/role';
import { PermissionClass } from './permission-catalog';
import { ROLE_PERMISSIONS, permissionsForRole, roleAllowsPermission } from './permission-matrix';

const MATRIX_SOURCE = readFileSync(
  join(process.cwd(), 'src/modules/auth/permission-matrix.ts'),
  'utf8',
);

describe('Permission matrix (V3-S02-a)', () => {
  const fixtures = {
    reader: Role.Reader,
    researcher: Role.Researcher,
    trader: Role.Trader,
    admin: Role.Admin,
  };

  it('grants Reader only C1–C3', () => {
    expect([...permissionsForRole(fixtures.reader)]).toEqual([
      PermissionClass.Self,
      PermissionClass.OwnWorkspace,
      PermissionClass.Projection,
    ]);
    expect(roleAllowsPermission(fixtures.reader, PermissionClass.Research)).toBe(false);
    expect(roleAllowsPermission(fixtures.reader, PermissionClass.PaperCommand)).toBe(false);
    expect(roleAllowsPermission(fixtures.reader, PermissionClass.RoleAdmin)).toBe(false);
  });

  it('grants Researcher C4 and denies C5/C6', () => {
    expect(roleAllowsPermission(fixtures.researcher, PermissionClass.Research)).toBe(true);
    expect(roleAllowsPermission(fixtures.researcher, PermissionClass.PaperCommand)).toBe(false);
    expect(roleAllowsPermission(fixtures.researcher, PermissionClass.RoleAdmin)).toBe(false);
  });

  it('grants Trader C5 and denies C6', () => {
    expect(roleAllowsPermission(fixtures.trader, PermissionClass.PaperCommand)).toBe(true);
    expect(roleAllowsPermission(fixtures.trader, PermissionClass.RoleAdmin)).toBe(false);
  });

  it('lists Admin paper command as an explicit cell, not inheritance', () => {
    expect(roleAllowsPermission(fixtures.admin, PermissionClass.PaperCommand)).toBe(true);
    expect(roleAllowsPermission(fixtures.admin, PermissionClass.RoleAdmin)).toBe(true);
    expect(ROLE_PERMISSIONS[Role.Admin]).toContain(PermissionClass.PaperCommand);
    expect(ROLE_PERMISSIONS[Role.Admin]).not.toBe(ROLE_PERMISSIONS[Role.Trader]);
    expect(MATRIX_SOURCE).not.toMatch(/\.\.\.TRADER_ALLOWS/);
    expect(MATRIX_SOURCE).not.toMatch(/\.\.\.RESEARCHER_ALLOWS/);
    expect(MATRIX_SOURCE).not.toMatch(/\bparentRole\b/);
  });

  it('denies live, vault/connections, and bypass for every role', () => {
    for (const role of Object.values(Role)) {
      expect(roleAllowsPermission(role, PermissionClass.LiveCommand)).toBe(false);
      expect(roleAllowsPermission(role, PermissionClass.VaultConnections)).toBe(false);
      expect(roleAllowsPermission(role, PermissionClass.Bypass)).toBe(false);
      expect(roleAllowsPermission(role, PermissionClass.Public)).toBe(false);
    }
  });

  it('keeps register default Researcher off paper command and role admin', () => {
    expect(roleAllowsPermission(Role.Researcher, PermissionClass.PaperCommand)).toBe(false);
    expect(roleAllowsPermission(Role.Researcher, PermissionClass.RoleAdmin)).toBe(false);
  });
});

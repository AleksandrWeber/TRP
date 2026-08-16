import { describe, expect, it } from 'vitest';
import {
  PERMISSION_CATALOG,
  PermissionClass,
  isKnownPermission,
  resolvePermission,
} from './permission-catalog';

describe('Permission catalog (V3-S02-a)', () => {
  it('names exactly C0–C9', () => {
    expect(Object.values(PermissionClass).sort()).toEqual([
      'C0',
      'C1',
      'C2',
      'C3',
      'C4',
      'C5',
      'C6',
      'C7',
      'C8',
      'C9',
    ]);
    expect(Object.keys(PERMISSION_CATALOG).sort()).toEqual(Object.values(PermissionClass).sort());
  });

  it('resolves catalog ids and rejects unknown permissions', () => {
    expect(resolvePermission(PermissionClass.PaperCommand)).toBe(PermissionClass.PaperCommand);
    expect(resolvePermission('C5')).toBe(PermissionClass.PaperCommand);
    expect(isKnownPermission('C4')).toBe(true);

    expect(resolvePermission('C99')).toBeNull();
    expect(resolvePermission('paper.command')).toBeNull();
    expect(resolvePermission('Research')).toBeNull();
    expect(isKnownPermission('unknown')).toBe(false);
    expect(isKnownPermission(undefined)).toBe(false);
  });
});

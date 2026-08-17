/**
 * Version 3 permission catalog (V3-S02-a).
 * Classes C0–C9 from the approved S02 permission model.
 * Unknown identifiers are not in this catalog and must be denied.
 */

export enum PermissionClass {
  Public = 'C0',
  Self = 'C1',
  OwnWorkspace = 'C2',
  Projection = 'C3',
  Research = 'C4',
  PaperCommand = 'C5',
  RoleAdmin = 'C6',
  LiveCommand = 'C7',
  VaultConnections = 'C8',
  Bypass = 'C9',
}

export type PermissionCatalogEntry = Readonly<{
  id: PermissionClass;
  title: string;
  /** Workspace membership is required when the caller supplies a membership fact. */
  requiresMembership: boolean;
}>;

export const PERMISSION_CATALOG: Readonly<Record<PermissionClass, PermissionCatalogEntry>> = {
  [PermissionClass.Public]: {
    id: PermissionClass.Public,
    title: 'Public',
    requiresMembership: false,
  },
  [PermissionClass.Self]: {
    id: PermissionClass.Self,
    title: 'Self',
    requiresMembership: false,
  },
  [PermissionClass.OwnWorkspace]: {
    id: PermissionClass.OwnWorkspace,
    title: 'Own workspace',
    requiresMembership: true,
  },
  [PermissionClass.Projection]: {
    id: PermissionClass.Projection,
    title: 'Projection',
    requiresMembership: true,
  },
  [PermissionClass.Research]: {
    id: PermissionClass.Research,
    title: 'Research',
    requiresMembership: true,
  },
  [PermissionClass.PaperCommand]: {
    id: PermissionClass.PaperCommand,
    title: 'Paper command',
    requiresMembership: true,
  },
  [PermissionClass.RoleAdmin]: {
    id: PermissionClass.RoleAdmin,
    title: 'Role admin',
    requiresMembership: true,
  },
  [PermissionClass.LiveCommand]: {
    id: PermissionClass.LiveCommand,
    title: 'Live command',
    requiresMembership: true,
  },
  [PermissionClass.VaultConnections]: {
    id: PermissionClass.VaultConnections,
    title: 'Vault / connections',
    requiresMembership: true,
  },
  [PermissionClass.Bypass]: {
    id: PermissionClass.Bypass,
    title: 'Bypass',
    requiresMembership: true,
  },
};

const KNOWN_PERMISSIONS = new Set<string>(Object.values(PermissionClass));

export function isKnownPermission(value: unknown): value is PermissionClass {
  return typeof value === 'string' && KNOWN_PERMISSIONS.has(value);
}

/** Catalog lookup only. Unknown actions resolve to null and must be denied. */
export function resolvePermission(action: unknown): PermissionClass | null {
  if (isKnownPermission(action)) {
    return action;
  }
  return null;
}

export function permissionRequiresMembership(permission: PermissionClass): boolean {
  return PERMISSION_CATALOG[permission].requiresMembership;
}

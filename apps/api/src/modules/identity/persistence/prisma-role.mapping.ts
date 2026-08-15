import { Role as PrismaRole } from '@prisma/client';
import { Role } from '../role';

/**
 * Maps Identity Role (US107) onto the existing Prisma Role enum.
 * Not an RBAC redesign — the two enums already coexisted.
 */
export function toPrismaRole(role: Role): PrismaRole {
  switch (role) {
    case Role.Admin:
      return PrismaRole.ADMINISTRATOR;
    case Role.Trader:
      return PrismaRole.TRADER;
    case Role.Reader:
      return PrismaRole.VIEWER;
    case Role.Researcher:
      return PrismaRole.RESEARCHER;
    default: {
      const exhaustive: never = role;
      throw new Error(`unsupported Identity role: ${String(exhaustive)}`);
    }
  }
}

export function toIdentityRole(role: PrismaRole): Role {
  switch (role) {
    case PrismaRole.ADMINISTRATOR:
      return Role.Admin;
    case PrismaRole.TRADER:
      return Role.Trader;
    case PrismaRole.VIEWER:
      return Role.Reader;
    case PrismaRole.RESEARCHER:
      return Role.Researcher;
    default: {
      const exhaustive: never = role;
      throw new Error(`unsupported Prisma role: ${String(exhaustive)}`);
    }
  }
}

import { describe, expect, it } from 'vitest';
import { Role as PrismaRole } from '@prisma/client';
import { Role } from '../role';
import { toIdentityRole, toPrismaRole } from './prisma-role.mapping';

describe('prisma role mapping (PC-18)', () => {
  it('round-trips existing Identity roles onto the existing Prisma enum', () => {
    expect(toPrismaRole(Role.Admin)).toBe(PrismaRole.ADMINISTRATOR);
    expect(toPrismaRole(Role.Researcher)).toBe(PrismaRole.RESEARCHER);
    expect(toPrismaRole(Role.Trader)).toBe(PrismaRole.TRADER);
    expect(toPrismaRole(Role.Reader)).toBe(PrismaRole.VIEWER);

    expect(toIdentityRole(PrismaRole.ADMINISTRATOR)).toBe(Role.Admin);
    expect(toIdentityRole(PrismaRole.RESEARCHER)).toBe(Role.Researcher);
    expect(toIdentityRole(PrismaRole.TRADER)).toBe(Role.Trader);
    expect(toIdentityRole(PrismaRole.VIEWER)).toBe(Role.Reader);
  });
});

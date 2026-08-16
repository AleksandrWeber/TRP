/**
 * Identity authorization roles (US107 / US158 / V3-S02-a).
 * Distinct from legacy Prisma Role enum.
 * `Admin` is the Administrator role for trading command authorization.
 * `Trader` may issue paper trading commands; `Reader` / `Researcher` may not.
 * Version 3 has no fifth role and no inheritance engine.
 */
export enum Role {
  Reader = 'Reader',
  Researcher = 'Researcher',
  Trader = 'Trader',
  Admin = 'Admin',
}

const KNOWN_ROLES = new Set<string>(Object.values(Role));

export function isKnownRole(value: unknown): value is Role {
  return typeof value === 'string' && KNOWN_ROLES.has(value);
}

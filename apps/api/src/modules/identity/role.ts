/**
 * Identity authorization roles (US107 / US158).
 * Distinct from legacy Prisma Role enum.
 * `Admin` is the Administrator role for trading command authorization.
 * `Trader` may issue paper trading commands; `Reader` / `Researcher` may not.
 */
export enum Role {
  Reader = 'Reader',
  Researcher = 'Researcher',
  Trader = 'Trader',
  Admin = 'Admin',
}

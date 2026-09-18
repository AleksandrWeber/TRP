/**
 * FIV-CONN-04-B-04 — Companion DI contract for same-txn durable fencing CAS.
 *
 * IMPL-COND-B04-01: MUST bind via Nest useExisting → PrismaMigrationGateAdapter.
 * MUST NOT introduce a second CAS / lease / fence / SoT implementation.
 *
 * Does not perform Connection.environment UPDATE (04-D owns that later).
 */

import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import type { MigrationGateGrant } from './migration-gate';

export const MIGRATION_GATE_DURABLE_AUTHORITY = Symbol('MIGRATION_GATE_DURABLE_AUTHORITY');

/**
 * Same-transaction durable authority proof surface for future 04-D consumers.
 * observe() / validate() alone are NEVER sufficient write authority.
 */
export interface MigrationGateDurableAuthority {
  assertDurableAuthorityCas(
    transaction: TransactionContext,
    grant: MigrationGateGrant,
  ): Promise<boolean>;
}

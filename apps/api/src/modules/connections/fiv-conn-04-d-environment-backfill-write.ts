/**
 * FIV-CONN-04-D Stage 3 — Environment backfill write-unit
 * (authority / CAS scaffolding only under D-CONN04-FULL-D-IA-S23-B-S3).
 *
 * Invoked only from Conn04SystemJobMigrationEntry.
 * REUSES Conn04MigrationBoundaryService.assertWriteAuthority (lease fence CAS).
 * Does NOT mutate connection environment columns.
 * Does NOT run Full-D operational backfill orchestration.
 * Does NOT emit operational backfill audits.
 * Does NOT construct privileged actor context or a second SYSTEM_JOB identity.
 */

import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import {
  Conn04MigrationBoundaryService,
  type Conn04WriteProofResult,
} from './conn04-migration-boundary.service';
import type { MigrationGateGrant } from './migration-gate';

@Injectable()
export class FivConn04DEnvironmentBackfillWrite {
  constructor(private readonly boundary: Conn04MigrationBoundaryService) {}

  /**
   * Same-transaction write-authority / CAS scaffold.
   * Fail-closed: authority deny, CAS miss, or unexpected failure is never success.
   * Does not mutate connection environment columns.
   */
  async assertWriteAuthorityInTransaction(
    transaction: TransactionContext,
    grant: MigrationGateGrant,
  ): Promise<Conn04WriteProofResult> {
    const proof = await this.boundary.assertWriteAuthority(transaction, grant);
    if (!proof.ok) {
      return proof;
    }
    return { ok: true };
  }
}

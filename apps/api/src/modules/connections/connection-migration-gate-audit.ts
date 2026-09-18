import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';
import { SecurityAuditService } from '../security-audit/security-audit.service';
import {
  MIGRATION_GATE_AUDIT_EVENT_TYPE,
  type MigrationGateAuditOutcome,
  sanitizeMigrationGateAuditPayload,
} from './migration-gate';

@Injectable()
export class ConnectionMigrationGateAudit {
  constructor(private readonly audit: SecurityAuditService) {}

  async record(
    input: {
      outcome: MigrationGateAuditOutcome;
      actorId: string;
      payload: Readonly<Record<string, unknown>>;
      correlationId?: string;
    },
    transaction?: TransactionContext,
  ): Promise<void> {
    const sanitized = sanitizeMigrationGateAuditPayload(input.payload);
    if (!sanitized.ok) {
      throw new Error(`Migration-gate audit payload rejected: ${sanitized.reason}`);
    }
    await this.audit.record(
      {
        eventType: MIGRATION_GATE_AUDIT_EVENT_TYPE,
        outcome: input.outcome,
        source: 'connections',
        attribution: {
          actorId: input.actorId,
          resourceType: 'migration-gate',
          resourceId: 'FIV-CONN-04',
        },
        ...(input.correlationId !== undefined ? { correlationId: input.correlationId } : {}),
        payload: sanitized.value,
      },
      transaction,
    );
  }
}

import type {
  SecurityAuditRecord,
  SecurityAuditTimelineCursor,
  SecurityAuditTimelinePage,
} from './security-audit-record';
import type { TransactionContext } from '../../storage/prisma/prisma-transaction.service';

/**
 * Append-only persistence port. There are deliberately no update or delete
 * operations on product paths.
 */
export interface SecurityAuditRepository {
  append(record: SecurityAuditRecord, transaction?: TransactionContext): Promise<void>;
  /** Internal-only complete read for deterministic integrity verification. */
  readAllForIntegrityVerification(): Promise<readonly SecurityAuditRecord[]>;
  /**
   * Workspace-scoped, forward-only navigation. This is not a search or filter
   * API: it only exposes the next chronological investigation window.
   */
  readTimeline(input: {
    workspaceId: string;
    after?: SecurityAuditTimelineCursor;
    limit: number;
  }): Promise<SecurityAuditTimelinePage>;
}

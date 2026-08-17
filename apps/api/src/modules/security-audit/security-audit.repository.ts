import type {
  SecurityAuditRecord,
  SecurityAuditTimelineCursor,
  SecurityAuditTimelinePage,
} from './security-audit-record';

/**
 * Append-only persistence port. There are deliberately no update or delete
 * operations on product paths.
 */
export interface SecurityAuditRepository {
  append(record: SecurityAuditRecord): Promise<void>;
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

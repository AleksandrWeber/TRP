import type { RuntimeLease } from './runtime-lease';

/**
 * Port for storing ownership leases. Implementations are deliberately out of scope.
 */
export interface RuntimeLeaseRepository {
  acquire(lease: RuntimeLease): Promise<RuntimeLease>;
  release(leaseId: string, ownerId: string): Promise<void>;
  findActiveLease(sessionId: string, now: string): Promise<RuntimeLease | null>;
  findBySessionId(sessionId: string): Promise<RuntimeLease | null>;
}

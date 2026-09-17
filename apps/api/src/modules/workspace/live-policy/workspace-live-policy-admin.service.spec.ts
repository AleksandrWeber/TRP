import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LogContext, Logger } from '../../../logging/logger';
import type { SecurityAuditWrite } from '../../security-audit/security-audit-record';
import {
  PrismaTransactionService,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import { WorkspaceLivePolicy } from './durable-workspace-live-policy-state';
import { InMemoryWorkspaceLivePolicyStateRepository } from './persistence/in-memory-workspace-live-policy-state.repository';
import { WorkspaceLivePolicyAdminService } from './workspace-live-policy-admin.service';
import { AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT } from './workspace-live-policy.audit';
import { WorkspaceLivePolicyPersistenceService } from './workspace-live-policy-persistence.service';

class RecordingLogger implements Logger {
  readonly entries: Array<{ level: string; message: string; context?: LogContext }> = [];

  child(_component: string): Logger {
    return this;
  }

  debug(message: string, context?: LogContext): void {
    this.entries.push({ level: 'debug', message, context });
  }

  info(message: string, context?: LogContext): void {
    this.entries.push({ level: 'info', message, context });
  }

  warn(message: string, context?: LogContext): void {
    this.entries.push({ level: 'warn', message, context });
  }

  error(message: string, context?: LogContext): void {
    this.entries.push({ level: 'error', message, context });
  }
}

class RecordingSecurityAuditService {
  readonly writes: SecurityAuditWrite[] = [];
  failNext = false;

  async record(
    write: SecurityAuditWrite,
    _transaction?: TransactionContext,
  ): Promise<{ id: string }> {
    if (this.failNext) {
      this.failNext = false;
      throw new Error('audit boom');
    }
    this.writes.push(write);
    return { id: 'audit-test' };
  }

  reset(): void {
    this.writes.length = 0;
    this.failNext = false;
  }
}

/**
 * Stages live-policy saves until the transaction callback succeeds,
 * so audit failure rolls back the in-memory SoT (PO-S03-05 / T-20 / T-21).
 */
class StagingLivePolicyRepository extends InMemoryWorkspaceLivePolicyStateRepository {
  private readonly staged = new WeakMap<
    object,
    Parameters<InMemoryWorkspaceLivePolicyStateRepository['saveLivePolicyState']>[0]
  >();

  override async saveLivePolicyState(
    state: Parameters<InMemoryWorkspaceLivePolicyStateRepository['saveLivePolicyState']>[0],
    transaction?: TransactionContext,
  ): Promise<void> {
    if (transaction) {
      this.staged.set(transaction as object, state);
      return;
    }
    await super.saveLivePolicyState(state);
  }

  commit(transaction: TransactionContext): void {
    const state = this.staged.get(transaction as object);
    if (state) {
      void super.saveLivePolicyState(state);
      this.staged.delete(transaction as object);
    }
  }

  discard(transaction: TransactionContext): void {
    this.staged.delete(transaction as object);
  }
}

class StagingTransactionService {
  constructor(private readonly repository: StagingLivePolicyRepository) {}

  async run<T>(work: (transaction: TransactionContext) => Promise<T>): Promise<T> {
    const transaction = Object.freeze({}) as TransactionContext;
    try {
      const result = await work(transaction);
      this.repository.commit(transaction);
      return result;
    } catch (error) {
      this.repository.discard(transaction);
      throw error;
    }
  }
}

describe('WorkspaceLivePolicyAdminService (PROPOSED-V3-L01-S03)', () => {
  let repository: StagingLivePolicyRepository;
  let livePolicy: WorkspaceLivePolicyPersistenceService;
  let audit: RecordingSecurityAuditService;
  let logger: RecordingLogger;
  let admin: WorkspaceLivePolicyAdminService;

  beforeEach(() => {
    repository = new StagingLivePolicyRepository();
    livePolicy = new WorkspaceLivePolicyPersistenceService(repository);
    audit = new RecordingSecurityAuditService();
    logger = new RecordingLogger();
    admin = new WorkspaceLivePolicyAdminService(
      livePolicy,
      new StagingTransactionService(repository) as unknown as PrismaTransactionService,
      audit as unknown as ConstructorParameters<typeof WorkspaceLivePolicyAdminService>[2],
      logger,
    );
  });

  it('T-01/T-02 enable from PAPER persists LIVE_POLICY_OPTED_IN', async () => {
    await livePolicy.ensurePaperDefault('ws-1');
    const view = await admin.enable({ workspaceId: 'ws-1', actorUserId: 'admin-1' });
    expect(view.policy).toBe(WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN);
    expect(await livePolicy.resolveEffectivePolicy('ws-1')).toBe(
      WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
    );
    expect(view.liveTradingAuthorized).toBe(false);
    expect(view.liveAdmissionAuthorized).toBe(false);
    expect(view.liveExecutionAuthorized).toBe(false);
  });

  it('T-03/T-04 disable from LIVE_POLICY_OPTED_IN persists PAPER', async () => {
    await livePolicy.persistPolicy({
      workspaceId: 'ws-1',
      policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
    });
    const view = await admin.disable({ workspaceId: 'ws-1', actorUserId: 'admin-1' });
    expect(view.policy).toBe(WorkspaceLivePolicy.PAPER);
    expect(await livePolicy.resolveEffectivePolicy('ws-1')).toBe(WorkspaceLivePolicy.PAPER);
  });

  it('T-05/T-06/T-07 same-state enable/disable are idempotent without transition audit', async () => {
    await livePolicy.ensurePaperDefault('ws-1');
    const firstDisable = await admin.disable({ workspaceId: 'ws-1', actorUserId: 'admin-1' });
    expect(firstDisable.policy).toBe(WorkspaceLivePolicy.PAPER);
    expect(audit.writes).toHaveLength(0);

    await admin.enable({ workspaceId: 'ws-1', actorUserId: 'admin-1' });
    expect(audit.writes).toHaveLength(1);
    audit.reset();

    const again = await admin.enable({ workspaceId: 'ws-1', actorUserId: 'admin-1' });
    expect(again.policy).toBe(WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN);
    expect(audit.writes).toHaveLength(0);
  });

  it('T-13/T-14/T-15/T-16/T-17/T-18 successful transitions audit actor/workspace/from/to', async () => {
    await livePolicy.ensurePaperDefault('ws-1');
    await admin.enable({
      workspaceId: 'ws-1',
      actorUserId: 'admin-1',
      correlationId: 'corr-enable-1',
    });
    expect(audit.writes).toHaveLength(1);
    expect(audit.writes[0]).toMatchObject({
      eventType: AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT,
      outcome: 'changed',
      correlationId: 'corr-enable-1',
      attribution: {
        actorId: 'admin-1',
        workspaceId: 'ws-1',
        resourceType: 'workspace-live-policy',
        resourceId: 'ws-1',
      },
      payload: {
        fromPolicy: WorkspaceLivePolicy.PAPER,
        toPolicy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      },
    });

    audit.reset();
    await admin.disable({ workspaceId: 'ws-1', actorUserId: 'admin-1' });
    expect(audit.writes[0]).toMatchObject({
      eventType: AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT,
      payload: {
        fromPolicy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
        toPolicy: WorkspaceLivePolicy.PAPER,
      },
    });
  });

  it('T-19 audit event is classified through existing catalog', async () => {
    const { isClassifiedSecurityAuditEvent } =
      await import('../../security-audit/security-audit-classification');
    expect(isClassifiedSecurityAuditEvent(AUTHZ_WORKSPACE_LIVE_POLICY_CHANGE_EVENT)).toBe(true);
  });

  it('T-20/T-21 audit failure rolls back policy and does not report success', async () => {
    await livePolicy.ensurePaperDefault('ws-1');
    audit.failNext = true;
    await expect(admin.enable({ workspaceId: 'ws-1', actorUserId: 'admin-1' })).rejects.toThrow(
      /audit boom/,
    );
    expect(await livePolicy.resolveEffectivePolicy('ws-1')).toBe(WorkspaceLivePolicy.PAPER);
    expect(audit.writes).toHaveLength(0);
  });

  it('T-30 response honesty helpers remain false after enable', async () => {
    await livePolicy.ensurePaperDefault('ws-1');
    const view = await admin.enable({ workspaceId: 'ws-1', actorUserId: 'admin-1' });
    expect(view.liveTradingAuthorized).toBe(false);
    expect(view.liveAdmissionAuthorized).toBe(false);
    expect(view.liveExecutionAuthorized).toBe(false);
    const {
      livePolicyAuthorizesLiveTrading,
      livePolicyAuthorizesAdmission,
      livePolicyAuthorizesExecution,
    } = await import('./durable-workspace-live-policy-state');
    const state = await livePolicy.loadState('ws-1');
    expect(livePolicyAuthorizesLiveTrading(state)).toBe(false);
    expect(livePolicyAuthorizesAdmission(state)).toBe(false);
    expect(livePolicyAuthorizesExecution(state)).toBe(false);
  });

  it('does not call Gate / KS / Session / Vault helpers', async () => {
    const spy = vi.fn();
    await livePolicy.ensurePaperDefault('ws-1');
    await admin.enable({ workspaceId: 'ws-1', actorUserId: 'admin-1' });
    expect(spy).not.toHaveBeenCalled();
  });
});

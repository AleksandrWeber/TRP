import { describe, expect, it, vi } from 'vitest';
import type { SecurityAuditService } from '../security-audit/security-audit.service';
import { PaperTradingAccountAudit } from './paper-trading-account.audit';

describe('PaperTradingAccountAudit (W2-S04-a)', () => {
  it('emits Paper Account lifecycle outcomes through Security Audit', async () => {
    const record = vi.fn().mockResolvedValue(undefined);
    const audit = new PaperTradingAccountAudit({ record } as unknown as SecurityAuditService);

    await audit.record({
      outcome: 'paper_account_created',
      workspaceId: 'workspace-a',
      actorUserId: 'user-1',
      paperAccountId: 'pa-1',
      status: 'ACTIVE',
      baseCurrency: 'USD',
    });

    expect(record).toHaveBeenCalledWith({
      eventType: 'connection.lifecycle',
      outcome: 'paper_account_created',
      source: 'paper-trading-foundation',
      attribution: {
        workspaceId: 'workspace-a',
        actorId: 'user-1',
        resourceType: 'paper_account',
        resourceId: 'pa-1',
      },
      payload: {
        paperAccount: true,
        status: 'ACTIVE',
        baseCurrency: 'USD',
      },
    });
  });
});

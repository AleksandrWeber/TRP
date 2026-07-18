import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { Role } from '../identity/role';
import { AccountingQueryController } from './accounting-query.controller';
import type { AccountingQueryService } from './accounting-query.service';

const request = {
  user: {
    userId: 'user-1',
    email: 'reader@example.com',
    displayName: 'Reader',
    role: Role.Reader,
  },
};

describe('US178 — accounting query API', () => {
  it('passes only the authorized workspace and preserves decimal-string views', async () => {
    const queries = {
      portfolioView: vi.fn().mockResolvedValue({
        dataClass: 'portfolio_projection',
        projection: true,
        authoritative: false,
        portfolio: { equity: '1000.25', totalPnl: '0.25' },
      }),
    };
    const access = { assertMember: vi.fn() };
    const controller = new AccountingQueryController(
      queries as unknown as AccountingQueryService,
      access as never,
    );

    const result = await controller.portfolio(request, 'account-1', 'workspace-1');

    expect(access.assertMember).toHaveBeenCalledWith('workspace-1', 'user-1');
    expect(queries.portfolioView).toHaveBeenCalledWith('workspace-1', 'account-1');
    expect(result.portfolio?.equity).toBe('1000.25');
    expect(typeof result.portfolio?.equity).toBe('string');
  });

  it('rejects cross-workspace reads before invoking a query', async () => {
    const queries = { ledgerView: vi.fn() };
    const access = {
      assertMember: vi.fn(() => {
        throw new Error('not a member');
      }),
    };
    const controller = new AccountingQueryController(
      queries as unknown as AccountingQueryService,
      access as never,
    );

    await expect(controller.ledger(request, 'account-2', 'workspace-2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(queries.ledgerView).not.toHaveBeenCalled();
  });
});

import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateTradingSessionBodyDto } from './trading-session.dto';

describe('Trading Session DTOs (PC-13 / PC-15 15-a)', () => {
  it('accepts a strategy-origin paper create', () => {
    const dto = Object.assign(new CreateTradingSessionBodyDto(), {
      paperAccountId: 'acct-1',
      deploymentId: 'dep-1',
      origin: 'strategy',
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('accepts optional SessionHandoffIntent id on the existing create transport', () => {
    const dto = Object.assign(new CreateTradingSessionBodyDto(), {
      paperAccountId: 'acct-1',
      deploymentId: 'dep-1',
      origin: 'strategy',
      sessionHandoffIntentId: 'handoff-1',
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects live and manual origin on the product transport', () => {
    const live = Object.assign(new CreateTradingSessionBodyDto(), {
      paperAccountId: 'acct-1',
      deploymentId: 'dep-1',
      origin: 'live',
    });
    expect(validateSync(live).length).toBeGreaterThan(0);

    const manual = Object.assign(new CreateTradingSessionBodyDto(), {
      paperAccountId: 'acct-1',
      deploymentId: 'dep-1',
      origin: 'manual',
    });
    expect(validateSync(manual).length).toBeGreaterThan(0);
  });
});

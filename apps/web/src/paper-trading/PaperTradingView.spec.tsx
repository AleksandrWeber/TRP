import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PaperTradingAccountProjection } from '../shared/api';
import { PaperTradingView } from './PaperTradingView';

const notCreated: PaperTradingAccountProjection = {
  status: 'NOT_CREATED',
  account: null,
};

const active: PaperTradingAccountProjection = {
  status: 'ACTIVE',
  account: {
    id: 'pa-1',
    workspaceId: 'workspace-a',
    status: 'ACTIVE',
    baseCurrency: 'USD',
    startingBalance: '100000',
    currentBalance: '100000',
    ownerId: 'user-1',
    createdAt: '2026-08-26T00:00:00.000Z',
    updatedAt: '2026-08-26T00:00:00.000Z',
  },
};

const disabled: PaperTradingAccountProjection = {
  status: 'DISABLED',
  account: {
    ...active.account!,
    status: 'DISABLED',
  },
};

describe('Paper Trading UI (W2-S04-a)', () => {
  it('renders create Paper Account when Not Created', () => {
    const html = renderToStaticMarkup(
      <PaperTradingView
        projection={notCreated}
        loading={false}
        saving={false}
        error={null}
        startingBalance="100000"
        onStartingBalanceChange={() => undefined}
        onCreate={() => undefined}
        onDisable={() => undefined}
        onActivate={() => undefined}
      />,
    );
    expect(html).toContain('Create Paper Account');
    expect(html).toContain('Not Created');
    expect(html).not.toContain('Place Buy');
    expect(html).not.toContain('Place Sell');
    expect(html).not.toMatch(/>Orders</);
    expect(html).not.toMatch(/>Positions</);
    expect(html).not.toMatch(/>Portfolio</);
    expect(html).toContain('No orders. No positions. No portfolio. No PnL. No Live Trading.');
  });

  it('renders Active account fields without trading controls', () => {
    const html = renderToStaticMarkup(
      <PaperTradingView
        projection={active}
        loading={false}
        saving={false}
        error={null}
        startingBalance="100000"
        onStartingBalanceChange={() => undefined}
        onCreate={() => undefined}
        onDisable={() => undefined}
        onActivate={() => undefined}
      />,
    );
    expect(html).toContain('Active');
    expect(html).toContain('USD');
    expect(html).toContain('100000');
    expect(html).toContain('Disable Paper Account');
    expect(html).toContain('No orders. No positions. No portfolio. No PnL. No Live Trading.');
  });

  it('renders Disabled account state', () => {
    const html = renderToStaticMarkup(
      <PaperTradingView
        projection={disabled}
        loading={false}
        saving={false}
        error={null}
        startingBalance="100000"
        onStartingBalanceChange={() => undefined}
        onCreate={() => undefined}
        onDisable={() => undefined}
        onActivate={() => undefined}
      />,
    );
    expect(html).toContain('Disabled');
    expect(html).toContain('Activate Paper Account');
  });
});

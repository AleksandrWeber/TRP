import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PaperFillView, PaperOrderView, PaperTradingAccountProjection } from '../shared/api';
import { PaperTradingView, type PaperOrderFormState } from './PaperTradingView';

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

const pendingOrder: PaperOrderView = {
  id: 'o-1',
  workspaceId: 'workspace-a',
  paperAccountId: 'pa-1',
  exchange: 'BINANCE',
  symbol: 'BTC-USDT',
  side: 'BUY',
  orderType: 'LIMIT',
  quantity: '1',
  limitPrice: '50000',
  stopPrice: null,
  status: 'PENDING',
  createdAt: '2026-08-26T00:00:00.000Z',
  updatedAt: '2026-08-26T00:00:00.000Z',
};

const fill: PaperFillView = {
  id: 'f-1',
  workspaceId: 'workspace-a',
  paperAccountId: 'pa-1',
  paperOrderId: 'o-1',
  exchange: 'BINANCE',
  symbol: 'BTC-USDT',
  side: 'BUY',
  quantity: '1',
  executionPrice: '49900',
  executionTime: '2026-08-26T01:00:00.000Z',
  createdAt: '2026-08-26T01:00:00.000Z',
};

const form: PaperOrderFormState = {
  exchange: 'BINANCE',
  symbol: 'BTC-USDT',
  side: 'BUY',
  orderType: 'LIMIT',
  quantity: '1',
  limitPrice: '50000',
  stopPrice: '',
};

const baseHandlers = {
  onStartingBalanceChange: () => undefined,
  onCreateAccount: () => undefined,
  onDisableAccount: () => undefined,
  onActivateAccount: () => undefined,
  onOrderFormChange: () => undefined,
  onCreateOrder: () => undefined,
  onSelectOrder: () => undefined,
  onCancelOrder: () => undefined,
  onExecuteOrder: () => undefined,
  onSelectFill: () => undefined,
};

describe('Paper Trading UI (W2-S04-c)', () => {
  it('renders create Paper Account when Not Created', () => {
    const html = renderToStaticMarkup(
      <PaperTradingView
        projection={notCreated}
        orders={[]}
        fills={[]}
        selectedOrderId={null}
        selectedFillId={null}
        orderForm={form}
        loading={false}
        saving={false}
        error={null}
        startingBalance="100000"
        {...baseHandlers}
      />,
    );
    expect(html).toContain('Create Paper Account');
    expect(html).toContain('Not Created');
    expect(html).not.toContain('Create Order');
  });

  it('renders Execute Matching for Pending orders and View Paper Fill', () => {
    const html = renderToStaticMarkup(
      <PaperTradingView
        projection={active}
        orders={[pendingOrder]}
        fills={[fill]}
        selectedOrderId="o-1"
        selectedFillId="f-1"
        orderForm={form}
        loading={false}
        saving={false}
        error={null}
        startingBalance="100000"
        {...baseHandlers}
      />,
    );
    expect(html).toContain('Execute Matching');
    expect(html).toContain('Paper Fills');
    expect(html).toContain('View Paper Fill');
    expect(html).toContain('49900');
    expect(html).toContain('Local simulated execution based on Market Data');
    expect(html).toContain('No positions. No portfolio. No PnL.');
    expect(html).not.toMatch(/>Position</);
    expect(html).not.toMatch(/>Portfolio</);
    expect(html).not.toMatch(/>PnL</);
  });

  it('renders validation errors', () => {
    const html = renderToStaticMarkup(
      <PaperTradingView
        projection={active}
        orders={[]}
        fills={[]}
        selectedOrderId={null}
        selectedFillId={null}
        orderForm={form}
        loading={false}
        saving={false}
        error="market data unavailable for BINANCE BTC-USDT"
        startingBalance="100000"
        {...baseHandlers}
      />,
    );
    expect(html).toContain('market data unavailable for BINANCE BTC-USDT');
  });
});

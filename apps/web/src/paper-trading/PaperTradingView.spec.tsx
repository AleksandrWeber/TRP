import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PaperOrderView, PaperTradingAccountProjection } from '../shared/api';
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
};

describe('Paper Trading UI (W2-S04-b)', () => {
  it('renders create Paper Account when Not Created', () => {
    const html = renderToStaticMarkup(
      <PaperTradingView
        projection={notCreated}
        orders={[]}
        selectedOrderId={null}
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

  it('renders create order, order list, cancel, and review without fills or PnL theater', () => {
    const html = renderToStaticMarkup(
      <PaperTradingView
        projection={active}
        orders={[pendingOrder]}
        selectedOrderId="o-1"
        orderForm={form}
        loading={false}
        saving={false}
        error={null}
        startingBalance="100000"
        {...baseHandlers}
      />,
    );
    expect(html).toContain('Create Order');
    expect(html).toContain('Order List');
    expect(html).toContain('Cancel Order');
    expect(html).toContain('Review Order');
    expect(html).toContain('Pending');
    expect(html).toContain('Not filled. Not executed.');
    expect(html).toContain('No fills. No positions. No portfolio. No PnL. No balance change.');
    expect(html).not.toMatch(/>Filled</);
    expect(html).not.toMatch(/>Executed</);
    expect(html).not.toMatch(/>Position</);
    expect(html).not.toMatch(/>Portfolio</);
  });

  it('renders validation errors', () => {
    const html = renderToStaticMarkup(
      <PaperTradingView
        projection={active}
        orders={[]}
        selectedOrderId={null}
        orderForm={form}
        loading={false}
        saving={false}
        error="unknown symbol: DOGE-USDT"
        startingBalance="100000"
        {...baseHandlers}
      />,
    );
    expect(html).toContain('unknown symbol: DOGE-USDT');
  });
});

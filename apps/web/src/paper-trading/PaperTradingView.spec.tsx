import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type {
  PaperFillView,
  PaperFoundationExecutionHistoryView,
  PaperFoundationPnLView,
  PaperFoundationPortfolioView,
  PaperFoundationPositionView,
  PaperOrderView,
  PaperTradingAccountProjection,
} from '../shared/api';
import { PaperTradingView, type PaperOrderFormState } from './PaperTradingView';

const active: PaperTradingAccountProjection = {
  status: 'ACTIVE',
  account: {
    id: 'pa-1',
    workspaceId: 'workspace-a',
    status: 'ACTIVE',
    baseCurrency: 'USD',
    startingBalance: '100000',
    currentBalance: '49990',
    ownerId: 'user-1',
    createdAt: '2026-08-26T00:00:00.000Z',
    updatedAt: '2026-08-26T01:00:00.000Z',
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

const positions: PaperFoundationPositionView[] = [
  {
    exchange: 'BINANCE',
    symbol: 'BTC-USDT',
    side: 'LONG',
    quantity: '1',
    averageEntryPrice: '49900',
    markPrice: '50500',
    realizedPnL: '0',
    unrealizedPnL: '600',
  },
];

const portfolio: PaperFoundationPortfolioView = {
  paperAccountId: 'pa-1',
  workspaceId: 'workspace-a',
  baseCurrency: 'USD',
  cashBalance: '50100',
  equity: '100600',
  realizedPnL: '0',
  unrealizedPnL: '600',
  totalPnL: '600',
  positions,
  honesty: 'paper only',
};

const pnl: PaperFoundationPnLView = {
  paperAccountId: 'pa-1',
  workspaceId: 'workspace-a',
  realizedPnL: '0',
  unrealizedPnL: '600',
  totalPnL: '600',
  honesty: 'paper only',
};

const history: PaperFoundationExecutionHistoryView = {
  entries: [
    {
      id: 'fill:f-1',
      kind: 'FILL',
      paperOrderId: 'o-1',
      paperFillId: 'f-1',
      exchange: 'BINANCE',
      symbol: 'BTC-USDT',
      side: 'BUY',
      quantity: '1',
      executionPrice: '49900',
      occurredAt: '2026-08-26T01:00:00.000Z',
    },
  ],
  honesty: 'local only',
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

describe('Paper Trading UI (W2-S04-d)', () => {
  it('renders Positions, Portfolio, PnL, and Execution History', () => {
    const html = renderToStaticMarkup(
      <PaperTradingView
        projection={active}
        orders={[pendingOrder]}
        fills={[fill]}
        positions={positions}
        portfolio={portfolio}
        pnl={pnl}
        history={history}
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
    expect(html).toContain('Paper Positions');
    expect(html).toContain('Paper Portfolio');
    expect(html).toContain('Paper PnL');
    expect(html).toContain('Execution History');
    expect(html).toContain('Realized PnL');
    expect(html).toContain('Unrealized PnL');
    expect(html).toContain('Paper PnL is simulated. It is not exchange profit.');
    expect(html).not.toMatch(/Exchange Positions/);
    expect(html).toContain('No Live Trading');
  });

  it('renders validation errors', () => {
    const html = renderToStaticMarkup(
      <PaperTradingView
        projection={active}
        orders={[]}
        fills={[]}
        positions={[]}
        portfolio={null}
        pnl={null}
        history={null}
        selectedOrderId={null}
        selectedFillId={null}
        orderForm={form}
        loading={false}
        saving={false}
        error="insufficient paper cash balance for fill"
        startingBalance="100000"
        {...baseHandlers}
      />,
    );
    expect(html).toContain('insufficient paper cash balance for fill');
  });
});

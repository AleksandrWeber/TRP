import { useEffect, useState } from 'react';
import { useWorkspace } from '../app/WorkspaceContext';
import {
  api,
  type PaperFillView,
  type PaperFoundationExecutionHistoryView,
  type PaperFoundationPnLView,
  type PaperFoundationPortfolioView,
  type PaperFoundationPositionView,
  type PaperOrderView,
  type PaperTradingAccountProjection,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { PaperTradingView, type PaperOrderFormState } from './PaperTradingView';

const defaultOrderForm: PaperOrderFormState = {
  exchange: 'BINANCE',
  symbol: '',
  side: 'BUY',
  orderType: 'LIMIT',
  quantity: '1',
  limitPrice: '',
  stopPrice: '',
};

export function PaperTradingFoundationPage() {
  const { activeWorkspace } = useWorkspace();
  const [projection, setProjection] = useState<PaperTradingAccountProjection | null>(null);
  const [orders, setOrders] = useState<PaperOrderView[]>([]);
  const [fills, setFills] = useState<PaperFillView[]>([]);
  const [positions, setPositions] = useState<PaperFoundationPositionView[]>([]);
  const [portfolio, setPortfolio] = useState<PaperFoundationPortfolioView | null>(null);
  const [pnl, setPnl] = useState<PaperFoundationPnLView | null>(null);
  const [history, setHistory] = useState<PaperFoundationExecutionHistoryView | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedFillId, setSelectedFillId] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState<PaperOrderFormState>(defaultOrderForm);
  const [startingBalance, setStartingBalance] = useState('100000');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPortfolioSlice() {
    const [positionList, portfolioView, pnlView, historyView] = await Promise.all([
      api.listPaperFoundationPositions().catch(() => ({
        positions: [] as PaperFoundationPositionView[],
      })),
      api.getPaperFoundationPortfolio().catch(() => null),
      api.getPaperFoundationPnL().catch(() => null),
      api.getPaperFoundationExecutionHistory().catch(() => null),
    ]);
    setPositions(positionList.positions);
    setPortfolio(portfolioView);
    setPnl(pnlView);
    setHistory(historyView);
  }

  async function load() {
    const [account, orderList, fillList] = await Promise.all([
      api.getPaperTradingAccount(),
      api.listPaperOrders().catch(() => ({ orders: [] as PaperOrderView[] })),
      api.listPaperFills().catch(() => ({ fills: [] as PaperFillView[] })),
    ]);
    setProjection(account);
    setOrders(orderList.orders);
    setFills(fillList.fills);
    if (account.status !== 'NOT_CREATED') {
      await loadPortfolioSlice();
    } else {
      setPositions([]);
      setPortfolio(null);
      setPnl(null);
      setHistory(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedOrderId(null);
    setSelectedFillId(null);
    load()
      .catch((reason: unknown) => {
        if (!cancelled) setError(toUserFacingError(reason, 'Could not load Paper Trading.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id]);

  async function createAccount() {
    setSaving(true);
    setError(null);
    try {
      const view = await api.createPaperTradingAccount({
        baseCurrency: 'USD',
        startingBalance: startingBalance.trim() || '100000',
      });
      setProjection(view);
      await loadPortfolioSlice();
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not create the Paper Account.'));
    } finally {
      setSaving(false);
    }
  }

  async function disableAccount() {
    setSaving(true);
    setError(null);
    try {
      const view = await api.disablePaperTradingAccount();
      setProjection(view);
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not disable the Paper Account.'));
    } finally {
      setSaving(false);
    }
  }

  async function activateAccount() {
    setSaving(true);
    setError(null);
    try {
      const view = await api.activatePaperTradingAccount();
      setProjection(view);
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not activate the Paper Account.'));
    } finally {
      setSaving(false);
    }
  }

  async function createOrder() {
    setSaving(true);
    setError(null);
    try {
      const needsLimit = orderForm.orderType === 'LIMIT' || orderForm.orderType === 'STOP_LIMIT';
      const needsStop = orderForm.orderType === 'STOP' || orderForm.orderType === 'STOP_LIMIT';
      const created = await api.createPaperOrder({
        paperAccountId: projection?.account?.id,
        exchange: orderForm.exchange,
        symbol: orderForm.symbol.trim(),
        side: orderForm.side,
        orderType: orderForm.orderType,
        quantity: orderForm.quantity.trim(),
        limitPrice: needsLimit ? orderForm.limitPrice.trim() : null,
        stopPrice: needsStop ? orderForm.stopPrice.trim() : null,
      });
      setOrders((items) => [...items, created]);
      setSelectedOrderId(created.id);
      setOrderForm((form) => ({
        ...form,
        symbol: '',
        quantity: '1',
        limitPrice: '',
        stopPrice: '',
      }));
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not create the Paper Order.'));
    } finally {
      setSaving(false);
    }
  }

  async function cancelOrder(orderId: string) {
    setSaving(true);
    setError(null);
    try {
      const cancelled = await api.cancelPaperOrder(orderId);
      setOrders((items) => items.map((item) => (item.id === cancelled.id ? cancelled : item)));
      setSelectedOrderId(cancelled.id);
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not cancel the Paper Order.'));
    } finally {
      setSaving(false);
    }
  }

  async function executeOrder(orderId: string) {
    setSaving(true);
    setError(null);
    try {
      const result = await api.executePaperOrder(orderId);
      setOrders((items) =>
        items.map((item) =>
          item.id === result.orderId ? { ...item, status: result.status } : item,
        ),
      );
      setFills((items) => [result.fill, ...items.filter((fill) => fill.id !== result.fill.id)]);
      setSelectedOrderId(result.orderId);
      setSelectedFillId(result.fill.id);
      const account = await api.getPaperTradingAccount();
      setProjection(account);
      await loadPortfolioSlice();
    } catch (reason) {
      setError(toUserFacingError(reason, 'Could not execute Paper Order matching.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PaperTradingView
      projection={projection}
      orders={orders}
      fills={fills}
      positions={positions}
      portfolio={portfolio}
      pnl={pnl}
      history={history}
      selectedOrderId={selectedOrderId}
      selectedFillId={selectedFillId}
      orderForm={orderForm}
      loading={loading}
      saving={saving}
      error={error}
      startingBalance={startingBalance}
      onStartingBalanceChange={setStartingBalance}
      onCreateAccount={() => {
        void createAccount();
      }}
      onDisableAccount={() => {
        void disableAccount();
      }}
      onActivateAccount={() => {
        void activateAccount();
      }}
      onOrderFormChange={(patch) => setOrderForm((form) => ({ ...form, ...patch }))}
      onCreateOrder={() => {
        void createOrder();
      }}
      onSelectOrder={setSelectedOrderId}
      onCancelOrder={(orderId) => {
        void cancelOrder(orderId);
      }}
      onExecuteOrder={(orderId) => {
        void executeOrder(orderId);
      }}
      onSelectFill={setSelectedFillId}
    />
  );
}

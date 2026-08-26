import type {
  PaperFillView,
  PaperFoundationExecutionHistoryView,
  PaperFoundationPnLView,
  PaperFoundationPortfolioView,
  PaperFoundationPositionView,
  PaperOrderView,
  PaperTradingAccountProjection,
  PaperTradingAccountView,
} from '../shared/api';

export const PAPER_ORDER_TYPES = ['LIMIT', 'MARKET', 'STOP', 'STOP_LIMIT'] as const;
export const PAPER_ORDER_SIDES = ['BUY', 'SELL'] as const;
export const PAPER_EXCHANGES = ['BINANCE', 'BYBIT', 'OKX'] as const;

export type PaperOrderFormState = {
  exchange: string;
  symbol: string;
  side: string;
  orderType: string;
  quantity: string;
  limitPrice: string;
  stopPrice: string;
};

export type PaperTradingViewProps = {
  projection: PaperTradingAccountProjection | null;
  orders: PaperOrderView[];
  fills: PaperFillView[];
  positions: PaperFoundationPositionView[];
  portfolio: PaperFoundationPortfolioView | null;
  pnl: PaperFoundationPnLView | null;
  history: PaperFoundationExecutionHistoryView | null;
  selectedOrderId: string | null;
  selectedFillId: string | null;
  orderForm: PaperOrderFormState;
  loading: boolean;
  saving: boolean;
  error: string | null;
  startingBalance: string;
  onStartingBalanceChange: (value: string) => void;
  onCreateAccount: () => void;
  onDisableAccount: () => void;
  onActivateAccount: () => void;
  onOrderFormChange: (patch: Partial<PaperOrderFormState>) => void;
  onCreateOrder: () => void;
  onSelectOrder: (orderId: string | null) => void;
  onCancelOrder: (orderId: string) => void;
  onExecuteOrder: (orderId: string) => void;
  onSelectFill: (fillId: string | null) => void;
};

function statusLabel(status: string): string {
  if (status === 'NOT_CREATED') return 'Not Created';
  if (status === 'ACTIVE') return 'Active';
  if (status === 'DISABLED') return 'Disabled';
  return status;
}

function orderStatusLabel(status: string): string {
  if (status === 'DRAFT') return 'Draft';
  if (status === 'PENDING') return 'Pending';
  if (status === 'CANCELLED') return 'Cancelled';
  if (status === 'REJECTED') return 'Rejected';
  if (status === 'FILLED') return 'Filled';
  return status;
}

function AccountFields({ account }: { account: PaperTradingAccountView }) {
  return (
    <dl className="paper-trading-fields">
      <div>
        <dt>Status</dt>
        <dd data-testid="paper-account-status">{statusLabel(account.status)}</dd>
      </div>
      <div>
        <dt>Currency</dt>
        <dd data-testid="paper-account-currency">{account.baseCurrency}</dd>
      </div>
      <div>
        <dt>Starting Balance</dt>
        <dd data-testid="paper-account-starting-balance">{account.startingBalance}</dd>
      </div>
      <div>
        <dt>Current Balance</dt>
        <dd data-testid="paper-account-current-balance">{account.currentBalance}</dd>
      </div>
      <div>
        <dt>Owner</dt>
        <dd data-testid="paper-account-owner">{account.ownerId}</dd>
      </div>
    </dl>
  );
}

/**
 * Paper Trading Foundation UI (W2-S04-a/b/c/d).
 * Account + Orders + Fills + Positions / Portfolio / PnL / History.
 * Paper projections only — not exchange inventory or Live Trading.
 */
export function PaperTradingView({
  projection,
  orders,
  fills,
  positions,
  portfolio,
  pnl,
  history,
  selectedOrderId,
  selectedFillId,
  orderForm,
  loading,
  saving,
  error,
  startingBalance,
  onStartingBalanceChange,
  onCreateAccount,
  onDisableAccount,
  onActivateAccount,
  onOrderFormChange,
  onCreateOrder,
  onSelectOrder,
  onCancelOrder,
  onExecuteOrder,
  onSelectFill,
}: PaperTradingViewProps) {
  const selected = orders.find((order) => order.id === selectedOrderId) ?? null;
  const selectedFill = fills.find((fill) => fill.id === selectedFillId) ?? null;
  const needsLimit = orderForm.orderType === 'LIMIT' || orderForm.orderType === 'STOP_LIMIT';
  const needsStop = orderForm.orderType === 'STOP' || orderForm.orderType === 'STOP_LIMIT';

  return (
    <section className="paper-trading-page" aria-labelledby="paper-trading-title">
      <header>
        <h1 id="paper-trading-title">Paper Trading</h1>
        <p>
          Create Paper Orders, execute local matching against Market Data, and observe paper
          Positions, Portfolio, Balance, PnL, and Execution History. Simulated only — not exchange
          assets and not Live Trading.
        </p>
      </header>

      {error ? (
        <p role="alert" className="error" data-testid="paper-trading-error">
          {error}
        </p>
      ) : null}

      {loading || !projection ? (
        <p>Loading Paper Trading…</p>
      ) : projection.status === 'NOT_CREATED' ? (
        <div className="paper-trading-create">
          <p data-testid="paper-account-status">Status: Not Created</p>
          <label>
            Starting Balance (USD)
            <input
              type="text"
              value={startingBalance}
              onChange={(event) => onStartingBalanceChange(event.target.value)}
              disabled={saving}
              aria-label="Starting Balance"
            />
          </label>
          <button type="button" onClick={onCreateAccount} disabled={saving}>
            Create Paper Account
          </button>
        </div>
      ) : projection.account ? (
        <>
          <div className="paper-trading-account">
            <h2>Paper Account</h2>
            <AccountFields account={projection.account} />
            {projection.status === 'ACTIVE' ? (
              <button type="button" onClick={onDisableAccount} disabled={saving}>
                Disable Paper Account
              </button>
            ) : (
              <button type="button" onClick={onActivateAccount} disabled={saving}>
                Activate Paper Account
              </button>
            )}
          </div>

          {projection.status === 'ACTIVE' ? (
            <>
              <div className="paper-trading-orders">
                <h2>Paper Orders</h2>
                <form
                  className="paper-order-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    onCreateOrder();
                  }}
                >
                  <label>
                    Exchange
                    <select
                      aria-label="Exchange"
                      value={orderForm.exchange}
                      onChange={(event) => onOrderFormChange({ exchange: event.target.value })}
                      disabled={saving}
                    >
                      {PAPER_EXCHANGES.map((exchange) => (
                        <option key={exchange} value={exchange}>
                          {exchange}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Symbol
                    <input
                      type="text"
                      aria-label="Symbol"
                      value={orderForm.symbol}
                      onChange={(event) => onOrderFormChange({ symbol: event.target.value })}
                      disabled={saving}
                      placeholder="BTC-USDT"
                    />
                  </label>
                  <label>
                    Side
                    <select
                      aria-label="Side"
                      value={orderForm.side}
                      onChange={(event) => onOrderFormChange({ side: event.target.value })}
                      disabled={saving}
                    >
                      {PAPER_ORDER_SIDES.map((side) => (
                        <option key={side} value={side}>
                          {side}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Order Type
                    <select
                      aria-label="Order Type"
                      value={orderForm.orderType}
                      onChange={(event) => onOrderFormChange({ orderType: event.target.value })}
                      disabled={saving}
                    >
                      {PAPER_ORDER_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Quantity
                    <input
                      type="text"
                      aria-label="Quantity"
                      value={orderForm.quantity}
                      onChange={(event) => onOrderFormChange({ quantity: event.target.value })}
                      disabled={saving}
                    />
                  </label>
                  {needsLimit ? (
                    <label>
                      Limit Price
                      <input
                        type="text"
                        aria-label="Limit Price"
                        value={orderForm.limitPrice}
                        onChange={(event) => onOrderFormChange({ limitPrice: event.target.value })}
                        disabled={saving}
                      />
                    </label>
                  ) : null}
                  {needsStop ? (
                    <label>
                      Stop Price
                      <input
                        type="text"
                        aria-label="Stop Price"
                        value={orderForm.stopPrice}
                        onChange={(event) => onOrderFormChange({ stopPrice: event.target.value })}
                        disabled={saving}
                      />
                    </label>
                  ) : null}
                  <button type="submit" disabled={saving}>
                    Create Order
                  </button>
                </form>

                <div className="paper-order-list" data-testid="paper-order-list">
                  <h3>Order List</h3>
                  {orders.length === 0 ? (
                    <p>No Paper Orders yet.</p>
                  ) : (
                    <ul>
                      {orders.map((order) => (
                        <li key={order.id}>
                          <button type="button" onClick={() => onSelectOrder(order.id)}>
                            {order.side} {order.quantity} {order.symbol} (
                            {orderStatusLabel(order.status)})
                          </button>
                          {order.status === 'PENDING' ? (
                            <button
                              type="button"
                              onClick={() => onExecuteOrder(order.id)}
                              disabled={saving}
                            >
                              Execute Matching
                            </button>
                          ) : null}
                          {order.status === 'DRAFT' || order.status === 'PENDING' ? (
                            <button
                              type="button"
                              onClick={() => onCancelOrder(order.id)}
                              disabled={saving}
                            >
                              Cancel Order
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {selected ? (
                  <div className="paper-order-review" data-testid="paper-order-review">
                    <h3>Review Order</h3>
                    <dl>
                      <div>
                        <dt>Status</dt>
                        <dd>{orderStatusLabel(selected.status)}</dd>
                      </div>
                      <div>
                        <dt>Exchange</dt>
                        <dd>{selected.exchange}</dd>
                      </div>
                      <div>
                        <dt>Symbol</dt>
                        <dd>{selected.symbol}</dd>
                      </div>
                      <div>
                        <dt>Side</dt>
                        <dd>{selected.side}</dd>
                      </div>
                      <div>
                        <dt>Type</dt>
                        <dd>{selected.orderType}</dd>
                      </div>
                      <div>
                        <dt>Quantity</dt>
                        <dd>{selected.quantity}</dd>
                      </div>
                    </dl>
                    <p>
                      Filled means a local Paper Fill from Market Data. Not exchange acceptance.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="paper-trading-fills" data-testid="paper-fill-list">
                <h2>Paper Fills</h2>
                {fills.length === 0 ? (
                  <p>No Paper Fills yet.</p>
                ) : (
                  <ul>
                    {fills.map((fill) => (
                      <li key={fill.id}>
                        <button type="button" onClick={() => onSelectFill(fill.id)}>
                          {fill.side} {fill.quantity} {fill.symbol} @ {fill.executionPrice}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedFill ? (
                  <div className="paper-fill-review" data-testid="paper-fill-review">
                    <h3>View Paper Fill</h3>
                    <dl>
                      <div>
                        <dt>Fill Id</dt>
                        <dd>{selectedFill.id}</dd>
                      </div>
                      <div>
                        <dt>Order Id</dt>
                        <dd>{selectedFill.paperOrderId}</dd>
                      </div>
                      <div>
                        <dt>Exchange</dt>
                        <dd>{selectedFill.exchange}</dd>
                      </div>
                      <div>
                        <dt>Symbol</dt>
                        <dd>{selectedFill.symbol}</dd>
                      </div>
                      <div>
                        <dt>Side</dt>
                        <dd>{selectedFill.side}</dd>
                      </div>
                      <div>
                        <dt>Quantity</dt>
                        <dd>{selectedFill.quantity}</dd>
                      </div>
                      <div>
                        <dt>Execution Price</dt>
                        <dd>{selectedFill.executionPrice}</dd>
                      </div>
                      <div>
                        <dt>Execution Time</dt>
                        <dd>{selectedFill.executionTime}</dd>
                      </div>
                    </dl>
                    <p>Local simulated execution based on Market Data. No exchange APIs.</p>
                  </div>
                ) : null}
              </div>

              <div className="paper-trading-positions" data-testid="paper-position-list">
                <h2>Paper Positions</h2>
                {positions.length === 0 ? (
                  <p>No open Paper Positions.</p>
                ) : (
                  <ul>
                    {positions.map((position) => (
                      <li key={`${position.exchange}-${position.symbol}`}>
                        {position.side} {position.quantity} {position.symbol} @{' '}
                        {position.averageEntryPrice}
                        {position.unrealizedPnL !== null
                          ? ` (unrealized ${position.unrealizedPnL})`
                          : ' (mark unavailable)'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="paper-trading-portfolio" data-testid="paper-portfolio">
                <h2>Paper Portfolio</h2>
                {portfolio ? (
                  <dl>
                    <div>
                      <dt>Paper Balance (Cash)</dt>
                      <dd data-testid="paper-cash-balance">{portfolio.cashBalance}</dd>
                    </div>
                    <div>
                      <dt>Equity</dt>
                      <dd>{portfolio.equity ?? 'Unavailable (mark missing)'}</dd>
                    </div>
                    <div>
                      <dt>Total PnL</dt>
                      <dd>{portfolio.totalPnL ?? 'Unavailable (mark missing)'}</dd>
                    </div>
                  </dl>
                ) : (
                  <p>Portfolio not available.</p>
                )}
              </div>

              <div className="paper-trading-pnl" data-testid="paper-pnl">
                <h2>Paper PnL</h2>
                {pnl ? (
                  <dl>
                    <div>
                      <dt>Realized PnL</dt>
                      <dd data-testid="paper-realized-pnl">{pnl.realizedPnL}</dd>
                    </div>
                    <div>
                      <dt>Unrealized PnL</dt>
                      <dd data-testid="paper-unrealized-pnl">
                        {pnl.unrealizedPnL ?? 'Unavailable (mark missing)'}
                      </dd>
                    </div>
                    <div>
                      <dt>Total PnL</dt>
                      <dd>{pnl.totalPnL ?? 'Unavailable (mark missing)'}</dd>
                    </div>
                  </dl>
                ) : (
                  <p>PnL not available.</p>
                )}
                <p>Paper PnL is simulated. It is not exchange profit.</p>
              </div>

              <div className="paper-trading-history" data-testid="paper-execution-history">
                <h2>Execution History</h2>
                {!history || history.entries.length === 0 ? (
                  <p>No Paper Execution History yet.</p>
                ) : (
                  <ul>
                    {history.entries.map((entry) => (
                      <li key={entry.id}>
                        {entry.side} {entry.quantity} {entry.symbol} @ {entry.executionPrice} (
                        {entry.occurredAt})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </>
      ) : null}

      <aside className="paper-trading-honesty" aria-label="Paper Trading honesty">
        <p>
          Paper Positions, Portfolio, Balance, and PnL are simulated projections only. No exchange
          positions. No exchange balances. No exchange PnL. No Ledger. No Live Trading.
        </p>
      </aside>
    </section>
  );
}

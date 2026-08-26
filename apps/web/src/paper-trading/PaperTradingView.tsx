import type { PaperTradingAccountProjection, PaperTradingAccountView } from '../shared/api';

export type PaperTradingViewProps = {
  projection: PaperTradingAccountProjection | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  startingBalance: string;
  onStartingBalanceChange: (value: string) => void;
  onCreate: () => void;
  onDisable: () => void;
  onActivate: () => void;
};

function statusLabel(status: string): string {
  if (status === 'NOT_CREATED') return 'Not Created';
  if (status === 'ACTIVE') return 'Active';
  if (status === 'DISABLED') return 'Disabled';
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
      <div>
        <dt>Created</dt>
        <dd>{account.createdAt}</dd>
      </div>
      <div>
        <dt>Updated</dt>
        <dd>{account.updatedAt}</dd>
      </div>
    </dl>
  );
}

/**
 * Paper Trading Foundation UI (W2-S04-a).
 * Paper Account only — no orders, positions, portfolio, PnL, or trading controls.
 */
export function PaperTradingView({
  projection,
  loading,
  saving,
  error,
  startingBalance,
  onStartingBalanceChange,
  onCreate,
  onDisable,
  onActivate,
}: PaperTradingViewProps) {
  return (
    <section className="paper-trading-page" aria-labelledby="paper-trading-title">
      <header>
        <h1 id="paper-trading-title">Paper Trading</h1>
        <p>
          Create and view a workspace Paper Account. Paper balances are simulated and never
          represent real money. This foundation does not place orders or enable Live Trading.
        </p>
      </header>

      {error ? (
        <p role="alert" className="error">
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
          <button type="button" onClick={onCreate} disabled={saving}>
            Create Paper Account
          </button>
        </div>
      ) : projection.account ? (
        <div className="paper-trading-account">
          <h2>Paper Account</h2>
          <AccountFields account={projection.account} />
          {projection.status === 'ACTIVE' ? (
            <button type="button" onClick={onDisable} disabled={saving}>
              Disable Paper Account
            </button>
          ) : (
            <button type="button" onClick={onActivate} disabled={saving}>
              Activate Paper Account
            </button>
          )}
        </div>
      ) : null}

      <aside className="paper-trading-honesty" aria-label="Paper Trading honesty">
        <p>No orders. No positions. No portfolio. No PnL. No Live Trading.</p>
      </aside>
    </section>
  );
}

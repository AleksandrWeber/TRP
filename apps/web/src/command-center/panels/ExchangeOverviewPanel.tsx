import type { ExchangeScopeOverviewView, ExchangeStatusView } from '../../shared/api';
import { OpsPanelFrame } from '../components/OpsPanelFrame';
import type { OpsPanelProps } from '../types';

type Props = OpsPanelProps & {
  exchangeScope?: ExchangeScopeOverviewView | null;
  exchangeStatus?: ExchangeStatusView | null;
};

export function ExchangeOverviewPanel({
  presentation = 'placeholder',
  errorMessage,
  exchangeScope = null,
  exchangeStatus = null,
}: Props) {
  const matchingExchange = exchangeStatus?.exchanges.find(
    (exchange) =>
      exchange.exchangeId.toLowerCase() === (exchangeScope?.exchangeCode ?? '').toLowerCase() ||
      exchange.exchangeId.toLowerCase().includes('binance'),
  );
  const connectionStatus =
    matchingExchange?.connection?.status ??
    (exchangeStatus
      ? `${exchangeStatus.connectedCount}/${exchangeStatus.totalCount} connected`
      : null);

  return (
    <OpsPanelFrame
      panelId="P2"
      title="Exchange Overview"
      presentation={presentation}
      placeholderMessage="Exchange Scope overview is not connected yet."
      emptyTitle="Scope unavailable"
      emptyDescription="Default Exchange Scope identity will appear here after read projections are wired."
      errorMessage={errorMessage}
      skeletonRows={3}
    >
      {exchangeScope ? (
        <div className="space-y-2 text-sm" data-testid="cc-p2-content">
          <p className="text-base font-medium text-slate-100">{exchangeScope.label}</p>
          <p className="text-xs text-slate-500" data-testid="cc-p2-scope-id">
            {exchangeScope.id}
          </p>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Operational status</dt>
              <dd className="mt-1 text-slate-200" data-testid="cc-p2-status">
                {connectionStatus ?? 'Status unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Session count</dt>
              <dd className="mt-1 text-slate-200" data-testid="cc-p2-session-count">
                {exchangeScope.sessionCount}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </OpsPanelFrame>
  );
}

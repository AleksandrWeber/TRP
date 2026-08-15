import { Link } from 'react-router-dom';
import type { NotificationDeliveryListItemView } from '../shared/api';
import { formatUtc } from '../shared/formatUtc';
import {
  DELIVERY_OUTCOME_FILTERS,
  NOTIFICATION_TYPE_FILTERS,
  deliveryOutcomeLabel,
  notificationTypeLabel,
  skipReasonLabel,
  type DeliveryOutcomeFilter,
  type NotificationTypeFilter,
} from './notifications';

export function NotificationHistoryView({
  items,
  search,
  outcome,
  type,
  loading,
  error,
  onSearch,
  onOutcome,
  onType,
}: {
  items: NotificationDeliveryListItemView[];
  search: string;
  outcome: DeliveryOutcomeFilter;
  type: NotificationTypeFilter;
  loading: boolean;
  error: string | null;
  onSearch: (value: string) => void;
  onOutcome: (value: DeliveryOutcomeFilter) => void;
  onType: (value: NotificationTypeFilter) => void;
}) {
  return (
    <section className="space-y-6" data-testid="notification-history">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Notifications</p>
        <h2 className="mt-1 text-2xl font-semibold">Delivery history</h2>
        <p className="mt-2 text-slate-400">
          Existing recorded deliveries for this workspace, newest first. History is not a second
          delivery owner and does not send or retry.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/notifications" className="text-sky-400 hover:text-sky-300">
          Notification settings
        </Link>
        <Link to="/notifications/channels" className="text-sky-400 hover:text-sky-300">
          Notification channels
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Search</span>
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Id, type, skip reason"
            data-testid="notification-history-search"
            className="w-full min-w-[16rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Outcome</span>
          <select
            value={outcome}
            data-testid="notification-filter-outcome"
            onChange={(event) => onOutcome(event.target.value as DeliveryOutcomeFilter)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          >
            {DELIVERY_OUTCOME_FILTERS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Type</span>
          <select
            value={type}
            data-testid="notification-filter-type"
            onChange={(event) => onType(event.target.value as NotificationTypeFilter)}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          >
            {NOTIFICATION_TYPE_FILTERS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading delivery history…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-slate-500" data-testid="notification-history-empty">
          No recorded deliveries in this workspace.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.deliveryId}>
            <Link
              to={`/notifications/${item.deliveryId}`}
              data-testid="notification-history-link"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-white/20"
            >
              <span>
                {notificationTypeLabel(item.type)}{' '}
                <span className="text-slate-500">{item.deliveryId}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs">
                  {deliveryOutcomeLabel(item.outcome)}
                </span>
                <span className="text-xs text-slate-500">
                  {item.skipReasons.map(skipReasonLabel).join(', ') || '—'}
                </span>
                <span className="text-xs text-slate-500">{formatUtc(item.createdAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

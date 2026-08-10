import type { TradingSessionBotView } from '../../shared/api';
import { OpsPanelFrame } from '../components/OpsPanelFrame';
import { fleetEmptyCopy, type FleetEmptyReason } from '../fleet-navigation';
import type { OpsPanelProps } from '../types';

type Props = OpsPanelProps & {
  bots?: readonly TradingSessionBotView[];
  selectedIds?: readonly string[];
  focusedId?: string | null;
  emptyReason?: FleetEmptyReason;
  onSelect?: (id: string) => void;
  onToggleSelect?: (id: string) => void;
};

export function BotOverviewPanel({
  presentation = 'placeholder',
  errorMessage,
  bots = [],
  selectedIds = [],
  focusedId = null,
  emptyReason = 'no-sessions',
  onSelect,
  onToggleSelect,
}: Props) {
  const empty = fleetEmptyCopy(emptyReason, 'bots');

  return (
    <OpsPanelFrame
      panelId="P3"
      title="Bot Overview"
      presentation={presentation}
      placeholderMessage="Bot fleet list is not connected yet."
      emptyTitle={empty.title}
      emptyDescription={empty.description}
      errorMessage={errorMessage}
      skeletonRows={4}
    >
      <ul className="space-y-2" data-testid="cc-p3-content">
        {bots.map((bot) => {
          const selected = selectedIds.includes(bot.id);
          const focused = bot.id === focusedId;
          return (
            <li key={bot.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect?.(bot.id)}
                className="mt-3 h-4 w-4 accent-sky-500"
                data-testid={`cc-bot-check-${bot.id}`}
                aria-label={`Select bot ${bot.id}`}
              />
              <button
                type="button"
                onClick={() => onSelect?.(bot.id)}
                className={`min-w-0 flex-1 rounded border px-3 py-2 text-left text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 ${
                  focused
                    ? 'border-sky-500/40 bg-sky-500/10'
                    : selected
                      ? 'border-sky-500/20 bg-sky-500/5'
                      : 'border-white/10 bg-transparent hover:bg-white/[0.03]'
                }`}
                data-testid={`cc-bot-row-${bot.id}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-100">{bot.id}</span>
                  <span className="rounded border border-white/15 px-2 py-0.5 text-xs uppercase text-slate-300">
                    {bot.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Scope {bot.exchangeScopeId} · paper account {bot.paperAccountId}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </OpsPanelFrame>
  );
}

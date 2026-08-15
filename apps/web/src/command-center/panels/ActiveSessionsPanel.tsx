import type { TradingSessionBotView } from '../../shared/api';
import { OpsPanelFrame } from '../components/OpsPanelFrame';
import { fleetEmptyCopy, type FleetEmptyReason } from '../fleet-navigation';
import { sessionActionAvailability, type SessionLifecycleAction } from '../session-commands';
import type { OpsPanelProps } from '../types';

type Props = OpsPanelProps & {
  sessions?: readonly TradingSessionBotView[];
  selectedIds?: readonly string[];
  focusedId?: string | null;
  emptyReason?: FleetEmptyReason;
  onSelect?: (id: string) => void;
  onToggleSelect?: (id: string) => void;
  onRequestAction?: (action: SessionLifecycleAction, sessionId: string) => void;
  commandsDisabled?: boolean;
};

export function ActiveSessionsPanel({
  presentation = 'placeholder',
  errorMessage,
  sessions = [],
  selectedIds = [],
  focusedId = null,
  emptyReason = 'no-sessions',
  onSelect,
  onToggleSelect,
  onRequestAction,
  commandsDisabled = false,
}: Props) {
  const empty = fleetEmptyCopy(emptyReason, 'sessions');

  return (
    <OpsPanelFrame
      panelId="P4"
      title="Active Sessions"
      presentation={presentation}
      placeholderMessage="Active session list is not connected yet."
      emptyTitle={empty.title}
      emptyDescription={empty.description}
      errorMessage={errorMessage}
      skeletonRows={4}
    >
      <ul className="space-y-2" data-testid="cc-p4-content">
        {sessions.map((session) => {
          const selected = selectedIds.includes(session.id);
          const focused = session.id === focusedId;
          const availability = sessionActionAvailability(session);
          return (
            <li key={session.id} className="space-y-2">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleSelect?.(session.id)}
                  className="mt-3 h-4 w-4 accent-sky-500"
                  data-testid={`cc-session-check-${session.id}`}
                  aria-label={`Select session ${session.id}`}
                />
                <button
                  type="button"
                  onClick={() => onSelect?.(session.id)}
                  className={`min-w-0 flex-1 rounded border px-3 py-2 text-left text-sm focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400 ${
                    focused
                      ? 'border-sky-500/40 bg-sky-500/10'
                      : selected
                        ? 'border-sky-500/20 bg-sky-500/5'
                        : 'border-white/10 bg-transparent hover:bg-white/[0.03]'
                  }`}
                  data-testid={`cc-session-row-${session.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-100">{session.id}</span>
                    <span className="rounded border border-white/15 px-2 py-0.5 text-xs uppercase text-slate-300">
                      {session.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {session.exchangeScopeId} · lease {session.leaseOwnerId ?? 'none'}
                  </p>
                </button>
              </div>
              <div className="flex flex-wrap gap-2 px-7">
                <ActionButton
                  label="Start"
                  testId={`cc-start-${session.id}`}
                  disabled={commandsDisabled || availability.start !== 'available'}
                  onClick={() => onRequestAction?.('start', session.id)}
                />
                <ActionButton
                  label="Pause"
                  testId={`cc-pause-${session.id}`}
                  disabled={commandsDisabled || availability.pause !== 'available'}
                  onClick={() => onRequestAction?.('pause', session.id)}
                />
                <ActionButton
                  label="Resume"
                  testId={`cc-resume-${session.id}`}
                  disabled={commandsDisabled || availability.resume !== 'available'}
                  onClick={() => onRequestAction?.('resume', session.id)}
                />
                <ActionButton
                  label="Stop"
                  testId={`cc-stop-${session.id}`}
                  danger
                  disabled={commandsDisabled || availability.stop !== 'available'}
                  onClick={() => onRequestAction?.('stop', session.id)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </OpsPanelFrame>
  );
}

function ActionButton({
  label,
  testId,
  onClick,
  disabled,
  danger = false,
}: {
  label: string;
  testId: string;
  onClick: () => void;
  disabled: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`rounded border px-2 py-1 text-xs focus:outline focus:outline-2 focus:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'border-red-500/40 text-red-200 hover:bg-red-500/10 focus:outline-red-400'
          : 'border-white/15 text-slate-300 hover:bg-white/5 focus:outline-sky-400'
      }`}
    >
      {label}
    </button>
  );
}

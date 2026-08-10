import type { PaperSessionView } from '../../shared/api';
import { OpsPanelFrame } from '../components/OpsPanelFrame';
import type { OpsPanelProps } from '../types';

type Props = OpsPanelProps & {
  sessions?: readonly PaperSessionView[];
};

export function RunningPaperTradingPanel({
  presentation = 'placeholder',
  errorMessage,
  sessions = [],
}: Props) {
  return (
    <OpsPanelFrame
      panelId="P5"
      title="Running Paper Trading"
      presentation={presentation}
      placeholderMessage="Paper trading activity summary is not connected yet."
      emptyTitle="No running paper trading sessions"
      emptyDescription="Canonical path · paper adapter. Paper-labeled activity will appear here once projections are wired."
      errorMessage={errorMessage}
      skeletonRows={3}
    >
      <div className="space-y-3" data-testid="cc-p5-content">
        <p className="text-xs text-slate-500">Canonical path · paper adapter</p>
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="rounded border border-white/10 px-3 py-2 text-sm"
              data-testid={`cc-paper-row-${session.id}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-slate-100">{session.name}</span>
                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
                  {session.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{session.id}</p>
            </li>
          ))}
        </ul>
      </div>
    </OpsPanelFrame>
  );
}

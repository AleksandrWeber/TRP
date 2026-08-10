import type { RuntimeHealthView, TradingSessionBotView } from '../../shared/api';
import { OpsPanelFrame } from '../components/OpsPanelFrame';
import { countSessionsByStatus } from '../load-projections';
import type { OpsPanelProps } from '../types';

type Props = OpsPanelProps & {
  health?: RuntimeHealthView | null;
  bots?: readonly TradingSessionBotView[];
  paperEngineStatus?: string | null;
};

export function GlobalSystemStatusPanel({
  presentation = 'placeholder',
  errorMessage,
  health = null,
  bots = [],
  paperEngineStatus = null,
}: Props) {
  const counts = countSessionsByStatus(bots);

  return (
    <OpsPanelFrame
      panelId="P1"
      title="Global System Status"
      presentation={presentation}
      placeholderMessage="System status projections are not connected yet."
      emptyTitle="No sessions"
      emptyDescription="Mode and backend status still appear when health is available. Counts at zero means no sessions."
      errorMessage={errorMessage}
      skeletonRows={2}
    >
      {health ? (
        <div className="space-y-3" data-testid="cc-p1-content">
          <div className="flex flex-wrap gap-2">
            <Badge label={`App ${health.status}`} tone={health.status === 'ok' ? 'ok' : 'warn'} />
            <Badge label={`API ${health.api}`} tone={health.api === 'up' ? 'ok' : 'bad'} />
            <Badge
              label={`Database ${health.database}`}
              tone={health.database === 'up' ? 'ok' : 'bad'}
            />
            <Badge label="Paper (Freeze)" tone="info" />
            {paperEngineStatus ? (
              <Badge
                label={`Paper engine ${paperEngineStatus}`}
                tone={paperEngineStatus === 'available' ? 'ok' : 'warn'}
              />
            ) : null}
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Active / non-paused" value={String(counts.active)} />
            <Stat label="Paused" value={String(counts.paused)} />
            <Stat label="Recovering" value={String(counts.recovering)} />
            <Stat label="Stopped" value={String(counts.stopped + counts.failed)} />
          </dl>
          <p className="text-xs text-slate-500" data-testid="cc-p1-version">
            Version {health.version} · {health.environment} · uptime {Math.floor(health.uptime)}s ·
            checked {health.timestamp}
          </p>
        </div>
      ) : null}
    </OpsPanelFrame>
  );
}

function Badge({ label, tone }: { label: string; tone: 'ok' | 'warn' | 'bad' | 'info' }) {
  const toneClass =
    tone === 'ok'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : tone === 'warn'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
        : tone === 'bad'
          ? 'border-red-500/30 bg-red-500/10 text-red-200'
          : 'border-sky-500/30 bg-sky-500/10 text-sky-200';
  return <span className={`rounded border px-2 py-1 text-xs ${toneClass}`}>{label}</span>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 px-3 py-2">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-base font-medium text-slate-100">{value}</dd>
    </div>
  );
}

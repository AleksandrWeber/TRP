import type {
  ExchangeScopeOverviewView,
  ExchangeStatusView,
  PaperSessionView,
  RuntimeHealthView,
  TradingSessionBotView,
} from '../shared/api';

export type CommandCenterProjections = {
  health: RuntimeHealthView | null;
  bots: TradingSessionBotView[];
  paperSessions: PaperSessionView[];
  exchangeStatus: ExchangeStatusView | null;
  exchangeScope: ExchangeScopeOverviewView | null;
};

export type CommandCenterProjectionErrors = {
  health: string | null;
  bots: string | null;
  paperSessions: string | null;
  exchangeStatus: string | null;
  exchangeScope: string | null;
};

export type CommandCenterReadApi = {
  getRuntimeHealth: () => Promise<RuntimeHealthView>;
  listTradingSessions: () => Promise<TradingSessionBotView[]>;
  listPaperSessions: () => Promise<PaperSessionView[]>;
  getExchangeStatus: () => Promise<ExchangeStatusView>;
  getDefaultExchangeScope: () => Promise<ExchangeScopeOverviewView>;
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * Loads Command Center projections from existing read APIs only.
 * Never issues mutations. Partial failures leave other panels usable.
 */
export async function loadCommandCenterProjections(
  api: CommandCenterReadApi,
): Promise<{ data: CommandCenterProjections; errors: CommandCenterProjectionErrors }> {
  const [health, bots, paperSessions, exchangeStatus, exchangeScope] = await Promise.all([
    api.getRuntimeHealth().then(
      (value) => ({ value, error: null as string | null }),
      (err: unknown) => ({ value: null, error: errorMessage(err, 'Health unavailable') }),
    ),
    api.listTradingSessions().then(
      (value) => ({ value, error: null as string | null }),
      (err: unknown) => ({
        value: [] as TradingSessionBotView[],
        error: errorMessage(err, 'Trading sessions unavailable'),
      }),
    ),
    api.listPaperSessions().then(
      (value) => ({ value, error: null as string | null }),
      (err: unknown) => ({
        value: [] as PaperSessionView[],
        error: errorMessage(err, 'Paper sessions unavailable'),
      }),
    ),
    api.getExchangeStatus().then(
      (value) => ({ value, error: null as string | null }),
      (err: unknown) => ({
        value: null,
        error: errorMessage(err, 'Exchange status unavailable'),
      }),
    ),
    api.getDefaultExchangeScope().then(
      (value) => ({ value, error: null as string | null }),
      (err: unknown) => ({
        value: null,
        error: errorMessage(err, 'Exchange scope unavailable'),
      }),
    ),
  ]);

  return {
    data: {
      health: health.value,
      bots: bots.value,
      paperSessions: paperSessions.value,
      exchangeStatus: exchangeStatus.value,
      exchangeScope: exchangeScope.value,
    },
    errors: {
      health: health.error,
      bots: bots.error,
      paperSessions: paperSessions.error,
      exchangeStatus: exchangeStatus.error,
      exchangeScope: exchangeScope.error,
    },
  };
}

export function countSessionsByStatus(bots: readonly TradingSessionBotView[]) {
  const counts = {
    active: 0,
    paused: 0,
    recovering: 0,
    stopped: 0,
    failed: 0,
    other: 0,
  };

  for (const bot of bots) {
    const status = bot.status.toLowerCase();
    if (status === 'paused') counts.paused += 1;
    else if (status === 'recovering') counts.recovering += 1;
    else if (status === 'stopped') counts.stopped += 1;
    else if (status === 'failed') counts.failed += 1;
    else if (
      status === 'created' ||
      status === 'starting' ||
      status === 'running' ||
      status === 'stopping'
    ) {
      counts.active += 1;
    } else {
      counts.other += 1;
    }
  }

  return counts;
}

export function isActiveSession(status: string): boolean {
  const normalized = status.toLowerCase();
  return (
    normalized === 'created' ||
    normalized === 'starting' ||
    normalized === 'running' ||
    normalized === 'paused' ||
    normalized === 'stopping' ||
    normalized === 'recovering'
  );
}

export function isRunningPaperSession(status: string): boolean {
  return status.toUpperCase() === 'RUNNING';
}

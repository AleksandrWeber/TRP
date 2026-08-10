import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  countSessionsByStatus,
  isActiveSession,
  isRunningPaperSession,
  loadCommandCenterProjections,
  type CommandCenterReadApi,
} from './load-projections';
import type {
  ExchangeScopeOverviewView,
  ExchangeStatusView,
  PaperSessionView,
  RuntimeHealthView,
  TradingSessionBotView,
} from '../shared/api';
import { renderToStaticMarkup } from 'react-dom/server';
import { GlobalSystemStatusPanel } from './panels/GlobalSystemStatusPanel';
import { ExchangeOverviewPanel } from './panels/ExchangeOverviewPanel';
import { BotOverviewPanel } from './panels/BotOverviewPanel';
import { ActiveSessionsPanel } from './panels/ActiveSessionsPanel';
import { RunningPaperTradingPanel } from './panels/RunningPaperTradingPanel';
import { SessionDetailInspectorPanel } from './panels/SessionDetailInspectorPanel';
import { EmergencyControlsPanel } from './panels/EmergencyControlsPanel';

const health: RuntimeHealthView = {
  status: 'ok',
  version: '0.1.0',
  uptime: 120,
  database: 'up',
  migrations: 'up',
  api: 'up',
  timestamp: '2026-08-10T12:00:00.000Z',
  environment: 'development',
  details: {
    api: 'ok',
    database: 'ok',
    migrations: 'ok',
    version: '0.1.0',
    controllersRegistered: 10,
    pendingMigrations: [],
  },
};

const bots: TradingSessionBotView[] = [
  {
    id: 'session-1',
    tradingSessionId: 'session-1',
    workspaceId: 'ws-1',
    exchangeScopeId: 'exchange-scope:binance',
    paperAccountId: 'acct-1',
    status: 'running',
    state: 'running',
    mission: { deploymentId: 'dep-1' },
    origin: 'manual',
    version: 1,
    failureReason: null,
    createdAt: '2026-08-10T11:00:00.000Z',
    recordedAt: '2026-08-10T11:00:00.000Z',
    actorId: 'user-1',
    correlationId: null,
    leaseOwnerId: 'runtime-1',
    fencingToken: 1,
  },
  {
    id: 'session-2',
    tradingSessionId: 'session-2',
    workspaceId: 'ws-1',
    exchangeScopeId: 'exchange-scope:binance',
    paperAccountId: 'acct-2',
    status: 'stopped',
    state: 'stopped',
    mission: { deploymentId: 'dep-2' },
    origin: 'manual',
    version: 2,
    failureReason: null,
    createdAt: '2026-08-10T10:00:00.000Z',
    recordedAt: '2026-08-10T10:30:00.000Z',
    actorId: 'user-1',
    correlationId: null,
    leaseOwnerId: null,
    fencingToken: null,
  },
];

const paperSessions: PaperSessionView[] = [
  {
    id: 'paper-1',
    name: 'Paper Bot A',
    status: 'RUNNING',
    initialBalance: '100000',
    currentBalance: '100000',
    portfolioId: 'pf-1',
    createdAt: '2026-08-10T09:00:00.000Z',
    startedAt: '2026-08-10T09:01:00.000Z',
    finishedAt: null,
  },
  {
    id: 'paper-2',
    name: 'Paper Bot B',
    status: 'STOPPED',
    initialBalance: '50000',
    currentBalance: '50000',
    portfolioId: 'pf-2',
    createdAt: '2026-08-10T08:00:00.000Z',
    startedAt: '2026-08-10T08:01:00.000Z',
    finishedAt: '2026-08-10T08:30:00.000Z',
  },
];

const exchangeStatus: ExchangeStatusView = {
  exchanges: [
    {
      exchangeId: 'binance',
      capabilities: {
        supportsSpot: true,
        supportsMargin: false,
        supportsFutures: false,
        supportsWebSocket: true,
        supportsMarketOrders: true,
        supportsLimitOrders: true,
        supportsOCO: false,
        supportsReduceOnly: false,
      },
      connection: {
        id: 'conn-1',
        exchangeId: 'binance',
        status: 'CONNECTED',
        latencyMs: 12,
        lastHeartbeatAt: '2026-08-10T12:00:00.000Z',
        lastSynchronizedAt: '2026-08-10T12:00:00.000Z',
        apiPermissions: ['trade'],
        supportedMarkets: ['spot'],
        capabilities: {
          supportsSpot: true,
          supportsMargin: false,
          supportsFutures: false,
          supportsWebSocket: true,
          supportsMarketOrders: true,
          supportsLimitOrders: true,
          supportsOCO: false,
          supportsReduceOnly: false,
        },
        createdAt: '2026-08-10T01:00:00.000Z',
        updatedAt: '2026-08-10T12:00:00.000Z',
      },
    },
  ],
  connectedCount: 1,
  totalCount: 1,
};

const exchangeScope: ExchangeScopeOverviewView = {
  id: 'exchange-scope:binance',
  exchangeCode: 'binance',
  label: 'Binance',
  sessionCount: 2,
  totalSessionCount: 2,
};

function createReadApi(overrides: Partial<CommandCenterReadApi> = {}): CommandCenterReadApi {
  return {
    getRuntimeHealth: vi.fn(async () => health),
    listTradingSessions: vi.fn(async () => bots),
    listPaperSessions: vi.fn(async () => paperSessions),
    getExchangeStatus: vi.fn(async () => exchangeStatus),
    getDefaultExchangeScope: vi.fn(async () => exchangeScope),
    ...overrides,
  };
}

describe('Command Center read models (RC-20 Epic 2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads projections from read APIs only', async () => {
    const readApi = createReadApi();
    const result = await loadCommandCenterProjections(readApi);

    expect(result.data.health?.version).toBe('0.1.0');
    expect(result.data.bots).toHaveLength(2);
    expect(result.data.paperSessions).toHaveLength(2);
    expect(result.data.exchangeScope?.label).toBe('Binance');
    expect(result.errors.health).toBeNull();

    expect(readApi.getRuntimeHealth).toHaveBeenCalledTimes(1);
    expect(readApi.listTradingSessions).toHaveBeenCalledTimes(1);
    expect(readApi.listPaperSessions).toHaveBeenCalledTimes(1);
    expect(readApi.getExchangeStatus).toHaveBeenCalledTimes(1);
    expect(readApi.getDefaultExchangeScope).toHaveBeenCalledTimes(1);
  });

  it('keeps partial errors without inventing healthy data', async () => {
    const readApi = createReadApi({
      getRuntimeHealth: vi.fn(async () => {
        throw new Error('health down');
      }),
    });

    const result = await loadCommandCenterProjections(readApi);
    expect(result.data.health).toBeNull();
    expect(result.errors.health).toBe('health down');
    expect(result.data.bots).toHaveLength(2);
  });

  it('classifies active and paper running sessions', () => {
    expect(isActiveSession('running')).toBe(true);
    expect(isActiveSession('stopped')).toBe(false);
    expect(isRunningPaperSession('RUNNING')).toBe(true);
    expect(isRunningPaperSession('STOPPED')).toBe(false);
    expect(countSessionsByStatus(bots)).toEqual({
      active: 1,
      paused: 0,
      recovering: 0,
      stopped: 1,
      failed: 0,
      other: 0,
    });
  });

  it('renders every panel with real read-only data', () => {
    const active = bots.filter((bot) => isActiveSession(bot.status));
    const runningPaper = paperSessions.filter((session) => isRunningPaperSession(session.status));

    const p1 = renderToStaticMarkup(
      <GlobalSystemStatusPanel
        presentation="ready"
        health={health}
        bots={bots}
        paperEngineStatus="available"
      />,
    );
    expect(p1).toContain('data-testid="cc-p1-content"');
    expect(p1).toContain('App ok');
    expect(p1).toContain('Paper engine available');
    expect(p1).toContain('Version 0.1.0');

    const p2 = renderToStaticMarkup(
      <ExchangeOverviewPanel
        presentation="ready"
        exchangeScope={exchangeScope}
        exchangeStatus={exchangeStatus}
      />,
    );
    expect(p2).toContain('Binance');
    expect(p2).toContain('exchange-scope:binance');
    expect(p2).toContain('CONNECTED');
    expect(p2).toContain('data-testid="cc-p2-session-count"');

    const p3 = renderToStaticMarkup(
      <BotOverviewPanel
        presentation="ready"
        bots={bots}
        selectedIds={['session-1']}
        focusedId="session-1"
      />,
    );
    expect(p3).toContain('session-1');
    expect(p3).toContain('running');
    expect(p3).toContain('exchange-scope:binance');

    const p4 = renderToStaticMarkup(<ActiveSessionsPanel presentation="ready" sessions={active} />);
    expect(p4).toContain('session-1');
    expect(p4).not.toContain('session-2');

    const p5 = renderToStaticMarkup(
      <RunningPaperTradingPanel presentation="ready" sessions={runningPaper} />,
    );
    expect(p5).toContain('Paper Bot A');
    expect(p5).not.toContain('Paper Bot B');

    const p7 = renderToStaticMarkup(
      <SessionDetailInspectorPanel presentation="ready" session={bots[0]!} />,
    );
    expect(p7).toContain('session-1');
    expect(p7).toContain('dep-1');
  });

  it('keeps empty and loading states correct', () => {
    const loading = renderToStaticMarkup(<BotOverviewPanel presentation="loading" />);
    expect(loading).toContain('data-testid="panel-skeleton"');

    const empty = renderToStaticMarkup(<ActiveSessionsPanel presentation="empty" />);
    expect(empty).toContain('No active sessions');

    const emptyInspector = renderToStaticMarkup(
      <SessionDetailInspectorPanel presentation="empty" />,
    );
    expect(emptyInspector).toContain('Select a bot/session');
  });

  it('renders Emergency Controls foundation as disabled interaction model (no kill mutations)', () => {
    const html = renderToStaticMarkup(<EmergencyControlsPanel presentation="ready" />);
    expect(html).toContain('Emergency Stop');
    expect(html).toContain('Clear Kill Switch');
    expect(html).toContain('Close All Sessions');
    expect(html).toContain('Global Pause');
    expect(html).toContain('data-availability="unavailable"');
    expect(html).toContain('Disabled:');
    expect(html).not.toContain('method="post"');
  });

  it('does not expose executable Kill Switch mutations from Command Center panels', () => {
    const html = [
      renderToStaticMarkup(
        <GlobalSystemStatusPanel presentation="ready" health={health} bots={bots} />,
      ),
      renderToStaticMarkup(<BotOverviewPanel presentation="ready" bots={bots} />),
      renderToStaticMarkup(<EmergencyControlsPanel presentation="ready" />),
    ].join('\n');

    expect(html).toContain('data-availability="unavailable"');
    expect(html).toContain('disabled');
    expect(html).not.toContain('method="post"');
  });
});

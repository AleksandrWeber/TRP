import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
  ExchangeScopeOverviewView,
  ExchangeStatusView,
  PaperSessionView,
  RuntimeHealthView,
  TradingSessionBotView,
} from '../shared/api';
import { CommandCenterFooter } from './components/CommandCenterFooter';
import { CommandCenterTopBar } from './components/CommandCenterTopBar';
import { FleetNavigationBar } from './components/FleetNavigationBar';
import { ActiveSessionsPanel } from './panels/ActiveSessionsPanel';
import { BotOverviewPanel } from './panels/BotOverviewPanel';
import { EmergencyControlsPanel } from './panels/EmergencyControlsPanel';
import { ExchangeOverviewPanel } from './panels/ExchangeOverviewPanel';
import { GlobalSystemStatusPanel } from './panels/GlobalSystemStatusPanel';
import { RunningPaperTradingPanel } from './panels/RunningPaperTradingPanel';
import { SessionDetailInspectorPanel } from './panels/SessionDetailInspectorPanel';
import {
  DEFAULT_FLEET_NAVIGATION,
  navigateFleet,
  resolveFleetEmptyReason,
  uniqueExchangeScopes,
  uniqueStatuses,
  type FleetNavigationState,
} from './fleet-navigation';
import { isActiveSession } from './load-projections';

const health: RuntimeHealthView = {
  status: 'ok',
  version: '0.1.0',
  uptime: 420,
  database: 'up',
  migrations: 'up_to_date',
  api: 'up',
  timestamp: '2026-08-10T12:00:00.000Z',
  environment: 'development',
  details: {
    api: 'ok',
    database: 'ok',
    migrations: 'ok',
    version: '0.1.0',
    controllersRegistered: 42,
    pendingMigrations: [],
  },
};

const bots: TradingSessionBotView[] = [
  {
    id: 'bot-alpha',
    tradingSessionId: 'bot-alpha',
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
    id: 'bot-beta',
    tradingSessionId: 'bot-beta',
    workspaceId: 'ws-1',
    exchangeScopeId: 'exchange-scope:binance',
    paperAccountId: 'acct-2',
    status: 'paused',
    state: 'paused',
    mission: { deploymentId: 'dep-2' },
    origin: 'manual',
    version: 2,
    failureReason: null,
    createdAt: '2026-08-10T10:00:00.000Z',
    recordedAt: '2026-08-10T10:30:00.000Z',
    actorId: 'user-1',
    correlationId: null,
    leaseOwnerId: 'runtime-2',
    fencingToken: 2,
  },
  {
    id: 'bot-gamma',
    tradingSessionId: 'bot-gamma',
    workspaceId: 'ws-1',
    exchangeScopeId: 'exchange-scope:okx',
    paperAccountId: 'acct-3',
    status: 'running',
    state: 'running',
    mission: { deploymentId: 'dep-3' },
    origin: 'manual',
    version: 1,
    failureReason: null,
    createdAt: '2026-08-10T09:00:00.000Z',
    recordedAt: '2026-08-10T09:00:00.000Z',
    actorId: 'user-1',
    correlationId: null,
    leaseOwnerId: 'runtime-3',
    fencingToken: 3,
  },
];

const paper: PaperSessionView = {
  id: 'paper-1',
  name: 'Paper Bot A',
  status: 'RUNNING',
  initialBalance: '100000',
  currentBalance: '100250',
  portfolioId: 'pf-1',
  createdAt: '2026-08-10T09:00:00.000Z',
  startedAt: '2026-08-10T09:01:00.000Z',
  finishedAt: null,
};

const exchangeScope: ExchangeScopeOverviewView = {
  id: 'exchange-scope:binance',
  exchangeCode: 'binance',
  label: 'Binance',
  sessionCount: 2,
  totalSessionCount: 3,
};

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
        latencyMs: 18,
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

type Shot = 'loaded' | 'search' | 'filter' | 'sort' | 'selection' | 'empty';

/**
 * Static fixture surface for RC-20 Epic 4 screenshot review.
 */
export function CommandCenterEpic4ReviewPage() {
  const [params] = useSearchParams();
  const shot = (params.get('shot') as Shot | null) ?? 'loaded';

  const navigation: FleetNavigationState = useMemo(() => {
    if (shot === 'search') return { ...DEFAULT_FLEET_NAVIGATION, search: 'gamma' };
    if (shot === 'filter') {
      return {
        ...DEFAULT_FLEET_NAVIGATION,
        exchangeFilter: 'exchange-scope:binance',
        statusFilter: 'paused',
      };
    }
    if (shot === 'sort') {
      return { ...DEFAULT_FLEET_NAVIGATION, sortField: 'status', sortDirection: 'asc' };
    }
    if (shot === 'empty') return { ...DEFAULT_FLEET_NAVIGATION, search: 'no-such-bot' };
    return DEFAULT_FLEET_NAVIGATION;
  }, [shot]);

  const visible = navigateFleet(bots, navigation);
  const active = visible.filter((bot) => isActiveSession(bot.status));
  const selectedIds =
    shot === 'selection' ? ['bot-alpha', 'bot-beta'] : visible[0] ? [visible[0].id] : [];
  const focusedId = shot === 'selection' ? 'bot-beta' : (visible[0]?.id ?? null);
  const focused = bots.find((bot) => bot.id === focusedId) ?? null;

  return (
    <section data-testid="command-center-epic4-review" data-shot={shot}>
      <div className="space-y-6" data-testid="cc-workspace">
        <CommandCenterTopBar onRefresh={() => undefined} />

        <div className="space-y-4">
          <GlobalSystemStatusPanel
            presentation="ready"
            health={health}
            bots={bots}
            paperEngineStatus="available"
          />
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ExchangeOverviewPanel
              presentation="ready"
              exchangeScope={exchangeScope}
              exchangeStatus={exchangeStatus}
            />
            <EmergencyControlsPanel presentation="placeholder" />
          </div>

          <FleetNavigationBar
            navigation={navigation}
            exchangeOptions={uniqueExchangeScopes(bots)}
            statusOptions={uniqueStatuses(bots)}
            selectedCount={selectedIds.length}
            onChange={() => undefined}
            onClearSelection={() => undefined}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <BotOverviewPanel
              presentation={visible.length > 0 ? 'ready' : 'empty'}
              bots={visible}
              selectedIds={selectedIds}
              focusedId={focusedId}
              emptyReason={resolveFleetEmptyReason(bots.length, visible.length)}
            />
            <ActiveSessionsPanel
              presentation={active.length > 0 ? 'ready' : 'empty'}
              sessions={active}
              selectedIds={selectedIds}
              focusedId={focusedId}
              emptyReason={resolveFleetEmptyReason(
                bots.filter((bot) => isActiveSession(bot.status)).length,
                active.length,
              )}
            />
          </div>

          <RunningPaperTradingPanel presentation="ready" sessions={[paper]} />
          <SessionDetailInspectorPanel
            presentation={focused ? 'ready' : 'empty'}
            session={focused}
          />
        </div>

        <CommandCenterFooter lastRefreshedAt="2026-08-10T12:00:00.000Z" />
      </div>
    </section>
  );
}

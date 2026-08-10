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
import { NotificationCenter } from './components/NotificationCenter';
import { ActiveSessionsPanel } from './panels/ActiveSessionsPanel';
import { BotOverviewPanel } from './panels/BotOverviewPanel';
import { EmergencyControlsPanel } from './panels/EmergencyControlsPanel';
import { ExchangeOverviewPanel } from './panels/ExchangeOverviewPanel';
import { GlobalSystemStatusPanel } from './panels/GlobalSystemStatusPanel';
import { RunningPaperTradingPanel } from './panels/RunningPaperTradingPanel';
import { SessionDetailInspectorPanel } from './panels/SessionDetailInspectorPanel';
import { createNotification, type OperatorNotification } from './notifications';

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

const running: TradingSessionBotView = {
  id: 'session-review-1',
  tradingSessionId: 'session-review-1',
  workspaceId: 'ws-1',
  exchangeScopeId: 'exchange-scope:binance',
  paperAccountId: 'acct-1',
  status: 'running',
  state: 'running',
  mission: { deploymentId: 'dep-1' },
  origin: 'manual',
  version: 3,
  failureReason: null,
  createdAt: '2026-08-10T11:00:00.000Z',
  recordedAt: '2026-08-10T11:30:00.000Z',
  actorId: 'user-1',
  correlationId: null,
  leaseOwnerId: 'runtime-1',
  fencingToken: 9,
};

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
  sessionCount: 1,
  totalSessionCount: 1,
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

type Shot = 'success' | 'error' | 'warning' | 'critical' | 'stack';

function notificationsForShot(shot: Shot): OperatorNotification[] {
  if (shot === 'error') {
    return [
      createNotification({
        id: 'epic5-error',
        tone: 'error',
        title: 'Operation unavailable',
        message: 'Resume is not available for session-review-1 right now.',
        sticky: false,
      }),
    ];
  }
  if (shot === 'warning') {
    return [
      createNotification({
        id: 'epic5-warning',
        tone: 'warning',
        title: 'Refresh returned partial data',
        message: 'Some projections failed: paper. Other panels remain usable.',
        sticky: false,
      }),
    ];
  }
  if (shot === 'critical') {
    return [
      createNotification({
        id: 'epic5-critical',
        tone: 'critical',
        sticky: true,
        title: 'Permission denied',
        message: 'You do not have permission to perform this action.',
      }),
    ];
  }
  if (shot === 'stack') {
    return [
      createNotification({
        id: 'epic5-stack-1',
        tone: 'success',
        title: 'Pause completed',
        message: 'Pause confirmed for session-review-1.',
      }),
      createNotification({
        id: 'epic5-stack-2',
        tone: 'warning',
        title: 'Session unavailable',
        message: 'session-old is no longer present in the latest projection.',
      }),
      createNotification({
        id: 'epic5-stack-3',
        tone: 'critical',
        sticky: true,
        title: 'Network error',
        message: 'Cannot reach the API. Check connectivity, then retry.',
      }),
    ];
  }
  return [
    createNotification({
      id: 'epic5-success',
      tone: 'success',
      title: 'Pause completed',
      message: 'Pause confirmed for session-review-1.',
      sticky: false,
    }),
  ];
}

/**
 * Static fixture surface for RC-20 Epic 5 screenshot review.
 */
export function CommandCenterEpic5ReviewPage() {
  const [params] = useSearchParams();
  const shot = (params.get('shot') as Shot | null) ?? 'success';
  const notifications = notificationsForShot(shot);

  return (
    <section data-testid="command-center-epic5-review" data-shot={shot}>
      <NotificationCenter notifications={notifications} onDismiss={() => undefined} />
      <div className="space-y-6" data-testid="cc-workspace">
        <CommandCenterTopBar onRefresh={() => undefined} />
        <GlobalSystemStatusPanel
          presentation="ready"
          health={health}
          bots={[running]}
          paperEngineStatus="available"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <ExchangeOverviewPanel
            presentation="ready"
            exchangeScope={exchangeScope}
            exchangeStatus={exchangeStatus}
          />
          <EmergencyControlsPanel presentation="placeholder" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <BotOverviewPanel
            presentation="ready"
            bots={[running]}
            selectedIds={['session-review-1']}
          />
          <ActiveSessionsPanel
            presentation="ready"
            sessions={[running]}
            selectedIds={['session-review-1']}
          />
        </div>
        <RunningPaperTradingPanel presentation="ready" sessions={[paper]} />
        <SessionDetailInspectorPanel presentation="ready" session={running} />
        <CommandCenterFooter lastRefreshedAt="2026-08-10T12:00:00.000Z" />
      </div>
    </section>
  );
}

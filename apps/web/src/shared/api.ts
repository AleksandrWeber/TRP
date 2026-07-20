import { clearAccessToken, getAccessToken, getActiveWorkspace } from './auth';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
/** Nest URI versioning prefix (US114). Health remains unversioned. */
const API_PREFIX = '/v1';

export type Dataset = {
  id: string;
  symbol: string;
  timeframe: string;
  exchange: string;
  contentHash: string;
  barCount: number;
  startTime: string;
  endTime: string;
  gitCommit: string | null;
  createdAt: string;
  _count?: { experiments: number };
};

export type Experiment = {
  id: string;
  datasetId: string;
  strategyId: string;
  strategyVersion: string;
  configHash: string;
  gitCommit: string | null;
  verdict: 'pass' | 'fail' | 'needs_review';
  report: Record<string, unknown>;
  metrics: {
    totalReturnPercent: number;
    tradeCount: number;
    winRate: number;
    profitFactor: number;
    maxDrawdownPercent: number;
    expectancy: number;
    finalEquity: number;
  };
  validation: {
    verdict: string;
    reasons: string[];
    checks: Array<{ name: string; passed: boolean; value: number | string; threshold: string }>;
  };
  createdAt: string;
  dataset?: { symbol: string; timeframe: string; contentHash: string };
  deployment?: Deployment | null;
};

export type Deployment = {
  id: string;
  experimentId: string;
  strategyId: string;
  strategyVersion: string;
  symbol: string;
  timeframe: string;
  exchange: string;
  mode: string;
  status: string;
  approvedAt: string;
  position?: { side: string; quantity: number; entryPrice: number | null };
  experiment?: { verdict: string; configHash: string };
  _count?: { signals: number; executions: number };
};

export type Execution = {
  id: string;
  deploymentId: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  fee: number;
  mode: string;
  status: string;
  rejectReason: string | null;
  executedAt: string;
  signal?: { type: string; timestamp: string };
  deployment?: { symbol: string; strategyId: string };
};

export type TickResult = {
  signal: { id: string; type: string; price: number; timestamp: string; actedOn: boolean };
  execution: Execution | null;
  risk: { approved: boolean; reason?: string };
  position: { side: string; quantity: number; entryPrice: number | null };
};

export type Workflow = {
  id: string;
  type: string;
  status: string;
  context: Record<string, unknown>;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  steps: Array<{
    id: string;
    name: string;
    stepOrder: number;
    status: string;
    result: Record<string, unknown> | null;
    error: string | null;
  }>;
};

export type KnowledgeEntry = {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  version: number;
  validationStatus: string;
  createdAt: string;
};

export type CampaignRunRequest = {
  datasetId: string;
  strategyId: string;
  paramsList: Array<Record<string, string | number | boolean | null>>;
};

export type CampaignFailedRun = {
  params: Record<string, string | number | boolean | null>;
  error: string;
};

export type CampaignSummary = {
  campaignId: string;
  strategyId: string;
  datasetId: string;
  totalRuns: number;
  passCount: number;
  failCount: number;
  needsReviewCount: number;
  bestExperimentId: string | null;
  createdAt: string;
  failedRuns: CampaignFailedRun[];
};

export type MultiDatasetCampaignRequest = {
  strategyId: string;
  datasets: string[];
  paramsList: Array<Record<string, string | number | boolean | null>>;
};

export type MultiDatasetCampaignFailedDataset = {
  datasetId: string;
  error: string;
};

export type MultiDatasetCampaignSummary = {
  totalDatasets: number;
  completedDatasets: number;
  failedDatasets: number;
  campaignSummaries: CampaignSummary[];
  overallBestExperimentId: string | null;
  overallBestProfitFactor: number | null;
  failedDatasetErrors: MultiDatasetCampaignFailedDataset[];
};

export type WalkForwardWindowResult = {
  trainStart: number;
  trainEnd: number;
  testStart: number;
  testEnd: number;
  summary: CampaignSummary | null;
  error: string | null;
};

export type WalkForwardCampaignRequest = {
  datasetId: string;
  strategyId: string;
  paramsList: Array<Record<string, string | number | boolean | null>>;
  datasetLength: number;
  windowSize: number;
  stepSize: number;
};

export type WalkForwardCampaignSummary = {
  datasetId: string;
  strategyId: string;
  windowSize: number;
  stepSize: number;
  paramsCount: number;
  windowCount: number;
  successfulWindows: number;
  failedWindows: number;
  windows: WalkForwardWindowResult[];
  averageProfitFactor: number | null;
  averageReturnPercent: number | null;
  averageMaxDrawdownPercent: number | null;
  averageExpectancy: number | null;
  bestWindowIndex: number | null;
  worstWindowIndex: number | null;
  passCount: number | null;
  needsReviewCount: number | null;
  failCount: number | null;
  overallVerdict: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
};

export type ResearchAnalysis = {
  executiveSummary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextHypothesis: string;
};

export type StrategyStatus = 'draft' | 'active' | 'archived';
export type StrategyTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type StrategyDirection = 'LONG' | 'SHORT' | 'BOTH';
export type StrategyParameters = Record<string, unknown>;

export type Strategy = {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: StrategyStatus;
  tradingPair: string;
  timeframe: StrategyTimeframe;
  direction: StrategyDirection;
  positionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  parameters: StrategyParameters;
  createdAt: string;
  updatedAt: string;
};

export type CreateStrategyRequest = {
  name: string;
  tradingPair: string;
  timeframe: StrategyTimeframe;
  direction: StrategyDirection;
  description?: string;
  status?: StrategyStatus;
  positionSize?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  parameters?: StrategyParameters;
};

export type UpdateStrategyRequest = {
  name?: string;
  tradingPair?: string;
  timeframe?: StrategyTimeframe;
  direction?: StrategyDirection;
  description?: string;
  status?: StrategyStatus;
  positionSize?: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  parameters?: StrategyParameters;
};

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

export type LoginResponse = {
  accessToken: string;
  expiresIn: string;
  user: AuthUser;
};

export type WorkspaceBootstrap = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

export type PortfolioView = {
  id: string;
  ownerId: string;
  currency: string;
  status: string;
  balance: { cash: string };
  equity: { equity: string; realizedPnL: string; unrealizedPnL: string };
  margin: { usedMargin: string; availableMargin: string };
  portfolioValue: string;
  portfolioReturn: string;
  createdAt: string;
  updatedAt: string;
  refreshedAt: string;
};

export type PortfolioBalance = { cash: string };
export type PortfolioEquity = { equity: string; realizedPnL: string; unrealizedPnL: string };
export type PortfolioMargin = { usedMargin: string; availableMargin: string };

export type PositionView = {
  id: string;
  portfolioId: string;
  symbol: string;
  side: string;
  status: string;
  quantity: string;
  entryPrice: string;
  markPrice: string;
  averageEntryPrice: string;
  realizedPnL: string;
  unrealizedPnL: string;
  exposure: string;
  positionValue: string;
  returnPercent: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type PositionHistoryEntry = {
  id: string;
  positionId: string;
  timestamp: string;
  action: string;
  quantity: string;
  price: string;
  realizedPnL: string;
};

export type OrderView = {
  id: string;
  portfolioId: string;
  positionId: string | null;
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  requestedPrice: string | null;
  executedPrice: string | null;
  filledQuantity: string;
  remainingQuantity: string;
  status: string;
  timeInForce: string;
  createdAt: string;
  updatedAt: string;
  executedAt: string | null;
  cancelledAt: string | null;
};

export type OrderHistoryEntry = {
  id: string;
  orderId: string;
  timestamp: string;
  previousStatus: string;
  currentStatus: string;
  reason: string;
};

export type OrderFillEntry = {
  id: string;
  orderId: string;
  timestamp: string;
  quantity: string;
  price: string;
  fee: string;
};

export type RiskDecisionView = {
  id: string;
  portfolioId: string;
  orderId: string;
  decision: string;
  reason: string;
  score: string;
  timestamp: string;
};

export type RiskPolicyView = {
  id: string;
  portfolioId: string | null;
  name: string;
  enabled: boolean;
  priority: number;
  configuration: Record<string, unknown>;
};

export type RiskSummaryView = {
  exposure: string;
  marginUsage: string;
  availableMargin: string;
  usedMargin: string;
  openPositionCount: number;
  equity: string;
  cash: string;
};

export type PaperSessionView = {
  id: string;
  name: string;
  status: string;
  initialBalance: string;
  currentBalance: string;
  portfolioId: string;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
};

export type PaperExecutionView = {
  id: string;
  sessionId: string;
  orderId: string;
  executionTime: string;
  executionPrice: string;
  slippage: string;
  commission: string;
};

export type PaperSessionStatistics = {
  netPnL: string;
  grossPnL: string;
  winRate: string;
  profitFactor: string;
  maxDrawdown: string;
  averageTrade: string;
  sharpeRatio: string;
  currentEquity: string;
  tradeCount: number;
  winningTrades: number;
  losingTrades: number;
};

export type PaperTradeResult = {
  session: PaperSessionView;
  order: OrderView;
  execution: PaperExecutionView | null;
};

export type ExchangeCapabilitiesView = {
  supportsSpot: boolean;
  supportsMargin: boolean;
  supportsFutures: boolean;
  supportsWebSocket: boolean;
  supportsMarketOrders: boolean;
  supportsLimitOrders: boolean;
  supportsOCO: boolean;
  supportsReduceOnly: boolean;
};

export type LiveSessionView = {
  id: string;
  exchange: string;
  accountId: string;
  status: string;
  startedAt: string | null;
  stoppedAt: string | null;
  lastHeartbeat: string | null;
  reconnectCount: number;
  synchronizationState: string;
  tradingFrozen: boolean;
  portfolioId: string;
  createdAt: string;
  updatedAt: string;
};

export type LiveStatusView = {
  activeSessions: LiveSessionView[];
  totalSessions: number;
  runningCount: number;
};

export type LiveAlertView = {
  type: string;
  severity: string;
  message: string;
  sessionId: string | null;
};

export type LiveHealthReportView = {
  sessionId: string | null;
  status: string | null;
  heartbeat: string | null;
  heartbeatLost: boolean;
  websocketLatencyMs: number | null;
  restLatencyMs: number | null;
  reconnectCount: number;
  synchronizationState: string | null;
  synchronizationDelayMs: number | null;
  orderAcknowledgementDelayMs: number | null;
  healthy: boolean;
  alerts: LiveAlertView[];
  sampledAt: string;
};

export type LiveWorkspaceHealthView = {
  sessions: LiveHealthReportView[];
  alerts: LiveAlertView[];
  healthy: boolean;
  sampledAt: string;
};

export type LiveSynchronizationLogView = {
  id: string;
  sessionId: string;
  kind: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  details: Record<string, unknown>;
};

export type LiveSynchronizationView = {
  logs: LiveSynchronizationLogView[];
  sessions: LiveSessionView[];
};

export type LiveEventView = {
  id: string;
  sessionId: string;
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
};

export type LiveOrderResult = {
  session: LiveSessionView;
  order: OrderView;
  exchangeOrderId: string | null;
};

export type ExchangeConnectionView = {
  id: string;
  exchangeId: string;
  status: string;
  latencyMs: number | null;
  lastHeartbeatAt: string | null;
  lastSynchronizedAt: string | null;
  apiPermissions: string[];
  supportedMarkets: string[];
  capabilities: ExchangeCapabilitiesView;
  createdAt: string;
  updatedAt: string;
};

export type ExchangeView = {
  exchangeId: string;
  capabilities: ExchangeCapabilitiesView;
  connection: ExchangeConnectionView | null;
};

export type ExchangeStatusView = {
  exchanges: ExchangeView[];
  connectedCount: number;
  totalCount: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const workspace = getActiveWorkspace();
  if (workspace && !headers.has('X-Workspace-Id')) {
    headers.set('X-Workspace-Id', workspace.id);
  }

  let res: Response;
  try {
    res = await fetch(`${apiUrl}${API_PREFIX}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new Error(`Cannot reach API at ${apiUrl}. Start it with: pnpm --filter api start`);
  }

  if (res.status === 401) {
    clearAccessToken();
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function runCampaign(body: CampaignRunRequest) {
  return request<CampaignSummary>('/campaigns/run', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function analyzeCampaign(campaignSummary: CampaignSummary) {
  return request<ResearchAnalysis>('/campaigns/analyze', {
    method: 'POST',
    body: JSON.stringify({ campaignSummary }),
  });
}

export function runMultiDatasetCampaign(body: MultiDatasetCampaignRequest) {
  return request<MultiDatasetCampaignSummary>('/campaigns/run-multi', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function runWalkForwardCampaign(body: WalkForwardCampaignRequest) {
  return request<WalkForwardCampaignSummary>('/campaigns/run-walk-forward', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<AuthUser>('/auth/me'),
  bootstrapWorkspace: () =>
    request<WorkspaceBootstrap>('/workspaces/bootstrap', {
      method: 'POST',
      body: '{}',
    }),
  importDataset: () =>
    request<{ dataset: Dataset; created: boolean }>('/datasets/import/binance', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'BTCUSDT', timeframe: '1h', limit: 1000 }),
    }),
  listDatasets: () => request<Dataset[]>('/datasets'),
  listExperiments: () => request<Experiment[]>('/experiments'),
  runExperiment: (datasetId: string) =>
    request<Experiment>('/experiments', {
      method: 'POST',
      body: JSON.stringify({ datasetId }),
    }),
  getExperiment: (id: string) => request<Experiment>(`/experiments/${id}`),
  startWorkflow: (datasetId: string, approveNeedsReview = false) =>
    request<Workflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify({ type: 'research_pipeline', datasetId, approveNeedsReview }),
    }),
  listWorkflows: () => request<Workflow[]>('/workflows'),
  getWorkflow: (id: string) => request<Workflow>(`/workflows/${id}`),
  listKnowledge: (params?: { q?: string; type?: string; category?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.type) query.set('type', params.type);
    if (params?.category) query.set('category', params.category);
    const qs = query.toString();
    return request<KnowledgeEntry[]>(`/knowledge${qs ? `?${qs}` : ''}`);
  },
  listStrategies: () => request<Strategy[]>('/strategies'),
  getStrategy: (id: string) => request<Strategy>(`/strategies/${id}`),
  createStrategy: (body: CreateStrategyRequest) =>
    request<Strategy>('/strategies', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateStrategy: (id: string, body: UpdateStrategyRequest) =>
    request<Strategy>(`/strategies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteStrategy: (id: string) =>
    // Empty JSON body: the shared client always sends Content-Type:
    // application/json and Fastify rejects an empty body with that type.
    request<{ id: string; deleted: boolean }>(`/strategies/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    }),
  runCampaign,
  analyzeCampaign,
  runMultiDatasetCampaign,
  runWalkForwardCampaign,
  aiExecute: (task: string, context: Record<string, unknown>) =>
    request<{ content: string; provider: string; model: string }>('/ai/execute', {
      method: 'POST',
      body: JSON.stringify({ task, context }),
    }),
  listEvents: () => request<Array<{ id: string; type: string; createdAt: string }>>('/events'),
  deploy: (experimentId: string, approve = false) =>
    request<Deployment>('/production/deployments', {
      method: 'POST',
      body: JSON.stringify({ experimentId, approve }),
    }),
  listDeployments: () => request<Deployment[]>('/production/deployments'),
  getDeployment: (id: string) => request<Deployment>(`/production/deployments/${id}`),
  tick: (deploymentId: string) =>
    request<TickResult>(`/production/deployments/${deploymentId}/tick`, { method: 'POST' }),
  stopDeployment: (id: string) =>
    request<Deployment>(`/production/deployments/${id}/stop`, { method: 'POST' }),
  listExecutions: (deploymentId?: string) =>
    request<Execution[]>(
      `/production/executions${deploymentId ? `?deploymentId=${deploymentId}` : ''}`,
    ),
  getPortfolio: () => request<PortfolioView>('/portfolio'),
  getPortfolioBalance: () => request<PortfolioBalance>('/portfolio/balance'),
  getPortfolioEquity: () => request<PortfolioEquity>('/portfolio/equity'),
  getPortfolioMargin: () => request<PortfolioMargin>('/portfolio/margin'),
  listPortfolioSnapshots: () =>
    request<
      Array<{
        id: string;
        portfolioId: string;
        timestamp: string;
        balance: PortfolioBalance;
        equity: PortfolioEquity;
        margin: PortfolioMargin;
        realizedPnL: string;
        unrealizedPnL: string;
      }>
    >('/portfolio/snapshots'),
  resetPortfolio: () =>
    request<PortfolioView>('/portfolio/reset', {
      method: 'POST',
      body: '{}',
    }),
  listPositions: () => request<PositionView[]>('/positions'),
  listOpenPositions: () => request<PositionView[]>('/positions/open'),
  getPosition: (id: string) => request<PositionView>(`/positions/${id}`),
  listPositionHistory: (positionId?: string) =>
    request<PositionHistoryEntry[]>(
      `/positions/history${positionId ? `?positionId=${encodeURIComponent(positionId)}` : ''}`,
    ),
  markPositionPrice: (body: { positionId: string; markPrice: string }) =>
    request<PositionView>('/positions/mark-price', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  listOrders: () => request<OrderView[]>('/trading-orders'),
  listOpenOrders: () => request<OrderView[]>('/trading-orders/open'),
  getOrder: (id: string) => request<OrderView>(`/trading-orders/${id}`),
  listOrderHistory: (orderId?: string) =>
    request<OrderHistoryEntry[]>(
      `/trading-orders/history${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ''}`,
    ),
  listOrderFills: (orderId: string) =>
    request<OrderFillEntry[]>(`/trading-orders/${orderId}/fills`),
  createOrder: (body: {
    symbol: string;
    side: string;
    type: string;
    quantity: string;
    requestedPrice?: string | null;
    timeInForce?: string;
  }) =>
    request<OrderView>('/trading-orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  cancelOrder: (id: string, reason?: string) =>
    request<OrderView>(`/trading-orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(reason ? { reason } : {}),
    }),
  executeOrder: (id: string, body: { quantity?: string; price: string; fee?: string }) =>
    request<OrderView>(`/trading-orders/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateOrder: (
    id: string,
    body: { quantity?: string; requestedPrice?: string | null; timeInForce?: string },
  ) =>
    request<OrderView>(`/trading-orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  listRiskPolicies: () => request<RiskPolicyView[]>('/risk/policies'),
  listRiskDecisions: () => request<RiskDecisionView[]>('/risk/decisions'),
  listRiskHistory: () => request<RiskDecisionView[]>('/risk/history'),
  getRiskSummary: () => request<RiskSummaryView>('/risk/summary'),
  updateRiskPolicy: (
    id: string,
    body: { enabled?: boolean; priority?: number; configuration?: Record<string, unknown> },
  ) =>
    request<RiskPolicyView>(`/risk/policies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  evaluateRisk: (body: {
    orderId: string;
    symbol: string;
    side: string;
    type: string;
    quantity: string;
    requestedPrice?: string | null;
    referencePrice?: string | null;
  }) =>
    request<{ decision: RiskDecisionView; result: unknown }>('/risk/evaluate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listPaperSessions: () => request<PaperSessionView[]>('/paper/sessions'),
  getPaperSession: (id: string) => request<PaperSessionView>(`/paper/sessions/${id}`),
  createPaperSession: (body: { name: string; initialBalance?: string }) =>
    request<PaperSessionView>('/paper/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  startPaperSession: (id: string) =>
    request<PaperSessionView>(`/paper/sessions/${id}/start`, {
      method: 'POST',
      body: '{}',
    }),
  pausePaperSession: (id: string) =>
    request<PaperSessionView>(`/paper/sessions/${id}/pause`, {
      method: 'POST',
      body: '{}',
    }),
  stopPaperSession: (id: string) =>
    request<PaperSessionView>(`/paper/sessions/${id}/stop`, {
      method: 'POST',
      body: '{}',
    }),
  deletePaperSession: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/paper/sessions/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    }),
  listPaperSessionOrders: (id: string) => request<OrderView[]>(`/paper/sessions/${id}/orders`),
  listPaperSessionPositions: (id: string) =>
    request<PositionView[]>(`/paper/sessions/${id}/positions`),
  getPaperSessionPortfolio: (id: string) =>
    request<PortfolioView>(`/paper/sessions/${id}/portfolio`),
  listPaperSessionExecutions: (id: string) =>
    request<PaperExecutionView[]>(`/paper/sessions/${id}/executions`),
  getPaperSessionStatistics: (id: string) =>
    request<PaperSessionStatistics>(`/paper/sessions/${id}/statistics`),
  executePaperTrade: (
    id: string,
    body: {
      symbol: string;
      side: string;
      type: string;
      quantity: string;
      requestedPrice?: string | null;
      marketPrice?: string;
      timeInForce?: string;
    },
  ) =>
    request<PaperTradeResult>(`/paper/sessions/${id}/orders`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listExchanges: () => request<ExchangeView[]>('/exchanges'),
  getExchangeStatus: () => request<ExchangeStatusView>('/exchanges/status'),
  getExchange: (id: string) => request<ExchangeView>(`/exchanges/${id}`),
  getExchangeCapabilities: (id: string) =>
    request<ExchangeCapabilitiesView>(`/exchanges/${id}/capabilities`),
  connectExchange: (exchangeId: string) =>
    request<ExchangeConnectionView>('/exchanges/connect', {
      method: 'POST',
      body: JSON.stringify({ exchangeId }),
    }),
  disconnectExchange: (exchangeId: string, reason?: string | null) =>
    request<ExchangeConnectionView>('/exchanges/disconnect', {
      method: 'POST',
      body: JSON.stringify({ exchangeId, reason: reason ?? null }),
    }),
  listLiveSessions: () => request<LiveSessionView[]>('/live/sessions'),
  getLiveStatus: () => request<LiveStatusView>('/live/status'),
  getLiveHealth: () => request<LiveWorkspaceHealthView>('/live/health'),
  getLiveSynchronization: () => request<LiveSynchronizationView>('/live/synchronization'),
  startLiveSession: (body: { exchange: string; accountId: string; sessionId?: string }) =>
    request<LiveSessionView>('/live/start', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  stopLiveSession: (sessionId: string) =>
    request<LiveSessionView>('/live/stop', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  pauseLiveSession: (sessionId: string) =>
    request<LiveSessionView>('/live/pause', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  resumeLiveSession: (sessionId: string) =>
    request<LiveSessionView>('/live/resume', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  reconnectLiveSession: (sessionId: string) =>
    request<{
      session: LiveSessionView;
      replayedExecutions: number;
      skippedDuplicates: number;
    }>('/live/reconnect', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  synchronizeLiveSession: (sessionId: string) =>
    request<{
      session: LiveSessionView;
      inconsistencies: unknown[];
      balances: number;
      positions: number;
      openOrders: number;
    }>('/live/synchronize', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  activateKillSwitch: (sessionId: string, body?: { closePositions?: boolean; reason?: string }) =>
    request<{
      session: LiveSessionView;
      cancelledOrders: number;
      closedPositions: number;
      strategyDisabled: boolean;
      tradingFrozen: boolean;
      reason: string;
    }>('/live/kill-switch', {
      method: 'POST',
      body: JSON.stringify({ sessionId, ...body }),
    }),
  clearKillSwitch: (sessionId: string) =>
    request<LiveSessionView>('/live/kill-switch/clear', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  submitLiveOrder: (body: {
    sessionId: string;
    symbol: string;
    side: string;
    type: string;
    quantity: string;
    requestedPrice?: string | null;
    timeInForce?: string;
  }) =>
    request<LiveOrderResult>('/live/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listLiveSessionOrders: (id: string) => request<OrderView[]>(`/live/sessions/${id}/orders`),
  listLiveSessionPositions: (id: string) =>
    request<PositionView[]>(`/live/sessions/${id}/positions`),
  getLiveSessionPortfolio: (id: string) => request<PortfolioView>(`/live/sessions/${id}/portfolio`),
  listLiveSessionEvents: (id: string) => request<LiveEventView[]>(`/live/sessions/${id}/events`),
};

export function verdictColor(verdict: string) {
  if (verdict === 'pass') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  if (verdict === 'needs_review') return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
  if (verdict === 'completed' || verdict === 'active' || verdict === 'filled') {
    return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  }
  return 'text-red-300 border-red-500/30 bg-red-500/10';
}

export function statusColor(status: string) {
  if (status === 'active' || status === 'completed' || status === 'filled' || status === 'pass') {
    return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  }
  if (status === 'running' || status === 'needs_review') {
    return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
  }
  return 'text-slate-300 border-slate-500/30 bg-slate-500/10';
}

import { clearAccessToken, getAccessToken } from './auth';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${apiUrl}${path}`, {
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

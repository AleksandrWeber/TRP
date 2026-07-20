/**
 * Research Control Center API client (US192).
 * Thin transport layer — no business logic.
 */

import { clearAccessToken, getAccessToken, getActiveWorkspace } from '../shared/auth';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const API_PREFIX = '/v1';

export type ExecutionRecordStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type ResearchExecutionKind =
  'SmokeBacktest' | 'HistoricalReplay' | 'WalkForwardValidation' | 'MultiYearResearch';

export type EngineeringSuiteKind =
  | 'PerformanceBenchmark'
  | 'DeterministicReplayValidation'
  | 'RegressionSuite'
  | 'ChaosTesting'
  | 'LiveReadinessReview';

export type ResearchControlEvent = {
  eventType: string;
  occurredAt: string;
  payload?: Record<string, unknown>;
};

export type ResearchControlDiagnostics = {
  warnings: string[];
  anomalies: string[];
  recommendations: string[];
  eventEmission: Record<string, unknown>[];
};

export type ResearchExecutionRecord = {
  id: string;
  kind: ResearchExecutionKind;
  category: 'research';
  status: ExecutionRecordStatus;
  workspaceId: string;
  strategyId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  progress: number;
  error: string | null;
  result: unknown | null;
  events: ResearchControlEvent[];
  diagnostics: ResearchControlDiagnostics;
  createdAt: string;
  updatedAt: string;
};

export type OptimizationRecord = {
  id: string;
  category: 'optimization';
  status: ExecutionRecordStatus;
  workspaceId: string;
  criterion: string;
  configurationCount: number;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  progress: number;
  error: string | null;
  report: unknown | null;
  events: ResearchControlEvent[];
  diagnostics: ResearchControlDiagnostics;
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsRecord = {
  id: string;
  category: 'analytics';
  status: ExecutionRecordStatus;
  workspaceId: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  progress: number;
  error: string | null;
  report: unknown | null;
  events: ResearchControlEvent[];
  diagnostics: ResearchControlDiagnostics;
  createdAt: string;
  updatedAt: string;
};

export type EngineeringRecord = {
  id: string;
  kind: EngineeringSuiteKind;
  category: 'engineering';
  status: ExecutionRecordStatus;
  workspaceId: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  progress: number;
  error: string | null;
  report: unknown | null;
  events: ResearchControlEvent[];
  diagnostics: ResearchControlDiagnostics;
  createdAt: string;
  updatedAt: string;
};

export type DashboardSnapshot = {
  platformStatus: 'operational' | 'degraded' | 'unavailable';
  activeExecutions: number;
  latestResearchRuns: ResearchExecutionRecord[];
  latestOptimizationRuns: OptimizationRecord[];
  latestReadinessReport: EngineeringRecord | null;
  recentBenchmarkStatus: EngineeringRecord | null;
  generatedAt: string;
};

export type DiagnosticsSnapshot = {
  workspaceId: string;
  generatedAt: string;
  warnings: string[];
  anomalies: string[];
  recommendations: string[];
  eventEmission: Record<string, unknown>[];
};

export type ResearchControlSettings = {
  autoRefreshSeconds: number;
  defaultStrategyId: string;
  maxListedExecutions: number;
};

export type ActiveExecution =
  ResearchExecutionRecord | OptimizationRecord | AnalyticsRecord | EngineeringRecord;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');

  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const workspace = getActiveWorkspace();
  if (workspace?.id) {
    headers.set('X-Workspace-Id', workspace.id);
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${API_PREFIX}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new Error(`Cannot reach API at ${apiUrl}. Start it with: pnpm --filter @trp/api start`);
  }

  if (response.status === 401) {
    clearAccessToken();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string | string[] };
      if (typeof body.message === 'string') message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join(', ');
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const researchControlApi = {
  getDashboard: () => request<DashboardSnapshot>('/research-control/dashboard'),
  listExecutions: () => request<ResearchExecutionRecord[]>('/research-control/executions'),
  listActive: () => request<ActiveExecution[]>('/research-control/executions/active'),
  getExecution: (id: string) =>
    request<ResearchExecutionRecord>(`/research-control/executions/${id}`),
  startExecution: (body: { kind: ResearchExecutionKind; strategyId?: string }) =>
    request<ResearchExecutionRecord>('/research-control/executions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  cancelExecution: (id: string) =>
    request<ResearchExecutionRecord>(`/research-control/executions/${id}/cancel`, {
      method: 'POST',
      body: '{}',
    }),
  listOptimizations: () => request<OptimizationRecord[]>('/research-control/optimizations'),
  getOptimization: (id: string) =>
    request<OptimizationRecord>(`/research-control/optimizations/${id}`),
  startOptimization: (body: {
    criterion?: string;
    configurations?: Array<{ configurationId: string; parameters?: Record<string, number> }>;
  }) =>
    request<OptimizationRecord>('/research-control/optimizations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listAnalytics: () => request<AnalyticsRecord[]>('/research-control/analytics'),
  getAnalytics: (id: string) => request<AnalyticsRecord>(`/research-control/analytics/${id}`),
  startAnalytics: (body: { analysisId?: string; executionCount?: number } = {}) =>
    request<AnalyticsRecord>('/research-control/analytics', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  listEngineering: () => request<EngineeringRecord[]>('/research-control/engineering'),
  getEngineering: (id: string) => request<EngineeringRecord>(`/research-control/engineering/${id}`),
  startEngineering: (body: { kind: EngineeringSuiteKind }) =>
    request<EngineeringRecord>('/research-control/engineering', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getDiagnostics: () => request<DiagnosticsSnapshot>('/research-control/diagnostics'),
  getSettings: () => request<ResearchControlSettings>('/research-control/settings'),
  updateSettings: (body: Partial<ResearchControlSettings>) =>
    request<ResearchControlSettings>('/research-control/settings', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
};

export const RESEARCH_KINDS: ResearchExecutionKind[] = [
  'SmokeBacktest',
  'HistoricalReplay',
  'WalkForwardValidation',
  'MultiYearResearch',
];

export const ENGINEERING_KINDS: EngineeringSuiteKind[] = [
  'PerformanceBenchmark',
  'DeterministicReplayValidation',
  'RegressionSuite',
  'ChaosTesting',
  'LiveReadinessReview',
];

export const OPTIMIZATION_CRITERIA = [
  'highestExecutionSuccessRate',
  'lowestAverageSlippage',
  'lowestCommission',
  'customWeightedScore',
] as const;

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
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
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
};

export function verdictColor(verdict: string) {
  if (verdict === 'pass') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  if (verdict === 'needs_review') return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
  return 'text-red-300 border-red-500/30 bg-red-500/10';
}

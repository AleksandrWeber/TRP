/**
 * In-memory execution records for the Research Control Center (US192).
 * Presentation DTOs only — no business calculations.
 */

export const RESEARCH_EXECUTION_KINDS = Object.freeze([
  'SmokeBacktest',
  'HistoricalReplay',
  'WalkForwardValidation',
  'MultiYearResearch',
] as const);

export type ResearchExecutionKind = (typeof RESEARCH_EXECUTION_KINDS)[number];

export const ENGINEERING_SUITE_KINDS = Object.freeze([
  'PerformanceBenchmark',
  'DeterministicReplayValidation',
  'RegressionSuite',
  'ChaosTesting',
  'LiveReadinessReview',
] as const);

export type EngineeringSuiteKind = (typeof ENGINEERING_SUITE_KINDS)[number];

export const EXECUTION_RECORD_STATUSES = Object.freeze([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const);

export type ExecutionRecordStatus = (typeof EXECUTION_RECORD_STATUSES)[number];

export type ResearchControlEvent = Readonly<{
  eventType: string;
  occurredAt: string;
  payload?: Readonly<Record<string, unknown>>;
}>;

export type ResearchControlDiagnostics = Readonly<{
  warnings: readonly string[];
  anomalies: readonly string[];
  recommendations: readonly string[];
  eventEmission: readonly Readonly<Record<string, unknown>>[];
}>;

export type ResearchExecutionRecord = Readonly<{
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
  events: readonly ResearchControlEvent[];
  diagnostics: ResearchControlDiagnostics;
  createdAt: string;
  updatedAt: string;
}>;

export type OptimizationRecord = Readonly<{
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
  events: readonly ResearchControlEvent[];
  diagnostics: ResearchControlDiagnostics;
  createdAt: string;
  updatedAt: string;
}>;

export type AnalyticsRecord = Readonly<{
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
  events: readonly ResearchControlEvent[];
  diagnostics: ResearchControlDiagnostics;
  createdAt: string;
  updatedAt: string;
}>;

export type EngineeringRecord = Readonly<{
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
  events: readonly ResearchControlEvent[];
  diagnostics: ResearchControlDiagnostics;
  createdAt: string;
  updatedAt: string;
}>;

export type ResearchControlSettings = Readonly<{
  autoRefreshSeconds: number;
  defaultStrategyId: string;
  maxListedExecutions: number;
}>;

export type DashboardSnapshot = Readonly<{
  platformStatus: 'operational' | 'degraded' | 'unavailable';
  activeExecutions: number;
  latestResearchRuns: readonly ResearchExecutionRecord[];
  latestOptimizationRuns: readonly OptimizationRecord[];
  latestReadinessReport: EngineeringRecord | null;
  recentBenchmarkStatus: EngineeringRecord | null;
  generatedAt: string;
}>;

export function emptyDiagnostics(): ResearchControlDiagnostics {
  return Object.freeze({
    warnings: Object.freeze([]),
    anomalies: Object.freeze([]),
    recommendations: Object.freeze([]),
    eventEmission: Object.freeze([]),
  });
}

export function isResearchExecutionKind(value: string): value is ResearchExecutionKind {
  return (RESEARCH_EXECUTION_KINDS as readonly string[]).includes(value);
}

export function isEngineeringSuiteKind(value: string): value is EngineeringSuiteKind {
  return (ENGINEERING_SUITE_KINDS as readonly string[]).includes(value);
}

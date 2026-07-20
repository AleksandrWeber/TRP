import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ENGINEERING_KINDS,
  OPTIMIZATION_CRITERIA,
  RESEARCH_KINDS,
  researchControlApi,
  type EngineeringSuiteKind,
  type ResearchExecutionKind,
} from './api';

export const researchControlKeys = {
  all: ['research-control'] as const,
  dashboard: () => [...researchControlKeys.all, 'dashboard'] as const,
  executions: () => [...researchControlKeys.all, 'executions'] as const,
  execution: (id: string) => [...researchControlKeys.all, 'execution', id] as const,
  active: () => [...researchControlKeys.all, 'active'] as const,
  optimizations: () => [...researchControlKeys.all, 'optimizations'] as const,
  optimization: (id: string) => [...researchControlKeys.all, 'optimization', id] as const,
  analytics: () => [...researchControlKeys.all, 'analytics'] as const,
  analytic: (id: string) => [...researchControlKeys.all, 'analytic', id] as const,
  engineering: () => [...researchControlKeys.all, 'engineering'] as const,
  engineeringRun: (id: string) => [...researchControlKeys.all, 'engineering-run', id] as const,
  diagnostics: () => [...researchControlKeys.all, 'diagnostics'] as const,
  settings: () => [...researchControlKeys.all, 'settings'] as const,
};

function useRefreshInterval(enabled = true) {
  const settingsQuery = useQuery({
    queryKey: researchControlKeys.settings(),
    queryFn: researchControlApi.getSettings,
    staleTime: 60_000,
  });
  const seconds = settingsQuery.data?.autoRefreshSeconds ?? 5;
  return enabled ? seconds * 1000 : false;
}

export function useDashboard() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: researchControlKeys.dashboard(),
    queryFn: researchControlApi.getDashboard,
    refetchInterval,
  });
}

export function useExecutions() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: researchControlKeys.executions(),
    queryFn: researchControlApi.listExecutions,
    refetchInterval,
  });
}

export function useActiveExecutions() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: researchControlKeys.active(),
    queryFn: researchControlApi.listActive,
    refetchInterval,
  });
}

export function useExecution(id: string | undefined) {
  const refetchInterval = useRefreshInterval(Boolean(id));
  return useQuery({
    queryKey: researchControlKeys.execution(id ?? ''),
    queryFn: () => researchControlApi.getExecution(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'running') return refetchInterval;
      return false;
    },
  });
}

export function useStartExecution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { kind: ResearchExecutionKind; strategyId?: string }) =>
      researchControlApi.startExecution(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: researchControlKeys.all });
    },
  });
}

export function useCancelExecution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => researchControlApi.cancelExecution(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: researchControlKeys.all });
    },
  });
}

export function useOptimizations() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: researchControlKeys.optimizations(),
    queryFn: researchControlApi.listOptimizations,
    refetchInterval,
  });
}

export function useOptimization(id: string | undefined) {
  const refetchInterval = useRefreshInterval(Boolean(id));
  return useQuery({
    queryKey: researchControlKeys.optimization(id ?? ''),
    queryFn: () => researchControlApi.getOptimization(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'running') return refetchInterval;
      return false;
    },
  });
}

export function useStartOptimization() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      criterion?: (typeof OPTIMIZATION_CRITERIA)[number];
      configurations?: Array<{ configurationId: string; parameters?: Record<string, number> }>;
    }) => researchControlApi.startOptimization(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: researchControlKeys.all });
    },
  });
}

export function useAnalyticsList() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: researchControlKeys.analytics(),
    queryFn: researchControlApi.listAnalytics,
    refetchInterval,
  });
}

export function useAnalytics(id: string | undefined) {
  return useQuery({
    queryKey: researchControlKeys.analytic(id ?? ''),
    queryFn: () => researchControlApi.getAnalytics(id!),
    enabled: Boolean(id),
  });
}

export function useStartAnalytics() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { executionCount?: number } = {}) =>
      researchControlApi.startAnalytics(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: researchControlKeys.all });
    },
  });
}

export function useEngineeringList() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: researchControlKeys.engineering(),
    queryFn: researchControlApi.listEngineering,
    refetchInterval,
  });
}

export function useEngineering(id: string | undefined) {
  const refetchInterval = useRefreshInterval(Boolean(id));
  return useQuery({
    queryKey: researchControlKeys.engineeringRun(id ?? ''),
    queryFn: () => researchControlApi.getEngineering(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pending' || status === 'running') return refetchInterval;
      return false;
    },
  });
}

export function useStartEngineering() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { kind: EngineeringSuiteKind }) =>
      researchControlApi.startEngineering(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: researchControlKeys.all });
    },
  });
}

export function useDiagnostics() {
  const refetchInterval = useRefreshInterval();
  return useQuery({
    queryKey: researchControlKeys.diagnostics(),
    queryFn: researchControlApi.getDiagnostics,
    refetchInterval,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: researchControlKeys.settings(),
    queryFn: researchControlApi.getSettings,
  });
}

export function useUpdateSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: researchControlApi.updateSettings,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: researchControlKeys.settings() });
    },
  });
}

export { RESEARCH_KINDS, ENGINEERING_KINDS, OPTIMIZATION_CRITERIA };

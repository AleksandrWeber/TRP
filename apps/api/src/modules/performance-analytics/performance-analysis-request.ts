import type { ExecutionResult } from '../execution-simulator';
import {
  createPerformanceAnalyticsConfiguration,
  type PerformanceAnalyticsConfiguration,
} from './performance-analytics-configuration';

/**
 * Immutable analysis request for US202 Performance Analytics.
 */
export type PerformanceAnalysisRequest = Readonly<{
  analysisId: string;
  executionResults: readonly ExecutionResult[];
  configuration: PerformanceAnalyticsConfiguration;
}>;

export type CreatePerformanceAnalysisRequestInput = Readonly<{
  analysisId: string;
  executionResults: readonly ExecutionResult[] | null;
  configuration?: PerformanceAnalyticsConfiguration;
}>;

export function createPerformanceAnalysisRequest(
  input: CreatePerformanceAnalysisRequestInput,
): PerformanceAnalysisRequest {
  const analysisId = required(input.analysisId, 'analysisId');
  if (input.executionResults === null || input.executionResults === undefined) {
    throw new Error('executionResults are required');
  }

  const configuration = input.configuration ?? createPerformanceAnalyticsConfiguration({});

  return Object.freeze({
    analysisId,
    executionResults: Object.freeze([...input.executionResults]),
    configuration: createPerformanceAnalyticsConfiguration(configuration),
  });
}

function required(value: string, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized === '') {
    throw new Error(`${field} is required`);
  }
  return normalized;
}

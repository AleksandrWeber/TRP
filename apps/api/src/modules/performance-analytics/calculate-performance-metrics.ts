import type { ExecutionResult } from '../execution-simulator';
import type { PerformanceAnalyticsConfiguration } from './performance-analytics-configuration';
import {
  createPerformanceDiagnostics,
  type PerformanceDiagnostics,
} from './performance-diagnostics';

export type AggregatedPerformanceMetrics = Readonly<{
  totalExecutions: number;
  filledExecutions: number;
  partialFilledExecutions: number;
  rejectedExecutions: number;
  totalCommission: number;
  averageCommission: number;
  averageExecutionPrice: number;
  averageSlippage: number;
  executionSuccessRate: number;
  averageExecutionDuration: number;
  diagnostics: PerformanceDiagnostics;
}>;

/**
 * Validates execution results and aggregates deterministic performance metrics.
 */
export function aggregateExecutionMetrics(
  executionResults: readonly ExecutionResult[],
  configuration: PerformanceAnalyticsConfiguration,
): AggregatedPerformanceMetrics {
  const warnings: string[] = [];
  const anomalies: string[] = [];
  const validationMessages: string[] = [];

  let filledExecutions = 0;
  let partialFilledExecutions = 0;
  let rejectedExecutions = 0;
  let totalCommission = 0;
  let totalExecutionDuration = 0;
  let executionPriceTotal = 0;
  let executionPriceCount = 0;
  let slippageTotal = 0;
  let slippageCount = 0;

  for (const result of executionResults) {
    validateExecutionResult(result);

    totalCommission += result.commission;
    totalExecutionDuration += result.executionDuration;

    const status = result.fill.executionStatus;
    if (status === 'FILLED') {
      filledExecutions += 1;
    } else if (status === 'PARTIALLY_FILLED') {
      partialFilledExecutions += 1;
    } else {
      rejectedExecutions += 1;
    }

    collectDiagnostics(result, warnings, anomalies);

    if (status === 'REJECTED') {
      continue;
    }

    if (result.fill.executedQuantity > 0) {
      executionPriceTotal += result.fill.executedPrice;
      executionPriceCount += 1;
    }

    const requestedPrice = configuration.requestedPricesByRequestId[result.requestId];
    if (requestedPrice === undefined) {
      warnings.push(`missing requested price for ${result.requestId}; slippage excluded`);
      continue;
    }

    slippageTotal += Math.abs(result.fill.executedPrice - requestedPrice);
    slippageCount += 1;
  }

  const totalExecutions = executionResults.length;
  const successfulExecutions = filledExecutions + partialFilledExecutions;

  if (totalExecutions > 0) {
    validationMessages.push(`validated ${totalExecutions} execution results`);
  } else {
    validationMessages.push('validated empty execution result collection');
  }

  return Object.freeze({
    totalExecutions,
    filledExecutions,
    partialFilledExecutions,
    rejectedExecutions,
    totalCommission,
    averageCommission: totalExecutions === 0 ? 0 : totalCommission / totalExecutions,
    averageExecutionPrice:
      executionPriceCount === 0 ? 0 : executionPriceTotal / executionPriceCount,
    averageSlippage: slippageCount === 0 ? 0 : slippageTotal / slippageCount,
    executionSuccessRate: totalExecutions === 0 ? 0 : successfulExecutions / totalExecutions,
    averageExecutionDuration:
      totalExecutions === 0 ? 0 : Math.floor(totalExecutionDuration / totalExecutions),
    diagnostics: createPerformanceDiagnostics({
      warnings,
      anomalies,
      validationMessages,
    }),
  });
}

export function validateExecutionResult(result: ExecutionResult): void {
  if (!Number.isFinite(result.commission) || result.commission < 0) {
    throw new Error(`invalid commission for ${result.requestId}`);
  }
  if (!Number.isFinite(result.fill.executedPrice) || result.fill.executedPrice < 0) {
    throw new Error(`invalid price for ${result.requestId}`);
  }
}

function collectDiagnostics(
  result: ExecutionResult,
  warnings: string[],
  anomalies: string[],
): void {
  if (result.fill.executionStatus === 'REJECTED') {
    if (result.commission !== 0) {
      anomalies.push(`rejected execution ${result.requestId} has non-zero commission`);
    }
    if (result.fill.executedQuantity !== 0) {
      anomalies.push(`rejected execution ${result.requestId} has non-zero quantity`);
    }
    if (result.fill.executedPrice !== 0) {
      anomalies.push(`rejected execution ${result.requestId} has non-zero price`);
    }
    return;
  }

  if (result.fill.executedQuantity === 0) {
    anomalies.push(
      `${result.fill.executionStatus.toLowerCase()} execution ${result.requestId} has zero quantity`,
    );
  }

  if (result.fill.executionStatus === 'PARTIALLY_FILLED' && result.commission === 0) {
    warnings.push(`partial fill ${result.requestId} has zero commission`);
  }
}

export function deterministicReportId(analysisId: string): string {
  return `perf-report-${analysisId}`;
}

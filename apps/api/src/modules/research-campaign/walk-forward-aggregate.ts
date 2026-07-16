import type { CampaignSummary } from './research-campaign.types';

export type WalkForwardOverallVerdict = 'PASS' | 'NEEDS_REVIEW' | 'FAIL';

export type WalkForwardWindowMetrics = {
  profitFactor: number | null;
  totalReturnPercent: number | null;
  maxDrawdownPercent: number | null;
  expectancy: number | null;
};

/** Successful window input for aggregate (error windows excluded by caller). */
export type WalkForwardAggregateWindow = {
  windowIndex: number;
  summary: CampaignSummary;
  /** Train metrics (best train experiment). */
  metrics: WalkForwardWindowMetrics;
  /** Test metrics from Test Slice evaluation (US049); optional for train-only inputs. */
  testMetrics?: WalkForwardWindowMetrics | null;
  /** Test experiment verdict string (e.g. pass / fail / needs_review). */
  testVerdict?: string | null;
};

export type WalkForwardAggregate = {
  // Train Aggregate (reference)
  averageProfitFactor: number | null;
  averageReturnPercent: number | null;
  averageMaxDrawdownPercent: number | null;
  averageExpectancy: number | null;
  bestWindowIndex: number | null;
  worstWindowIndex: number | null;
  passCount: number | null;
  needsReviewCount: number | null;
  failCount: number | null;
  // Test Aggregate (US050)
  testPassCount: number | null;
  testNeedsReviewCount: number | null;
  testFailCount: number | null;
  averageTestReturnPercent: number | null;
  averageTestProfitFactor: number | null;
  averageTestMaxDrawdownPercent: number | null;
  /** Overall Walk-Forward verdict from Test verdicts only (US050). */
  overallVerdict: WalkForwardOverallVerdict;
};

export function resolveWindowVerdict(summary: CampaignSummary): WalkForwardOverallVerdict {
  if (summary.passCount > 0) return 'PASS';
  if (summary.needsReviewCount > 0) return 'NEEDS_REVIEW';
  return 'FAIL';
}

export function resolveTestVerdict(
  verdict: string | null | undefined,
): WalkForwardOverallVerdict | null {
  if (verdict == null || verdict === '') return null;
  const normalized = verdict.toLowerCase();
  if (normalized === 'pass') return 'PASS';
  if (normalized === 'needs_review') return 'NEEDS_REVIEW';
  if (normalized === 'fail') return 'FAIL';
  return null;
}

/**
 * Build aggregate stats from successful walk-forward windows only.
 * Error windows must not be passed in.
 *
 * Train Aggregate stays for reference; overallVerdict uses Test verdicts only (US050).
 */
export function buildWalkForwardAggregate(
  successfulWindows: WalkForwardAggregateWindow[],
): WalkForwardAggregate {
  if (successfulWindows.length === 0) {
    return emptyAggregate();
  }

  let passCount = 0;
  let needsReviewCount = 0;
  let failCount = 0;

  let testPassCount = 0;
  let testNeedsReviewCount = 0;
  let testFailCount = 0;
  let testVerdictWindows = 0;
  let hasTestFail = false;
  let hasTestNeedsReview = false;

  const profitFactors: number[] = [];
  const returns: number[] = [];
  const drawdowns: number[] = [];
  const expectancies: number[] = [];

  const testProfitFactors: number[] = [];
  const testReturns: number[] = [];
  const testDrawdowns: number[] = [];

  let bestWindowIndex: number | null = null;
  let worstWindowIndex: number | null = null;
  let bestPf = Number.NEGATIVE_INFINITY;
  let worstPf = Number.POSITIVE_INFINITY;

  for (const window of successfulWindows) {
    const trainVerdict = resolveWindowVerdict(window.summary);
    if (trainVerdict === 'PASS') passCount += 1;
    else if (trainVerdict === 'NEEDS_REVIEW') needsReviewCount += 1;
    else failCount += 1;

    const pf = window.metrics.profitFactor;
    if (typeof pf === 'number') {
      profitFactors.push(pf);
      if (pf > bestPf) {
        bestPf = pf;
        bestWindowIndex = window.windowIndex;
      }
      if (pf < worstPf) {
        worstPf = pf;
        worstWindowIndex = window.windowIndex;
      }
    }

    const ret = window.metrics.totalReturnPercent;
    if (typeof ret === 'number') returns.push(ret);

    const dd = window.metrics.maxDrawdownPercent;
    if (typeof dd === 'number') drawdowns.push(dd);

    const exp = window.metrics.expectancy;
    if (typeof exp === 'number') expectancies.push(exp);

    const testVerdict = resolveTestVerdict(window.testVerdict);
    if (testVerdict != null) {
      testVerdictWindows += 1;
      if (testVerdict === 'PASS') testPassCount += 1;
      else if (testVerdict === 'NEEDS_REVIEW') {
        testNeedsReviewCount += 1;
        hasTestNeedsReview = true;
      } else {
        testFailCount += 1;
        hasTestFail = true;
      }
    }

    const testPf = window.testMetrics?.profitFactor;
    if (typeof testPf === 'number') testProfitFactors.push(testPf);

    const testRet = window.testMetrics?.totalReturnPercent;
    if (typeof testRet === 'number') testReturns.push(testRet);

    const testDd = window.testMetrics?.maxDrawdownPercent;
    if (typeof testDd === 'number') testDrawdowns.push(testDd);
  }

  let overallVerdict: WalkForwardOverallVerdict = 'FAIL';
  if (testVerdictWindows > 0) {
    if (hasTestFail) overallVerdict = 'FAIL';
    else if (hasTestNeedsReview) overallVerdict = 'NEEDS_REVIEW';
    else overallVerdict = 'PASS';
  }

  return {
    averageProfitFactor: average(profitFactors),
    averageReturnPercent: average(returns),
    averageMaxDrawdownPercent: average(drawdowns),
    averageExpectancy: average(expectancies),
    bestWindowIndex,
    worstWindowIndex,
    passCount,
    needsReviewCount,
    failCount,
    testPassCount: testVerdictWindows > 0 ? testPassCount : null,
    testNeedsReviewCount: testVerdictWindows > 0 ? testNeedsReviewCount : null,
    testFailCount: testVerdictWindows > 0 ? testFailCount : null,
    averageTestReturnPercent: average(testReturns),
    averageTestProfitFactor: average(testProfitFactors),
    averageTestMaxDrawdownPercent: average(testDrawdowns),
    overallVerdict,
  };
}

function emptyAggregate(): WalkForwardAggregate {
  return {
    averageProfitFactor: null,
    averageReturnPercent: null,
    averageMaxDrawdownPercent: null,
    averageExpectancy: null,
    bestWindowIndex: null,
    worstWindowIndex: null,
    passCount: null,
    needsReviewCount: null,
    failCount: null,
    testPassCount: null,
    testNeedsReviewCount: null,
    testFailCount: null,
    averageTestReturnPercent: null,
    averageTestProfitFactor: null,
    averageTestMaxDrawdownPercent: null,
    overallVerdict: 'FAIL',
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

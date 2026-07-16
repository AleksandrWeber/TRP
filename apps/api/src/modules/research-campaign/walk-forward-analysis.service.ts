import { Injectable } from '@nestjs/common';
import type { WalkForwardCampaignSummary } from './walk-forward-campaign.types';
import type {
  WalkForwardAnalysis,
  WalkForwardOverallAssessment,
} from './walk-forward-analysis.types';

@Injectable()
export class WalkForwardAnalysisService {
  /**
   * Deterministic Walk-Forward analysis over an existing summary.
   * No AI / LLM / external APIs — pure function of aggregate fields.
   */
  buildAnalysis(summary: WalkForwardCampaignSummary): WalkForwardAnalysis {
    const stabilityScore = this.computeStabilityScore(summary);
    const consistencyScore = this.computeConsistencyScore(summary);
    const overallAssessment = this.resolveAssessment(summary, stabilityScore, consistencyScore);

    return {
      overallAssessment,
      strengths: this.buildStrengths(summary, stabilityScore, consistencyScore),
      weaknesses: this.buildWeaknesses(summary, stabilityScore, consistencyScore),
      recommendations: this.buildRecommendations(summary, overallAssessment),
      stabilityScore,
      consistencyScore,
    };
  }

  private isEmpty(summary: WalkForwardCampaignSummary): boolean {
    return summary.windowCount === 0;
  }

  private hasNoSuccessfulWindows(summary: WalkForwardCampaignSummary): boolean {
    return summary.successfulWindows === 0;
  }

  /**
   * Stability 0..100 from pass/fail counts, averageProfitFactor, averageMaxDrawdownPercent.
   */
  private computeStabilityScore(summary: WalkForwardCampaignSummary): number {
    if (this.isEmpty(summary) || this.hasNoSuccessfulWindows(summary)) {
      return 0;
    }

    const pass = summary.passCount ?? 0;
    const fail = summary.failCount ?? 0;
    const denom = pass + fail;
    const passComponent = denom === 0 ? 0 : (pass / denom) * 100;

    const pf = summary.averageProfitFactor;
    const pfComponent = pf == null ? 0 : clamp((pf / 1.5) * 100);

    const dd = summary.averageMaxDrawdownPercent;
    const ddComponent = dd == null ? 0 : clamp(100 - dd * 2);

    return clamp(0.4 * passComponent + 0.35 * pfComponent + 0.25 * ddComponent);
  }

  /**
   * Consistency 0..100 from PASS/FAIL ratio, error windows, averageReturnPercent.
   */
  private computeConsistencyScore(summary: WalkForwardCampaignSummary): number {
    if (this.isEmpty(summary)) {
      return 0;
    }

    const pass = summary.passCount ?? 0;
    const fail = summary.failCount ?? 0;
    const denom = pass + fail;
    const passFailComponent =
      this.hasNoSuccessfulWindows(summary) || denom === 0 ? 0 : (pass / denom) * 100;

    const errorRatio = summary.windowCount === 0 ? 1 : summary.failedWindows / summary.windowCount;
    const errorComponent = (1 - errorRatio) * 100;

    const ret = summary.averageReturnPercent;
    const returnComponent = ret == null ? 0 : clamp(50 + ret * 5);

    return clamp(0.4 * passFailComponent + 0.35 * errorComponent + 0.25 * returnComponent);
  }

  private resolveAssessment(
    summary: WalkForwardCampaignSummary,
    stabilityScore: number,
    consistencyScore: number,
  ): WalkForwardOverallAssessment {
    if (this.isEmpty(summary) || this.hasNoSuccessfulWindows(summary)) {
      return 'UNUSABLE';
    }

    if (summary.overallVerdict === 'FAIL' && (summary.passCount ?? 0) === 0) {
      return 'UNUSABLE';
    }

    if (stabilityScore >= 70 && consistencyScore >= 70 && summary.overallVerdict === 'PASS') {
      return 'ROBUST';
    }

    if (
      stabilityScore >= 50 &&
      consistencyScore >= 50 &&
      (summary.overallVerdict === 'PASS' || summary.overallVerdict === 'NEEDS_REVIEW')
    ) {
      return 'PROMISING';
    }

    if (stabilityScore < 40 || consistencyScore < 40) {
      return 'UNSTABLE';
    }

    return 'UNSTABLE';
  }

  private buildStrengths(
    summary: WalkForwardCampaignSummary,
    stabilityScore: number,
    consistencyScore: number,
  ): string[] {
    if (this.isEmpty(summary) || this.hasNoSuccessfulWindows(summary)) {
      return [];
    }

    const strengths: string[] = [];

    if ((summary.passCount ?? 0) > 0) {
      strengths.push(`${summary.passCount} walk-forward window(s) passed validation.`);
    }

    if (summary.averageProfitFactor != null && summary.averageProfitFactor >= 1.2) {
      strengths.push(`Average profit factor is ${summary.averageProfitFactor}.`);
    }

    if (summary.averageReturnPercent != null && summary.averageReturnPercent > 0) {
      strengths.push(`Average return is ${summary.averageReturnPercent}%.`);
    }

    if (summary.averageMaxDrawdownPercent != null && summary.averageMaxDrawdownPercent <= 15) {
      strengths.push(
        `Average max drawdown is controlled at ${summary.averageMaxDrawdownPercent}%.`,
      );
    }

    if (summary.failedWindows === 0) {
      strengths.push('All walk-forward windows completed without execution errors.');
    }

    if (stabilityScore >= 70) {
      strengths.push(`Stability score is strong (${stabilityScore}/100).`);
    }

    if (consistencyScore >= 70) {
      strengths.push(`Consistency score is strong (${consistencyScore}/100).`);
    }

    return strengths;
  }

  private buildWeaknesses(
    summary: WalkForwardCampaignSummary,
    stabilityScore: number,
    consistencyScore: number,
  ): string[] {
    if (this.isEmpty(summary)) {
      return ['No walk-forward windows were generated; evidence is insufficient.'];
    }

    if (this.hasNoSuccessfulWindows(summary)) {
      return ['All walk-forward windows failed with execution errors.'];
    }

    const weaknesses: string[] = [];

    if ((summary.failCount ?? 0) > 0) {
      weaknesses.push(`${summary.failCount} walk-forward window(s) failed validation.`);
    }

    if ((summary.needsReviewCount ?? 0) > 0) {
      weaknesses.push(`${summary.needsReviewCount} walk-forward window(s) need manual review.`);
    }

    if (summary.failedWindows > 0) {
      weaknesses.push(
        `${summary.failedWindows}/${summary.windowCount} window(s) failed with execution errors.`,
      );
    }

    if (summary.averageProfitFactor != null && summary.averageProfitFactor < 1) {
      weaknesses.push(`Average profit factor is weak (${summary.averageProfitFactor}).`);
    }

    if (summary.averageReturnPercent != null && summary.averageReturnPercent <= 0) {
      weaknesses.push(`Average return is non-positive (${summary.averageReturnPercent}%).`);
    }

    if (summary.averageMaxDrawdownPercent != null && summary.averageMaxDrawdownPercent > 20) {
      weaknesses.push(`Average max drawdown is elevated (${summary.averageMaxDrawdownPercent}%).`);
    }

    if (stabilityScore < 50) {
      weaknesses.push(`Stability score is low (${stabilityScore}/100).`);
    }

    if (consistencyScore < 50) {
      weaknesses.push(`Consistency score is low (${consistencyScore}/100).`);
    }

    return weaknesses;
  }

  private buildRecommendations(
    summary: WalkForwardCampaignSummary,
    assessment: WalkForwardOverallAssessment,
  ): string[] {
    if (this.isEmpty(summary)) {
      return ['Increase sample size', 'Provide a longer dataset before walk-forward analysis.'];
    }

    if (this.hasNoSuccessfulWindows(summary)) {
      return [
        'Investigate unstable windows',
        'Increase sample size',
        'Do not promote this strategy from walk-forward evidence.',
      ];
    }

    const recommendations: string[] = [];

    if (summary.averageMaxDrawdownPercent != null && summary.averageMaxDrawdownPercent > 20) {
      recommendations.push('Reduce drawdown');
    }

    if (summary.windowCount < 3 || summary.failedWindows > 0) {
      recommendations.push('Increase sample size');
    }

    if (assessment === 'UNSTABLE' || assessment === 'UNUSABLE') {
      recommendations.push('Improve robustness');
      recommendations.push('Investigate unstable windows');
    }

    if (assessment === 'PROMISING') {
      recommendations.push('Improve robustness');
      recommendations.push('Validate on additional walk-forward windows before promotion.');
    }

    if (assessment === 'ROBUST') {
      recommendations.push('Preserve current configuration as a walk-forward benchmark.');
      recommendations.push('Validate on an adjacent dataset before promotion.');
    }

    if ((summary.failCount ?? 0) > 0 && !recommendations.includes('Investigate unstable windows')) {
      recommendations.push('Investigate unstable windows');
    }

    if (recommendations.length === 0) {
      recommendations.push('Improve robustness');
    }

    return recommendations;
  }
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

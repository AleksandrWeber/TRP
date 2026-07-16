import { Injectable } from '@nestjs/common';
import type { CampaignReport } from '../research-campaign/campaign-report.types';
import type { CampaignSummary } from '../research-campaign/research-campaign.types';
import type { ResearchAnalysis } from './research-analysis.types';

@Injectable()
export class ResearchAnalysisService {
  analyzeCampaignSummary(summary: CampaignSummary): ResearchAnalysis {
    return this.buildAnalysis(this.summaryToReport(summary));
  }

  buildAnalysis(report: CampaignReport): ResearchAnalysis {
    return {
      executiveSummary: this.buildExecutiveSummary(report),
      strengths: this.buildStrengths(report),
      weaknesses: this.buildWeaknesses(report),
      recommendations: this.buildRecommendations(report),
      nextHypothesis: this.buildNextHypothesis(report),
    };
  }

  private summaryToReport(summary: CampaignSummary): CampaignReport {
    const verdict =
      summary.passCount > 0 ? 'PASS' : summary.needsReviewCount > 0 ? 'NEEDS_REVIEW' : 'FAIL';

    return {
      campaignId: summary.campaignId,
      strategyId: summary.strategyId,
      datasetId: summary.datasetId,
      totalRuns: summary.totalRuns,
      passCount: summary.passCount,
      failCount: summary.failCount,
      needsReviewCount: summary.needsReviewCount,
      bestExperimentId: summary.bestExperimentId,
      bestProfitFactor: null,
      bestReturn: null,
      bestExpectancy: null,
      lowestDrawdown: null,
      verdict,
      recommendations: [],
      createdAt: summary.createdAt,
    };
  }

  private isEmpty(report: CampaignReport): boolean {
    return (
      report.totalRuns === 0 || report.passCount + report.failCount + report.needsReviewCount === 0
    );
  }

  private buildExecutiveSummary(report: CampaignReport): string {
    if (this.isEmpty(report)) {
      return `Campaign ${report.campaignId} for strategy ${report.strategyId} produced no completed experiment results.`;
    }

    const best =
      report.bestExperimentId != null ? ` Best experiment: ${report.bestExperimentId}.` : '';

    if (report.verdict === 'PASS') {
      return `Campaign ${report.campaignId} on strategy ${report.strategyId} PASS: ${report.passCount}/${report.totalRuns} configurations passed validation.${best}`;
    }

    if (report.verdict === 'NEEDS_REVIEW') {
      return `Campaign ${report.campaignId} on strategy ${report.strategyId} NEEDS_REVIEW: ${report.needsReviewCount}/${report.totalRuns} configurations require manual review; none fully passed.${best}`;
    }

    return `Campaign ${report.campaignId} on strategy ${report.strategyId} FAIL: ${report.failCount}/${report.totalRuns} configurations failed validation with no PASS results.${best}`;
  }

  private buildStrengths(report: CampaignReport): string[] {
    if (this.isEmpty(report)) {
      return [];
    }

    const strengths: string[] = [];

    if (report.passCount > 0) {
      strengths.push(`${report.passCount} configuration(s) passed validation.`);
    }

    if (report.bestProfitFactor != null && report.bestProfitFactor > 1) {
      strengths.push(`Best profit factor is ${report.bestProfitFactor}.`);
    }

    if (report.bestReturn != null && report.bestReturn > 0) {
      strengths.push(`Best return is ${report.bestReturn}%.`);
    }

    if (report.bestExpectancy != null && report.bestExpectancy > 0) {
      strengths.push(`Best expectancy is ${report.bestExpectancy}.`);
    }

    if (report.lowestDrawdown != null) {
      strengths.push(`Lowest observed drawdown is ${report.lowestDrawdown}%.`);
    }

    if (report.verdict === 'PASS' && strengths.length === 0) {
      strengths.push('At least one configuration met validation thresholds.');
    }

    return strengths;
  }

  private buildWeaknesses(report: CampaignReport): string[] {
    if (this.isEmpty(report)) {
      return ['No configurations completed; campaign evidence is insufficient.'];
    }

    const weaknesses: string[] = [];

    if (report.failCount > 0) {
      weaknesses.push(`${report.failCount} configuration(s) failed validation.`);
    }

    if (report.needsReviewCount > 0) {
      weaknesses.push(`${report.needsReviewCount} configuration(s) need manual review.`);
    }

    if (report.passCount === 0) {
      weaknesses.push('No configuration fully passed validation.');
    }

    if (report.bestProfitFactor != null && report.bestProfitFactor <= 1) {
      weaknesses.push(`Best profit factor is only ${report.bestProfitFactor}.`);
    }

    if (report.bestReturn != null && report.bestReturn <= 0) {
      weaknesses.push(`Best return is non-positive (${report.bestReturn}%).`);
    }

    if (report.bestExpectancy != null && report.bestExpectancy <= 0) {
      weaknesses.push(`Best expectancy is non-positive (${report.bestExpectancy}).`);
    }

    if (report.verdict === 'FAIL' && weaknesses.length === 0) {
      weaknesses.push('Campaign verdict is FAIL with no validated edge.');
    }

    return weaknesses;
  }

  private buildRecommendations(report: CampaignReport): string[] {
    if (this.isEmpty(report)) {
      return [
        'Provide at least one parameter set and re-run the campaign.',
        'Do not promote this strategy until completed experiments exist.',
      ];
    }

    const recommendations = [...report.recommendations];

    if (report.verdict === 'PASS') {
      recommendations.push(
        'Preserve the passing configuration as a benchmark for the next hypothesis.',
      );
      recommendations.push(
        'Validate robustness on an adjacent dataset or timeframe before promotion.',
      );
    }

    if (report.verdict === 'NEEDS_REVIEW') {
      recommendations.push('Inspect needs_review configurations before any promotion decision.');
      recommendations.push(
        'Tighten or clarify validation thresholds only with explicit research justification.',
      );
    }

    if (report.verdict === 'FAIL') {
      recommendations.push('Do not promote this strategy class from the current campaign.');
      recommendations.push(
        'Design the next hypothesis around a materially different signal structure.',
      );
    }

    return recommendations;
  }

  private buildNextHypothesis(report: CampaignReport): string {
    if (this.isEmpty(report)) {
      return `Re-run ${report.strategyId} with a non-empty paramsList on dataset ${report.datasetId}.`;
    }

    if (report.verdict === 'PASS') {
      return `Test whether the passing ${report.strategyId} configuration remains valid on a longer or adjacent dataset relative to ${report.datasetId}.`;
    }

    if (report.verdict === 'NEEDS_REVIEW') {
      return `Manually review the needs_review ${report.strategyId} configurations on dataset ${report.datasetId}, then re-test only the viable subset.`;
    }

    return `Replace or filter ${report.strategyId} on dataset ${report.datasetId}; current campaign shows no validated configurations.`;
  }
}

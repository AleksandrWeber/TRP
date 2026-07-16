import { Injectable } from '@nestjs/common';
import type { CampaignSummary } from './research-campaign.types';
import type {
  CampaignReport,
  CampaignReportExperiment,
  CampaignReportVerdict,
} from './campaign-report.types';

@Injectable()
export class CampaignReportService {
  build(summary: CampaignSummary, experiments: CampaignReportExperiment[]): CampaignReport {
    const verdict = this.resolveVerdict(summary);
    const best = this.resolveBestExperiment(summary, experiments);
    const lowestDrawdown = this.resolveLowestDrawdown(experiments);

    const report: CampaignReport = {
      campaignId: summary.campaignId,
      strategyId: summary.strategyId,
      datasetId: summary.datasetId,
      totalRuns: summary.totalRuns,
      passCount: summary.passCount,
      failCount: summary.failCount,
      needsReviewCount: summary.needsReviewCount,
      bestExperimentId: best?.id ?? summary.bestExperimentId,
      bestProfitFactor: this.asNumber(best?.metrics?.profitFactor),
      bestReturn: this.asNumber(best?.metrics?.totalReturnPercent),
      bestExpectancy: this.asNumber(best?.metrics?.expectancy),
      lowestDrawdown,
      verdict,
      recommendations: this.buildRecommendations(summary, best, verdict),
      createdAt: summary.createdAt,
    };

    return report;
  }

  private resolveVerdict(summary: CampaignSummary): CampaignReportVerdict {
    if (summary.passCount > 0) return 'PASS';
    if (summary.needsReviewCount > 0) return 'NEEDS_REVIEW';
    return 'FAIL';
  }

  private resolveBestExperiment(
    summary: CampaignSummary,
    experiments: CampaignReportExperiment[],
  ): CampaignReportExperiment | null {
    if (experiments.length === 0) return null;

    if (summary.bestExperimentId) {
      const byId = experiments.find((experiment) => experiment.id === summary.bestExperimentId);
      if (byId) return byId;
    }

    let best: CampaignReportExperiment | null = null;
    let bestPf = Number.NEGATIVE_INFINITY;
    for (const experiment of experiments) {
      const pf = experiment.metrics?.profitFactor;
      if (typeof pf === 'number' && pf > bestPf) {
        bestPf = pf;
        best = experiment;
      }
    }
    return best;
  }

  private resolveLowestDrawdown(experiments: CampaignReportExperiment[]): number | null {
    let lowest: number | null = null;
    for (const experiment of experiments) {
      const dd = experiment.metrics?.maxDrawdownPercent;
      if (typeof dd !== 'number') continue;
      if (lowest === null || dd < lowest) lowest = dd;
    }
    return lowest;
  }

  private buildRecommendations(
    summary: CampaignSummary,
    best: CampaignReportExperiment | null,
    verdict: CampaignReportVerdict,
  ): string[] {
    const recommendations: string[] = [];

    if (summary.totalRuns === 0 || (experimentsEmpty(summary) && !best)) {
      recommendations.push('No configurations were run.');
      recommendations.push('Provide at least one parameter set before starting a campaign.');
      return recommendations;
    }

    if (verdict === 'FAIL') {
      recommendations.push('No configuration passed validation.');
    }

    if (verdict === 'NEEDS_REVIEW') {
      recommendations.push('No configuration fully passed; at least one needs manual review.');
    }

    if (best) {
      recommendations.push(`Best candidate: ${this.formatCandidate(best)}.`);
    }

    if (verdict === 'FAIL') {
      recommendations.push('Consider testing another strategy class.');
    }

    if (summary.failedRuns.length > 0) {
      recommendations.push(
        `${summary.failedRuns.length} run(s) failed with execution errors and were excluded from metrics.`,
      );
    }

    return recommendations;
  }

  private formatCandidate(experiment: CampaignReportExperiment): string {
    const params = experiment.report?.params ?? {};
    if (typeof params.channelPeriod === 'number') {
      return `period ${params.channelPeriod}`;
    }
    if (typeof params.emaFast === 'number' && typeof params.emaSlow === 'number') {
      return `EMA(${params.emaFast},${params.emaSlow})`;
    }
    const entries = Object.entries(params);
    if (entries.length === 0) return experiment.id;
    return entries.map(([key, value]) => `${key}=${value}`).join(', ');
  }

  private asNumber(value: unknown): number | null {
    return typeof value === 'number' ? value : null;
  }
}

function experimentsEmpty(summary: CampaignSummary): boolean {
  return summary.passCount + summary.failCount + summary.needsReviewCount === 0;
}

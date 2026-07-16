import type { CampaignSummary } from '../shared/api';

export type CampaignResultVerdict = 'PASS' | 'NEEDS_REVIEW' | 'FAIL';

/** Display-only verdict derived from CampaignSummary counters (same rules as Campaign Report). */
export function campaignVerdictFromSummary(summary: CampaignSummary): CampaignResultVerdict {
  if (summary.passCount > 0) return 'PASS';
  if (summary.needsReviewCount > 0) return 'NEEDS_REVIEW';
  return 'FAIL';
}

/** Display-only recommendations derived from CampaignSummary fields. */
export function campaignRecommendationsFromSummary(summary: CampaignSummary): string[] {
  const verdict = campaignVerdictFromSummary(summary);
  const recommendations: string[] = [];
  const noCompletedExperiments =
    summary.passCount + summary.failCount + summary.needsReviewCount === 0;

  if (summary.totalRuns === 0 || noCompletedExperiments) {
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

  if (summary.bestExperimentId) {
    recommendations.push(`Best candidate: ${summary.bestExperimentId}.`);
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

type CampaignResultsViewProps = {
  summary: CampaignSummary;
};

export function CampaignResultsView({ summary }: CampaignResultsViewProps) {
  const verdict = campaignVerdictFromSummary(summary);
  const recommendations = campaignRecommendationsFromSummary(summary);

  return (
    <section className="space-y-6" data-testid="campaign-results">
      <div>
        <h2 className="text-2xl font-semibold">Campaign Results</h2>
        <p className="mt-2 text-slate-400">CampaignSummary from the latest run.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">totalRuns</dt>
            <dd data-testid="totalRuns">{summary.totalRuns}</dd>
          </div>
          <div>
            <dt className="text-slate-500">successfulRuns</dt>
            <dd data-testid="successfulRuns">{summary.passCount}</dd>
          </div>
          <div>
            <dt className="text-slate-500">failedRuns</dt>
            <dd data-testid="failedRuns">{summary.failedRuns.length}</dd>
          </div>
          <div>
            <dt className="text-slate-500">bestExperimentId</dt>
            <dd data-testid="bestExperimentId">{summary.bestExperimentId ?? 'null'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">verdict</dt>
            <dd data-testid="verdict">{verdict}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-slate-300">recommendations</h3>
          <ul
            className="mt-2 list-disc space-y-1 pl-5 text-slate-300"
            data-testid="recommendations"
          >
            {recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

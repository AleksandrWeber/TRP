import type { CampaignCandidate, CampaignSummary } from '../shared/api';
import { deduplicate } from '../shared/deduplicate';

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
    return deduplicate(recommendations);
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

  return deduplicate(recommendations);
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

      <CandidateRanking candidates={summary.candidates ?? []} winnerId={summary.bestExperimentId} />
    </section>
  );
}

function CandidateRanking({
  candidates,
  winnerId,
}: {
  candidates: readonly CampaignCandidate[];
  winnerId: string | null;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300">Candidates</h3>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table
          className="min-w-full text-left text-sm text-slate-200"
          data-testid="candidate-table"
        >
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 font-medium">Experiment</th>
              <th className="px-4 py-3 font-medium">Parameters</th>
              <th className="px-4 py-3 font-medium">Verdict</th>
              <th className="px-4 py-3 font-medium">Profit factor</th>
              <th className="px-4 py-3 font-medium">Return</th>
              <th className="px-4 py-3 font-medium">Expectancy</th>
              <th className="px-4 py-3 font-medium">Max drawdown</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-3 text-slate-500" data-testid="candidates-empty">
                  No completed candidates.
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => {
                const winner = winnerId !== null && candidate.experimentId === winnerId;
                return (
                  <tr
                    key={candidate.experimentId}
                    className="border-t border-white/10"
                    data-testid={winner ? 'candidate-winner' : 'candidate-row'}
                    data-experiment-id={candidate.experimentId}
                  >
                    <td className="px-4 py-3">
                      {candidate.rank}
                      {winner ? (
                        <span className="ml-2 rounded-full border border-emerald-400/40 px-2 py-0.5 text-xs uppercase text-emerald-200">
                          Winner
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{candidate.experimentId}</td>
                    <td className="max-w-xs break-all px-4 py-3 font-mono text-xs text-slate-300">
                      {formatParams(candidate.params)}
                    </td>
                    <td className="px-4 py-3">{candidate.verdict}</td>
                    <td className="px-4 py-3">{formatMetric(candidate.profitFactor)}</td>
                    <td className="px-4 py-3">{formatMetric(candidate.totalReturnPercent)}</td>
                    <td className="px-4 py-3">{formatMetric(candidate.expectancy)}</td>
                    <td className="px-4 py-3">{formatMetric(candidate.maxDrawdownPercent)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatMetric(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return String(value);
}

function formatParams(params: CampaignCandidate['params']): string {
  const entries = Object.entries(params);
  if (entries.length === 0) return '—';
  return entries.map(([key, value]) => `${key}=${String(value)}`).join(', ');
}

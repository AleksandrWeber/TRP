import type { ResearchAnalysis } from '../shared/api';

type CampaignAnalysisViewProps = {
  analysis: ResearchAnalysis;
};

export function CampaignAnalysisView({ analysis }: CampaignAnalysisViewProps) {
  return (
    <section className="space-y-6" data-testid="campaign-analysis">
      <div>
        <h2 className="text-2xl font-semibold">Research Analysis</h2>
        <p className="mt-2 text-slate-400">Deterministic analysis of the campaign result.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
        <h3 className="text-sm font-medium text-slate-300">Executive Summary</h3>
        <p className="mt-2 text-slate-200" data-testid="executive-summary">
          {analysis.executiveSummary}
        </p>

        <h3 className="mt-6 text-sm font-medium text-slate-300">Strengths</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5" data-testid="strengths">
          {analysis.strengths.length === 0 ? (
            <li className="text-slate-500">None</li>
          ) : (
            analysis.strengths.map((item) => <li key={item}>{item}</li>)
          )}
        </ul>

        <h3 className="mt-6 text-sm font-medium text-slate-300">Weaknesses</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5" data-testid="weaknesses">
          {analysis.weaknesses.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="mt-6 text-sm font-medium text-slate-300">Recommendations</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5" data-testid="analysis-recommendations">
          {analysis.recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="mt-6 text-sm font-medium text-slate-300">Next Hypothesis</h3>
        <p className="mt-2 text-slate-200" data-testid="next-hypothesis">
          {analysis.nextHypothesis}
        </p>
      </div>
    </section>
  );
}

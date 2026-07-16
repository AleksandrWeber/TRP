import { FormEvent, useState } from 'react';
import {
  runWalkForwardCampaign,
  type WalkForwardCampaignRequest,
  type WalkForwardCampaignSummary,
  type WalkForwardWindowResult,
} from '../shared/api';
import { campaignVerdictFromSummary } from './CampaignResultsView';

const STRATEGY_OPTIONS = ['donchian-breakout', 'ema-crossover'] as const;

export function parseParamsListJson(raw: string): WalkForwardCampaignRequest['paramsList'] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('paramsList must be a non-empty JSON array');
  }
  return parsed as WalkForwardCampaignRequest['paramsList'];
}

export function parsePositiveNumber(raw: string, fieldName: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return value;
}

export async function submitWalkForwardCampaign(input: {
  strategyId: string;
  datasetId: string;
  paramsListRaw: string;
  datasetLengthRaw: string;
  windowSizeRaw: string;
  stepSizeRaw: string;
}) {
  const datasetId = input.datasetId.trim();
  if (!datasetId) {
    throw new Error('datasetId is required');
  }

  const paramsList = parseParamsListJson(input.paramsListRaw);
  const datasetLength = parsePositiveNumber(input.datasetLengthRaw, 'datasetLength');
  const windowSize = parsePositiveNumber(input.windowSizeRaw, 'windowSize');
  const stepSize = parsePositiveNumber(input.stepSizeRaw, 'stepSize');

  return runWalkForwardCampaign({
    strategyId: input.strategyId.trim(),
    datasetId,
    paramsList,
    datasetLength,
    windowSize,
    stepSize,
  });
}

export function windowVerdict(window: WalkForwardWindowResult): string {
  if (window.error) return 'ERROR';
  if (!window.summary) return '—';
  return campaignVerdictFromSummary(window.summary);
}

type WalkForwardSummaryViewProps = {
  summary: WalkForwardCampaignSummary;
};

export function WalkForwardCampaignSummaryView({ summary }: WalkForwardSummaryViewProps) {
  return (
    <section className="space-y-6" data-testid="walk-forward-summary">
      <div>
        <h3 className="text-lg font-semibold">Walk-Forward Summary</h3>
      </div>

      <dl className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">windowCount</dt>
          <dd data-testid="windowCount">{summary.windowCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">successfulWindows</dt>
          <dd data-testid="successfulWindows">{summary.successfulWindows}</dd>
        </div>
        <div>
          <dt className="text-slate-500">failedWindows</dt>
          <dd data-testid="failedWindows">{summary.failedWindows}</dd>
        </div>
        <div>
          <dt className="text-slate-500">passCount</dt>
          <dd data-testid="passCount">{summary.passCount ?? 'null'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">needsReviewCount</dt>
          <dd data-testid="needsReviewCount">{summary.needsReviewCount ?? 'null'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">failCount</dt>
          <dd data-testid="failCount">{summary.failCount ?? 'null'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">overallVerdict</dt>
          <dd data-testid="overallVerdict">{summary.overallVerdict}</dd>
        </div>
      </dl>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm text-slate-200" data-testid="window-table">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">train range</th>
              <th className="px-4 py-3 font-medium">test range</th>
              <th className="px-4 py-3 font-medium">verdict</th>
              <th className="px-4 py-3 font-medium">bestExperimentId</th>
            </tr>
          </thead>
          <tbody>
            {summary.windows.map((window, index) => (
              <tr
                key={`${window.trainStart}-${window.testEnd}-${index}`}
                className="border-t border-white/10"
                data-testid="window-row"
              >
                <td className="px-4 py-3">
                  {window.trainStart}–{window.trainEnd}
                </td>
                <td className="px-4 py-3">
                  {window.testStart}–{window.testEnd}
                </td>
                <td className="px-4 py-3">{windowVerdict(window)}</td>
                <td className="px-4 py-3">{window.summary?.bestExperimentId ?? 'null'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function WalkForwardCampaignPage() {
  const [strategyId, setStrategyId] = useState<string>(STRATEGY_OPTIONS[0]);
  const [datasetId, setDatasetId] = useState('');
  const [paramsListRaw, setParamsListRaw] = useState('[{"channelPeriod":10}]');
  const [datasetLengthRaw, setDatasetLengthRaw] = useState('100');
  const [windowSizeRaw, setWindowSizeRaw] = useState('40');
  const [stepSizeRaw, setStepSizeRaw] = useState('20');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<WalkForwardCampaignSummary | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const result = await submitWalkForwardCampaign({
        strategyId,
        datasetId,
        paramsListRaw,
        datasetLengthRaw,
        windowSizeRaw,
        stepSizeRaw,
      });
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Walk-forward campaign failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-8" data-testid="walk-forward-campaign-page">
      <div>
        <h2 className="text-2xl font-semibold">Walk-Forward Campaign</h2>
        <p className="mt-2 text-slate-400">
          Run walk-forward windows via `POST /campaigns/run-walk-forward`.
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          data-testid="walk-forward-error"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-6"
        data-testid="walk-forward-form"
      >
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">strategy</span>
          <select
            value={strategyId}
            onChange={(e) => setStrategyId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            data-testid="strategy-select"
          >
            {STRATEGY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">dataset</span>
          <input
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            data-testid="dataset-input"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">paramsList (JSON)</span>
          <textarea
            value={paramsListRaw}
            onChange={(e) => setParamsListRaw(e.target.value)}
            required
            rows={8}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs"
            data-testid="params-input"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">datasetLength</span>
          <input
            value={datasetLengthRaw}
            onChange={(e) => setDatasetLengthRaw(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            data-testid="dataset-length-input"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">windowSize</span>
          <input
            value={windowSizeRaw}
            onChange={(e) => setWindowSizeRaw(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            data-testid="window-size-input"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">stepSize</span>
          <input
            value={stepSizeRaw}
            onChange={(e) => setStepSizeRaw(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            data-testid="step-size-input"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          data-testid="run-walk-forward-button"
        >
          {loading ? 'Running…' : 'Run Walk-Forward'}
        </button>
      </form>

      {summary && <WalkForwardCampaignSummaryView summary={summary} />}
    </section>
  );
}

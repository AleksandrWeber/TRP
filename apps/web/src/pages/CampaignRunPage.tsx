import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  api,
  campaignSummaryFromSession,
  exportCampaignHistory,
  runCampaign,
  type CampaignRunRequest,
  type Dataset,
} from '../shared/api';
import { toUserFacingError } from '../shared/mapApiError';
import { ErrorBanner, LoadingState, PageHeader } from '../shared/product-ui';
import {
  appendCampaignHistory,
  loadCampaignHistory,
  mergeCampaignHistory,
  type CampaignHistoryItem,
} from './campaign-history';
import { CampaignHistoryView } from './CampaignHistoryView';

export function parseParamsListJson(raw: string): CampaignRunRequest['paramsList'] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('paramsList must be valid JSON');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('paramsList must be a non-empty JSON array');
  }

  if (!parsed.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item))) {
    throw new Error('paramsList must be an array of objects');
  }

  return parsed as CampaignRunRequest['paramsList'];
}

export function validateCampaignRunInput(input: {
  datasetId: string;
  strategyId: string;
  paramsListRaw: string;
}): { datasetId: string; strategyId: string; paramsList: CampaignRunRequest['paramsList'] } {
  if (!input.datasetId.trim()) {
    throw new Error('Dataset ID is required.');
  }
  if (!input.strategyId.trim()) {
    throw new Error('Strategy ID is required.');
  }
  return {
    datasetId: input.datasetId.trim(),
    strategyId: input.strategyId.trim(),
    paramsList: parseParamsListJson(input.paramsListRaw),
  };
}

export async function submitCampaignRun(input: {
  datasetId: string;
  strategyId: string;
  paramsListRaw: string;
}) {
  const body = validateCampaignRunInput(input);
  return runCampaign(body);
}

export function CampaignRunPage() {
  const navigate = useNavigate();
  const [datasetId, setDatasetId] = useState('');
  const [strategyId, setStrategyId] = useState('donchian-breakout');
  const [paramsListRaw, setParamsListRaw] = useState('[{"channelPeriod":10}]');
  const [fieldErrors, setFieldErrors] = useState<{
    datasetId?: string;
    strategyId?: string;
    paramsList?: string;
  }>({});
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CampaignHistoryItem[]>([]);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    const local = loadCampaignHistory();
    setHistory(local);
    api
      .listDatasets()
      .then(setDatasets)
      .catch((err: unknown) => {
        console.error('[campaign] failed to load datasets for autocomplete', err);
      });
    api
      .listCampaignHistory()
      .then((page) => {
        const workspace = page.items.map((session) => ({
          ...campaignSummaryFromSession(session),
          sessionId: session.id,
        }));
        setHistory(mergeCampaignHistory(workspace, loadCampaignHistory()));
      })
      .catch(() => {
        setHistory(loadCampaignHistory());
      });
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const nextFieldErrors: typeof fieldErrors = {};
    if (!datasetId.trim()) nextFieldErrors.datasetId = 'Dataset ID is required.';
    if (!strategyId.trim()) nextFieldErrors.strategyId = 'Strategy ID is required.';
    try {
      parseParamsListJson(paramsListRaw);
    } catch (err) {
      nextFieldErrors.paramsList =
        err instanceof Error ? err.message : 'paramsList must be valid JSON';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setLoading(false);
      return;
    }

    setFieldErrors({});
    try {
      const summary = await submitCampaignRun({
        datasetId,
        strategyId,
        paramsListRaw,
      });
      const nextHistory = appendCampaignHistory(summary);
      setHistory(mergeCampaignHistory(history, nextHistory));
      navigate('/campaigns/results', { state: { summary } });
    } catch (err) {
      setError(toUserFacingError(err, 'Campaign run failed'));
    } finally {
      setLoading(false);
    }
  }

  async function onExport(sessionId: string, format: 'json' | 'csv') {
    setExportingId(`${sessionId}:${format}`);
    setError(null);
    try {
      const content = await exportCampaignHistory(sessionId, format);
      const blob = new Blob([content], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `campaign-${sessionId}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(toUserFacingError(err, 'Campaign export failed'));
    } finally {
      setExportingId(null);
    }
  }

  return (
    <section className="space-y-8">
      <PageHeader
        productId="campaign"
        title="Campaign Run"
        description="Run a parameter list through the existing Campaign API. History prefers workspace-backed campaign sessions when they exist."
        extraActions={[
          { to: '/campaigns/results', label: 'Results' },
          { to: '/campaigns/multi', label: 'Multi-dataset' },
          { to: '/campaigns/walk-forward', label: 'Walk-forward' },
          { to: '/lab', label: 'Lab' },
        ]}
      />

      <ErrorBanner message={error} />
      {loading ? <LoadingState label="Running campaign…" /> : null}

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-6"
        noValidate
      >
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">datasetId</span>
          <input
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
            list="campaign-dataset-ids"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
          <datalist id="campaign-dataset-ids">
            {datasets.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.symbol} · {ds.timeframe}
              </option>
            ))}
          </datalist>
          {fieldErrors.datasetId ? (
            <p className="text-xs text-red-300">{fieldErrors.datasetId}</p>
          ) : (
            <p className="text-xs text-slate-500">
              Full Dataset ID is available (with Copy) on the Lab page.
            </p>
          )}
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">strategyId</span>
          <input
            value={strategyId}
            onChange={(e) => setStrategyId(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
          />
          {fieldErrors.strategyId ? (
            <p className="text-xs text-red-300">{fieldErrors.strategyId}</p>
          ) : null}
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">paramsList (JSON)</span>
          <textarea
            value={paramsListRaw}
            onChange={(e) => setParamsListRaw(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs"
          />
          {fieldErrors.paramsList ? (
            <p className="text-xs text-red-300">{fieldErrors.paramsList}</p>
          ) : null}
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run Campaign'}
        </button>
      </form>

      <CampaignHistoryView items={history} onExport={onExport} exportingId={exportingId} />
    </section>
  );
}

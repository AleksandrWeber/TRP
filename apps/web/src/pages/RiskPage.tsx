import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  type RiskDecisionView,
  type RiskPolicyView,
  type RiskSummaryView,
} from '../shared/api';

function formatMoney(value: string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

function decisionClass(decision: string): string {
  if (decision === 'APPROVED') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (decision === 'WARNING') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  return 'border-red-500/30 bg-red-500/10 text-red-200';
}

export function RiskPage() {
  const [policies, setPolicies] = useState<RiskPolicyView[]>([]);
  const [decisions, setDecisions] = useState<RiskDecisionView[]>([]);
  const [summary, setSummary] = useState<RiskSummaryView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [policyList, decisionList, summaryView] = await Promise.all([
        api.listRiskPolicies(),
        api.listRiskDecisions(),
        api.getRiskSummary(),
      ]);
      setPolicies(policyList);
      setDecisions(decisionList);
      setSummary(summaryView);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load risk data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rejected = useMemo(() => decisions.filter((d) => d.decision === 'REJECTED'), [decisions]);
  const warnings = useMemo(() => decisions.filter((d) => d.decision === 'WARNING'), [decisions]);

  async function togglePolicy(policy: RiskPolicyView) {
    setTogglingId(policy.id);
    setError(null);
    try {
      const updated = await api.updateRiskPolicy(policy.id, { enabled: !policy.enabled });
      setPolicies((current) => {
        const without = current.filter(
          (p) =>
            p.name !== updated.name || (p.portfolioId === null && updated.portfolioId !== null),
        );
        const next = without.filter((p) => p.id !== policy.id && p.id !== updated.id);
        return [...next, updated].sort((a, b) => a.priority - b.priority);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update policy');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trading</p>
          <h2 className="mt-1 text-2xl font-semibold">Risk</h2>
          <p className="mt-2 text-slate-400">
            Policy gatekeeper — decisions, exposures, and trading limits before execution.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-sky-400"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {loading && !summary ? <p className="text-sm text-slate-500">Loading risk…</p> : null}

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Exposure" value={formatMoney(summary.exposure)} />
          <Metric label="Margin usage" value={`${formatMoney(summary.marginUsage)}%`} />
          <Metric label="Open positions" value={String(summary.openPositionCount)} />
          <Metric label="Available margin" value={formatMoney(summary.availableMargin)} />
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-lg font-medium text-slate-100">Current policies</h3>
        {policies.length === 0 && !loading ? (
          <p className="text-sm text-slate-500">No policies configured.</p>
        ) : null}
        {policies.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Priority</th>
                  <th className="px-3 py-2 font-medium">Enabled</th>
                  <th className="px-3 py-2 font-medium">Configuration</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((policy) => (
                  <tr key={policy.id} className="border-b border-white/5">
                    <td className="px-3 py-2 font-mono text-slate-200">{policy.name}</td>
                    <td className="px-3 py-2 text-slate-300">{policy.priority}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded border px-2 py-0.5 text-xs ${
                          policy.enabled
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                            : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                        }`}
                      >
                        {policy.enabled ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-3 py-2 font-mono text-xs text-slate-400">
                      {JSON.stringify(policy.configuration)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={togglingId === policy.id}
                        onClick={() => void togglePolicy(policy)}
                        className="rounded border border-white/15 px-2 py-1 text-xs text-slate-200 hover:bg-white/5 disabled:opacity-50"
                      >
                        {policy.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <DecisionSection
        title="Risk decisions"
        decisions={decisions}
        empty="No risk decisions yet."
      />
      <DecisionSection
        title="Rejected orders"
        decisions={rejected}
        empty="No rejected decisions."
      />
      <DecisionSection title="Warnings" decisions={warnings} empty="No warning decisions." />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-medium text-slate-100">{value}</p>
    </div>
  );
}

function DecisionSection({
  title,
  decisions,
  empty,
}: {
  title: string;
  decisions: RiskDecisionView[];
  empty: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-slate-100">{title}</h3>
      {decisions.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Decision</th>
                <th className="px-3 py-2 font-medium">Score</th>
                <th className="px-3 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Reason</th>
                <th className="px-3 py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((decision) => (
                <tr key={decision.id} className="border-b border-white/5">
                  <td className="px-3 py-2">
                    <span
                      className={`rounded border px-2 py-0.5 text-xs ${decisionClass(decision.decision)}`}
                    >
                      {decision.decision}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{decision.score}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/trading/orders/${decision.orderId}`}
                      className="font-mono text-sky-300 hover:underline"
                    >
                      {decision.orderId.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="max-w-md truncate px-3 py-2 text-slate-400">{decision.reason}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {new Date(decision.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

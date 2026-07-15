import { useEffect, useState } from 'react';

type ApiHealth = {
  status: string;
  timestamp: string;
  services: {
    api: string;
    database: string;
  };
};

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function HomePage() {
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${apiUrl}/health`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<ApiHealth>;
      })
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Research Operating System</h2>
        <p className="mt-2 max-w-2xl text-slate-400">
          Sprint 0 is live. Open{' '}
          <a href="/research" className="text-emerald-300 underline">
            Research
          </a>{' '}
          to import OHLCV, run the EMA crossover backtest, and view validation reports.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">API health</h3>
        {error && <p className="mt-3 text-sm text-red-300">Could not reach API: {error}</p>}
        {!error && !health && <p className="mt-3 text-sm text-slate-400">Checking…</p>}
        {health && (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-400">Status</dt>
              <dd className="font-medium">{health.status}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Database</dt>
              <dd className="font-medium">{health.services.database}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-400">Checked at</dt>
              <dd className="font-medium">{health.timestamp}</dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
}

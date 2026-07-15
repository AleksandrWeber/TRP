import { FormEvent, useEffect, useState } from 'react';
import { api, statusColor, type KnowledgeEntry } from '../shared/api';

export function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load(query?: string) {
    try {
      setEntries(await api.listKnowledge(query ? { q: query } : undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    void load(q);
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold">Knowledge Base</h2>
        <p className="mt-2 text-slate-400">
          Implementation 014 — validated experiments stored as reusable knowledge
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title or description"
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
        >
          Search
        </button>
      </form>

      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium">{entry.title}</h3>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${statusColor(entry.validationStatus)}`}
              >
                v{entry.version} · {entry.validationStatus.replace('_', ' ')}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{entry.description}</p>
            <p className="mt-2 text-xs text-slate-500">
              {entry.category} · {entry.type} · {entry.tags.join(', ')}
            </p>
          </li>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-slate-500">No knowledge entries yet.</p>
        )}
      </ul>
    </section>
  );
}

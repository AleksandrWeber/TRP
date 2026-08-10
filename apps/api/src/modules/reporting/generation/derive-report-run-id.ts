/**
 * RC-24 Epic 4 — Deterministic report-run id helper.
 */

/** Stable non-crypto hash for deterministic reportRunId derivation. */
export function stableHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function deriveReportRunId(parts: readonly string[]): string {
  return `run-${stableHash(parts.join('|'))}`;
}

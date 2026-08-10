/**
 * RC-25 Epic 5 — derive stable Market Profile identities (deterministic; no crypto).
 */

export function deriveMarketProfileId(targetId: string, version: number): string {
  return `mkt-profile:${targetId}:v${version}`;
}

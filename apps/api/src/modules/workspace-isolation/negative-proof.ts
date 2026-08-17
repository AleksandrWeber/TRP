/**
 * V3-S06-a negative-proof helpers for isolation regression tests.
 * S06 verifies access that must fail — not only allowed paths.
 */

/** Assert a foreign-workspace response body does not embed known B-side facts. */
export function expectNoForeignPayload(payload: unknown, foreignFacts: readonly string[]): void {
  const serialized = JSON.stringify(payload ?? {});
  for (const fact of foreignFacts) {
    if (fact && serialized.includes(fact)) {
      throw new Error(`Foreign isolation leak: payload contains "${fact}"`);
    }
  }
}

/** Fail-closed membership: foreign workspace resolves to null, not B. */
export function expectForeignWorkspaceDenied(
  resolved: string | null,
  foreignWorkspaceId: string,
): void {
  if (resolved === foreignWorkspaceId) {
    throw new Error('Foreign workspace was resolved as accessible.');
  }
  if (resolved !== null) {
    throw new Error(`Expected null for foreign workspace; received "${resolved}".`);
  }
}

/** Standard proof story label for matrix reports. */
export const ISOLATION_PROOF_STORY = Object.freeze([
  'Workspace A',
  'attempt',
  'Workspace B',
  'Denied',
  'Regression test',
] as const);

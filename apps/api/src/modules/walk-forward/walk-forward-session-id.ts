/**
 * Branded WalkForwardSession identity (US119).
 */
export type WalkForwardSessionId = string & { readonly __brand: 'WalkForwardSessionId' };

export function toWalkForwardSessionId(value: string): WalkForwardSessionId {
  return value as WalkForwardSessionId;
}

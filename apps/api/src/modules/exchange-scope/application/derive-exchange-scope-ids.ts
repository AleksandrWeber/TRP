/**
 * RC-27 Epic 3 — derive stable Exchange Scope identities (deterministic; no crypto).
 */

export function deriveExchangeScopeId(venueCode: string): string {
  return `exchange-scope:${venueCode.trim().toLowerCase()}`;
}

export function deriveTradingAccountBindingId(parts: readonly string[]): string {
  return `tab:${parts.map((p) => p.trim() || '_').join(':')}`;
}

export function deriveAdapterBindingContextId(parts: readonly string[]): string {
  return `abc:${parts.map((p) => p.trim() || '_').join(':')}`;
}

export function deriveExchangeRiskPolicyId(parts: readonly string[]): string {
  return `erp:${parts.map((p) => p.trim() || '_').join(':')}`;
}

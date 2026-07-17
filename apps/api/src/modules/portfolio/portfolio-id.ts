/**
 * Branded Portfolio identity (US120).
 */
export type PortfolioId = string & { readonly __brand: 'PortfolioId' };

export function toPortfolioId(value: string): PortfolioId {
  return value as PortfolioId;
}

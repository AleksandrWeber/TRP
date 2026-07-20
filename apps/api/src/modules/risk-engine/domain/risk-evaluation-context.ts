/**
 * Order snapshot consumed by Risk Engine (read-only; US207).
 */
export type RiskOrderRequest = Readonly<{
  id: string;
  portfolioId: string;
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  requestedPrice: string | null;
  /** Optional mark/reference price when requestedPrice is absent (e.g. MARKET). */
  referencePrice?: string | null;
}>;

/**
 * Active order snapshot for duplicate detection.
 */
export type RiskActiveOrder = Readonly<{
  id: string;
  symbol: string;
  side: string;
  type: string;
  quantity: string;
  requestedPrice: string | null;
  status: string;
}>;

/**
 * Open position snapshot for exposure / limit checks.
 */
export type RiskOpenPosition = Readonly<{
  id: string;
  symbol: string;
  side: string;
  quantity: string;
  exposure: string;
}>;

/**
 * Portfolio financial snapshot for capital / margin / loss checks.
 */
export type RiskPortfolioSnapshot = Readonly<{
  cash: string;
  equity: string;
  availableMargin: string;
  usedMargin: string;
  realizedPnL: string;
}>;

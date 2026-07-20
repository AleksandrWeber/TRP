/**
 * Declared adapter capabilities (US209).
 * Adapters declare what they support; Trading Core never infers this.
 */
export type ExchangeCapabilities = Readonly<{
  supportsSpot: boolean;
  supportsMargin: boolean;
  supportsFutures: boolean;
  supportsWebSocket: boolean;
  supportsMarketOrders: boolean;
  supportsLimitOrders: boolean;
  supportsOCO: boolean;
  supportsReduceOnly: boolean;
}>;

export function createExchangeCapabilities(input: ExchangeCapabilities): ExchangeCapabilities {
  return Object.freeze({ ...input });
}

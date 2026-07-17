/**
 * Branded trading instrument symbol (US115).
 * Opaque string — e.g. "BTCUSDT", "ETHUSDT".
 */
export type Instrument = string & { readonly __brand: 'Instrument' };

export function toInstrument(value: string): Instrument {
  return value as Instrument;
}

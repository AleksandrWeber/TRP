import { toInstrument } from '../../../market-data/instrument';
import type { InstrumentPrecisionMetadata } from '../../ports/live-market-connector';
import { BINANCE_SPOT_SOURCE_ID } from './binance-spot.source';
import type { BinanceExchangeInfoResponse, BinanceExchangeSymbol } from './binance-rest.types';

/**
 * Map Binance exchangeInfo symbol → canonical precision metadata (US132).
 * Raw Binance fields do not leave this adapter helper.
 */
export function mapBinanceSymbolToMetadata(
  symbol: BinanceExchangeSymbol,
): InstrumentPrecisionMetadata {
  const name = String(symbol.symbol ?? '')
    .trim()
    .toUpperCase();
  if (name === '') {
    throw new Error('Binance exchangeInfo symbol is missing symbol');
  }
  const baseAsset = String(symbol.baseAsset ?? '').trim();
  const quoteAsset = String(symbol.quoteAsset ?? '').trim();
  if (baseAsset === '' || quoteAsset === '') {
    throw new Error(`Binance exchangeInfo incomplete for ${name}`);
  }

  const filters = symbol.filters ?? [];
  const priceFilter = filters.find((f) => f.filterType === 'PRICE_FILTER');
  const lotFilter = filters.find((f) => f.filterType === 'LOT_SIZE');
  const tickSize = String(priceFilter?.tickSize ?? '').trim();
  const stepSize = String(lotFilter?.stepSize ?? '').trim();
  if (tickSize === '' || stepSize === '') {
    throw new Error(`Binance precision filters missing for ${name}`);
  }

  return Object.freeze({
    sourceId: BINANCE_SPOT_SOURCE_ID,
    instrument: toInstrument(name),
    baseAsset,
    quoteAsset,
    pricePrecision: decimalPlaces(tickSize),
    quantityPrecision: decimalPlaces(stepSize),
    tickSize,
    stepSize,
  });
}

export function findBinanceSymbol(
  info: BinanceExchangeInfoResponse,
  instrument: string,
): BinanceExchangeSymbol {
  const wanted = instrument.trim().toUpperCase();
  const symbols = info.symbols;
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error('Binance exchangeInfo response is missing symbols');
  }
  const found = symbols.find((row) => String(row.symbol ?? '').toUpperCase() === wanted);
  if (!found) {
    throw new Error(`unsupported instrument: ${wanted}`);
  }
  if (found.status !== undefined && found.status !== 'TRADING') {
    throw new Error(`instrument not tradable on Binance Spot: ${wanted} (status=${found.status})`);
  }
  return found;
}

function decimalPlaces(step: string): number {
  if (!/^\d+(\.\d+)?$/.test(step)) {
    throw new Error(`invalid Binance step size: ${step}`);
  }
  const trimmed = step.replace(/0+$/, '').replace(/\.$/, '');
  const dot = trimmed.indexOf('.');
  return dot < 0 ? 0 : trimmed.length - dot - 1;
}

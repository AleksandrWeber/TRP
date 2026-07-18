import { createHash } from 'node:crypto';
import {
  createFinancialPrecision,
  FinancialDecimal,
  FinancialRounding,
  type FinancialPrecision,
} from '../financial';

export enum PaperMarketFillPolicy {
  ALL_OR_NONE = 'all_or_none',
}

export enum PaperLimitFillPolicy {
  CROSS_THEN_ALL_OR_NONE = 'cross_then_all_or_none',
}

export type PaperFillConfiguration = Readonly<{
  mode: 'paper';
  configurationId: string;
  version: number;
  hash: string;
  feeRateBps: string;
  slippageBps: string;
  precision: FinancialPrecision;
  marketFillPolicy: PaperMarketFillPolicy;
  limitFillPolicy: PaperLimitFillPolicy;
  partialFills: false;
}>;

export type PaperRoundingContext = Readonly<{
  configurationId: string;
  configurationVersion: number;
  configurationHash: string;
  priceScale: number;
  quantityScale: number;
  moneyScale: number;
  feeScale: number;
  rounding: FinancialRounding;
}>;

export function createPaperFillConfiguration(
  input: Omit<PaperFillConfiguration, 'hash' | 'partialFills'> & {
    partialFills?: false;
  },
): PaperFillConfiguration {
  if (input.mode !== 'paper') throw new Error('paper fill configuration mode must be paper');
  const configurationId = required(input.configurationId, 'configuration id');
  if (!Number.isSafeInteger(input.version) || input.version < 1) {
    throw new Error('configuration version must be a positive integer');
  }
  const feeRateBps = basisPoints(input.feeRateBps, 'fee rate');
  const slippageBps = basisPoints(input.slippageBps, 'slippage');
  const precision = createFinancialPrecision(input.precision);
  if (input.marketFillPolicy !== PaperMarketFillPolicy.ALL_OR_NONE) {
    throw new Error('unsupported paper market fill policy');
  }
  if (input.limitFillPolicy !== PaperLimitFillPolicy.CROSS_THEN_ALL_OR_NONE) {
    throw new Error('unsupported paper limit fill policy');
  }
  if (input.partialFills !== undefined && input.partialFills !== false) {
    throw new Error('M2 paper configuration does not support partial fills');
  }

  const semantic = Object.freeze({
    mode: 'paper' as const,
    configurationId,
    version: input.version,
    feeRateBps,
    slippageBps,
    precision,
    marketFillPolicy: input.marketFillPolicy,
    limitFillPolicy: input.limitFillPolicy,
    partialFills: false as const,
  });
  return Object.freeze({
    ...semantic,
    hash: sha256(stableStringify(semantic)),
  });
}

export function paperRoundingContext(config: PaperFillConfiguration): PaperRoundingContext {
  return Object.freeze({
    configurationId: config.configurationId,
    configurationVersion: config.version,
    configurationHash: config.hash,
    priceScale: config.precision.priceScale,
    quantityScale: config.precision.quantityScale,
    moneyScale: config.precision.moneyScale,
    feeScale: config.precision.feeScale,
    rounding: config.precision.rounding,
  });
}

export function assertPaperFillConfiguration(
  config: PaperFillConfiguration,
): PaperFillConfiguration {
  const verified = createPaperFillConfiguration({
    mode: config.mode,
    configurationId: config.configurationId,
    version: config.version,
    feeRateBps: config.feeRateBps,
    slippageBps: config.slippageBps,
    precision: config.precision,
    marketFillPolicy: config.marketFillPolicy,
    limitFillPolicy: config.limitFillPolicy,
    partialFills: config.partialFills,
  });
  if (verified.hash !== config.hash) throw new Error('paper fill configuration hash mismatch');
  return config;
}

export function paperExecutionContextHash(input: {
  configuration: PaperFillConfiguration;
  orderIntentHash: string;
  marketEventId: string;
  marketSequence: number;
}): string {
  if (!Number.isSafeInteger(input.marketSequence) || input.marketSequence < 0) {
    throw new Error('market sequence must be a non-negative integer');
  }
  return sha256(
    stableStringify({
      configurationId: input.configuration.configurationId,
      configurationVersion: input.configuration.version,
      configurationHash: input.configuration.hash,
      orderIntentHash: required(input.orderIntentHash, 'order intent hash'),
      marketEventId: required(input.marketEventId, 'market event id'),
      marketSequence: input.marketSequence,
    }),
  );
}

export const M2_PAPER_FILL_CONFIGURATION = createPaperFillConfiguration({
  mode: 'paper',
  configurationId: 'm2-paper-fill',
  version: 1,
  feeRateBps: '10',
  slippageBps: '5',
  precision: {
    priceScale: 8,
    quantityScale: 8,
    moneyScale: 8,
    feeScale: 8,
    rounding: FinancialRounding.HALF_EVEN,
  },
  marketFillPolicy: PaperMarketFillPolicy.ALL_OR_NONE,
  limitFillPolicy: PaperLimitFillPolicy.CROSS_THEN_ALL_OR_NONE,
});

function basisPoints(value: string, label: string): string {
  const normalized = FinancialDecimal.from(value).assertNonNegative(label);
  if (normalized.compare('10000') > 0) throw new Error(`${label} basis points cannot exceed 10000`);
  return normalized.toString();
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === '') throw new Error(`${label} is required`);
  return normalized;
}

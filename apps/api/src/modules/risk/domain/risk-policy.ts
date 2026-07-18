import { createHash } from 'node:crypto';
import { FinancialDecimal } from '../../financial';

export type BaselineRiskPolicy = Readonly<{
  policyId: string;
  version: number;
  hash: string;
  mode: 'paper';
  allowedInstruments: ReadonlyArray<string>;
  allowedSides: ReadonlyArray<'buy' | 'sell'>;
  allowedOrderTypes: ReadonlyArray<'market' | 'limit'>;
  maxOrderNotional: string;
  maxMarketAgeMs: number;
  decisionTtlMs: number;
}>;

export function createBaselineRiskPolicy(
  input: Omit<BaselineRiskPolicy, 'hash' | 'mode'> & { mode?: 'paper' },
): BaselineRiskPolicy {
  if (input.mode !== undefined && input.mode !== 'paper') {
    throw new Error('M2 baseline Risk Policy mode must be paper');
  }
  if (!Number.isSafeInteger(input.version) || input.version < 1) {
    throw new Error('Risk Policy version must be a positive integer');
  }
  const allowedInstruments = normalizedSet(input.allowedInstruments, 'allowed instruments');
  const allowedSides = normalizedEnumSet(input.allowedSides, ['buy', 'sell'], 'allowed sides');
  const allowedOrderTypes = normalizedEnumSet(
    input.allowedOrderTypes,
    ['market', 'limit'],
    'allowed order types',
  );
  const maxOrderNotional = FinancialDecimal.from(input.maxOrderNotional)
    .assertPositive('maximum order notional')
    .toString();
  positiveInteger(input.maxMarketAgeMs, 'maximum market age');
  positiveInteger(input.decisionTtlMs, 'decision TTL');

  const semantic = Object.freeze({
    policyId: required(input.policyId, 'policy id'),
    version: input.version,
    mode: 'paper' as const,
    allowedInstruments,
    allowedSides,
    allowedOrderTypes,
    maxOrderNotional,
    maxMarketAgeMs: input.maxMarketAgeMs,
    decisionTtlMs: input.decisionTtlMs,
  });
  return Object.freeze({
    ...semantic,
    hash: createHash('sha256').update(stableRiskStringify(semantic)).digest('hex'),
  });
}

export const M2_BASELINE_RISK_POLICY = createBaselineRiskPolicy({
  policyId: 'm2-baseline-paper-risk',
  version: 1,
  allowedInstruments: ['BTCUSDT', 'ETHUSDT'],
  allowedSides: ['buy', 'sell'],
  allowedOrderTypes: ['market', 'limit'],
  maxOrderNotional: '100000',
  maxMarketAgeMs: 5000,
  decisionTtlMs: 30000,
});

export function stableRiskStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableRiskStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableRiskStringify(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function normalizedSet(values: ReadonlyArray<string>, label: string): ReadonlyArray<string> {
  const normalized = [...new Set(values.map((value) => required(value, label)))].sort();
  if (normalized.length === 0) throw new Error(`${label} cannot be empty`);
  return Object.freeze(normalized);
}

function normalizedEnumSet<T extends string>(
  values: ReadonlyArray<T>,
  allowed: ReadonlyArray<T>,
  label: string,
): ReadonlyArray<T> {
  if (values.length === 0 || values.some((value) => !allowed.includes(value))) {
    throw new Error(`${label} are invalid`);
  }
  return Object.freeze([...new Set(values)].sort());
}

function positiveInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${label} must be positive`);
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === '') throw new Error(`${label} is required`);
  return normalized;
}

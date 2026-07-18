import { createHash } from 'node:crypto';
import { FinancialDecimal, roundFee, roundMoney, roundPrice, roundQuantity } from '../financial';
import type { PaperFillConfiguration } from './paper-fill-configuration';

const BPS_DENOMINATOR = '10000';

export type PaperMatchSide = 'buy' | 'sell';
export type PaperMatchType = 'market' | 'limit';

export type PaperFillFact = Readonly<{
  adapterFillId: string;
  sequence: number;
  instrument: string;
  side: PaperMatchSide;
  price: string;
  quantity: string;
  grossNotional: string;
  fee: string;
  occurredAt: string;
}>;

export type PaperMatchInput = Readonly<{
  adapterOrderId: string;
  executionContextHash: string;
  instrument: string;
  side: PaperMatchSide;
  type: PaperMatchType;
  quantity: string;
  limitPrice: string | null;
  referencePrice: string;
  occurredAt: string;
  configuration: PaperFillConfiguration;
}>;

export type PaperMatchResult =
  Readonly<{ outcome: 'filled'; fill: PaperFillFact }> | Readonly<{ outcome: 'acknowledged' }>;

/**
 * Deterministic paper matching (US168 market / US169 limit).
 * Pure function of the versioned configuration and the referenced market
 * checkpoint. It performs no I/O and mutates no domain or accounting state.
 */
export function matchPaperOrder(input: PaperMatchInput): PaperMatchResult {
  const precision = input.configuration.precision;
  const reference = roundPrice(input.referencePrice, precision).assertPositive('reference price');
  const quantity = roundQuantity(input.quantity, precision).assertPositive('order quantity');
  const slipped = applySlippage(reference, input.side, input.configuration.slippageBps);

  if (input.type === 'limit') {
    const limit = roundPrice(required(input.limitPrice, 'limit price'), precision).assertPositive(
      'limit price',
    );
    if (!crosses(input.side, reference, limit)) {
      return Object.freeze({ outcome: 'acknowledged' });
    }
    const price = boundedLimitPrice(input.side, slipped, limit, precision);
    return filled(input, price, quantity);
  }

  return filled(input, roundPrice(slipped, precision), quantity);
}

function filled(
  input: PaperMatchInput,
  price: FinancialDecimal,
  quantity: FinancialDecimal,
): PaperMatchResult {
  const precision = input.configuration.precision;
  const grossNotional = roundMoney(price.times(quantity), precision).assertPositive(
    'gross notional',
  );
  const fee = roundFee(
    grossNotional.times(input.configuration.feeRateBps).dividedBy(BPS_DENOMINATOR),
    precision,
  ).assertNonNegative('fee');
  return Object.freeze({
    outcome: 'filled',
    fill: Object.freeze({
      adapterFillId: deterministicFillId(input.adapterOrderId, input.executionContextHash, 1),
      sequence: 1,
      instrument: input.instrument,
      side: input.side,
      price: price.toString(),
      quantity: quantity.toString(),
      grossNotional: grossNotional.toString(),
      fee: fee.toString(),
      occurredAt: input.occurredAt,
    }),
  });
}

function applySlippage(
  reference: FinancialDecimal,
  side: PaperMatchSide,
  slippageBps: string,
): FinancialDecimal {
  const factor = FinancialDecimal.from(slippageBps).dividedBy(BPS_DENOMINATOR);
  return side === 'buy'
    ? reference.times(FinancialDecimal.from('1').plus(factor))
    : reference.times(FinancialDecimal.from('1').minus(factor));
}

function crosses(
  side: PaperMatchSide,
  reference: FinancialDecimal,
  limit: FinancialDecimal,
): boolean {
  return side === 'buy' ? reference.compare(limit) <= 0 : reference.compare(limit) >= 0;
}

/**
 * A buy never pays above its limit; a sell never sells below its limit.
 */
function boundedLimitPrice(
  side: PaperMatchSide,
  slipped: FinancialDecimal,
  limit: FinancialDecimal,
  precision: PaperFillConfiguration['precision'],
): FinancialDecimal {
  const bounded = side === 'buy' ? min(slipped, limit) : max(slipped, limit);
  return roundPrice(bounded, precision);
}

function min(a: FinancialDecimal, b: FinancialDecimal): FinancialDecimal {
  return a.compare(b) <= 0 ? a : b;
}

function max(a: FinancialDecimal, b: FinancialDecimal): FinancialDecimal {
  return a.compare(b) >= 0 ? a : b;
}

function deterministicFillId(
  adapterOrderId: string,
  executionContextHash: string,
  sequence: number,
): string {
  const hash = createHash('sha256')
    .update(`${adapterOrderId}:${executionContextHash}:${sequence}`)
    .digest('hex')
    .slice(0, 24);
  return `fill_${hash}`;
}

function required(value: string | null, label: string): string {
  if (value === null || value.trim() === '') throw new Error(`${label} is required`);
  return value;
}

import { describe, expect, it } from 'vitest';
import { FinancialRounding } from '../financial';
import {
  PaperLimitFillPolicy,
  PaperMarketFillPolicy,
  assertPaperFillConfiguration,
  createPaperFillConfiguration,
  paperExecutionContextHash,
  paperRoundingContext,
} from './paper-fill-configuration';

function config(version = 1, slippageBps = '5') {
  return createPaperFillConfiguration({
    mode: 'paper',
    configurationId: 'paper-config-us167',
    version,
    feeRateBps: '10',
    slippageBps,
    precision: {
      priceScale: 8,
      quantityScale: 6,
      moneyScale: 8,
      feeScale: 8,
      rounding: FinancialRounding.HALF_EVEN,
    },
    marketFillPolicy: PaperMarketFillPolicy.ALL_OR_NONE,
    limitFillPolicy: PaperLimitFillPolicy.CROSS_THEN_ALL_OR_NONE,
  });
}

describe('US167 — versioned deterministic Paper Fill configuration', () => {
  it('creates a stable ID/version/hash for identical execution semantics', () => {
    const first = config();
    const replay = config();
    expect(replay).toEqual(first);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.precision)).toBe(true);
    expect(assertPaperFillConfiguration(first)).toBe(first);
  });

  it('changes identity when versioned semantics change and rejects forged history', () => {
    expect(config(2).hash).not.toBe(config(1).hash);
    expect(config(1, '6').hash).not.toBe(config(1, '5').hash);
    expect(() => assertPaperFillConfiguration({ ...config(), hash: 'forged' })).toThrow(
      /hash mismatch/,
    );
    expect(() =>
      createPaperFillConfiguration({
        ...config(),
        mode: 'live' as never,
        partialFills: false,
      }),
    ).toThrow(/mode must be paper/);
  });

  it('replays an identical ordered market context deterministically with explicit rounding', () => {
    const configuration = config();
    const input = {
      configuration,
      orderIntentHash: 'intent-hash-us167',
      marketEventId: 'market-event-us167',
      marketSequence: 77,
    };
    expect(paperExecutionContextHash(input)).toBe(paperExecutionContextHash(input));
    expect(paperRoundingContext(configuration)).toEqual({
      configurationId: 'paper-config-us167',
      configurationVersion: 1,
      configurationHash: configuration.hash,
      priceScale: 8,
      quantityScale: 6,
      moneyScale: 8,
      feeScale: 8,
      rounding: FinancialRounding.HALF_EVEN,
    });
  });
});

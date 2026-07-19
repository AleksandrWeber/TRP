import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { MarketDataCacheModule } from './market-data-cache.module';
import {
  MARKET_CACHE_CANDLES_TTL_ENV_VAR,
  MARKET_CACHE_ENABLED_ENV_VAR,
  MARKET_CACHE_TICKER_TTL_ENV_VAR,
  MARKET_DATA_CACHE_CONFIG,
  type MarketDataCacheConfig,
} from './market-data-cache.config';
import { MarketDataCacheService } from './market-data-cache.service';

const ENV_VARS = [
  MARKET_CACHE_ENABLED_ENV_VAR,
  MARKET_CACHE_TICKER_TTL_ENV_VAR,
  MARKET_CACHE_CANDLES_TTL_ENV_VAR,
] as const;

const ORIGINAL_ENV: Record<string, string | undefined> = Object.fromEntries(
  ENV_VARS.map((name) => [name, process.env[name]]),
);

afterEach(() => {
  for (const name of ENV_VARS) {
    if (ORIGINAL_ENV[name] === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = ORIGINAL_ENV[name];
    }
  }
});

async function bootConfig(env: Partial<Record<(typeof ENV_VARS)[number], string>>) {
  for (const name of ENV_VARS) {
    const value = env[name];
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  const moduleRef = await Test.createTestingModule({
    // Mirrors AppModule: a global ConfigModule provides ConfigService.
    // ignoreEnvFile so only process.env (controlled here) is read.
    imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), MarketDataCacheModule],
  }).compile();

  return {
    config: moduleRef.get<MarketDataCacheConfig>(MARKET_DATA_CACHE_CONFIG),
    service: moduleRef.get(MarketDataCacheService),
  };
}

describe('MarketDataCacheModule (US008)', () => {
  it('boots with defaults when the env vars are unset', async () => {
    const { config, service } = await bootConfig({});
    expect(config).toEqual({ enabled: true, tickerTtlMs: 5000, candlesTtlMs: 60_000 });
    expect(service.stats()).toMatchObject({ enabled: true, hits: 0, misses: 0, providerCalls: 0 });
  });

  it('applies env-driven TTL overrides', async () => {
    const { config } = await bootConfig({
      MARKET_CACHE_TICKER_TTL: '2',
      MARKET_CACHE_CANDLES_TTL: '30',
    });
    expect(config).toMatchObject({ tickerTtlMs: 2000, candlesTtlMs: 30_000 });
  });

  it('disables the cache via MARKET_CACHE_ENABLED=false', async () => {
    const { config, service } = await bootConfig({ MARKET_CACHE_ENABLED: 'false' });
    expect(config.enabled).toBe(false);
    expect(service.stats().enabled).toBe(false);
  });

  it('fails bootstrap on an invalid TTL', async () => {
    await expect(bootConfig({ MARKET_CACHE_TICKER_TTL: 'fast' })).rejects.toThrow(
      /Invalid MARKET_CACHE_TICKER_TTL/,
    );
  });

  it('fails bootstrap on an invalid enabled flag', async () => {
    await expect(bootConfig({ MARKET_CACHE_ENABLED: 'maybe' })).rejects.toThrow(
      /Invalid MARKET_CACHE_ENABLED/,
    );
  });
});

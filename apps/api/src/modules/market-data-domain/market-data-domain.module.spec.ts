import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { MarketDataDomainModule } from './market-data-domain.module';
import { MarketDataProviderRegistry } from './ports/market-data-provider-registry';

const ORIGINAL_VALUE = process.env.MARKET_DATA_PROVIDER;

async function bootRegistry(envValue: string | undefined): Promise<MarketDataProviderRegistry> {
  if (envValue === undefined) {
    delete process.env.MARKET_DATA_PROVIDER;
  } else {
    process.env.MARKET_DATA_PROVIDER = envValue;
  }

  const moduleRef = await Test.createTestingModule({
    // Mirrors AppModule: a global ConfigModule provides ConfigService.
    // ignoreEnvFile so only process.env (controlled here) is read.
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      MarketDataDomainModule,
    ],
  }).compile();

  return moduleRef.get(MarketDataProviderRegistry);
}

afterEach(() => {
  if (ORIGINAL_VALUE === undefined) {
    delete process.env.MARKET_DATA_PROVIDER;
  } else {
    process.env.MARKET_DATA_PROVIDER = ORIGINAL_VALUE;
  }
});

describe('MarketDataDomainModule provider selection (US007)', () => {
  it('registers both providers and defaults to mock when unset', async () => {
    const registry = await bootRegistry(undefined);

    expect(registry.list()).toEqual(['mock', 'binance']);
    expect(registry.getActive().id).toBe('mock');
  });

  it('activates the Binance provider when MARKET_DATA_PROVIDER=binance', async () => {
    const registry = await bootRegistry('binance');

    expect(registry.getActive().id).toBe('binance');
    expect(registry.list()).toEqual(['mock', 'binance']);
  });

  it('keeps the mock provider active when MARKET_DATA_PROVIDER=mock', async () => {
    const registry = await bootRegistry('mock');

    expect(registry.getActive().id).toBe('mock');
  });

  it('fails bootstrap on an unknown provider id', async () => {
    await expect(bootRegistry('binanse')).rejects.toThrow(/Unknown MARKET_DATA_PROVIDER/);
  });
});

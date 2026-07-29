import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mapBinanceBookTickerToDraft } from '../../modules/live-market-data/connectors/binance/map-binance-book-ticker';
import { createMarkPriceEvent } from '../../modules/live-market-data/domain/mark-price-event';
import { PaperTradingController } from '../../modules/paper-trading-engine/paper-trading.controller';
import { PaperTradingService } from '../../modules/paper-trading-engine/paper-trading.service';
import { ProductionController } from '../../modules/production/production.controller';

const API_ROOT = join(process.cwd(), 'src');

describe('M3 E12 — architecture and deterministic value gates', () => {
  it('exposes legacy production data as read-only and removes the Stage-1 execution adapter', () => {
    expect(ProductionController.prototype).not.toHaveProperty('deploy');
    expect(ProductionController.prototype).not.toHaveProperty('tick');
    expect(ProductionController.prototype).not.toHaveProperty('stop');
    expect(ProductionController.prototype).toHaveProperty('listDeployments');
    expect(ProductionController.prototype).toHaveProperty('listExecutions');
    expect(existsSync(join(API_ROOT, 'modules/production/adapters/paper-binance.adapter.ts'))).toBe(
      false,
    );
    expect(
      readFileSync(join(API_ROOT, 'modules/production/production.service.ts'), 'utf8'),
    ).not.toMatch(
      /productionPosition\.(create|update)|execution\.create|signal\.create|submitOrder|fetchKlines/,
    );
  });

  it('removes legacy paper execution endpoints so direct fills cannot bypass the canonical engine', () => {
    expect(PaperTradingController.prototype).not.toHaveProperty('executeTrade');
    expect(PaperTradingService.prototype).not.toHaveProperty('executeTrade');
    expect(
      readFileSync(
        join(API_ROOT, 'modules/paper-trading-engine/paper-trading.controller.ts'),
        'utf8',
      ),
    ).not.toMatch(/@Post\('sessions\/:id\/orders'\)/);
  });

  it('uses exact decimal strings for canonical marks and exact book midpoint arithmetic', () => {
    expect(() =>
      createMarkPriceEvent({
        workspaceId: 'ws-e12',
        sourceId: 'binance-spot',
        instrument: 'BTCUSDT',
        sequence: 1,
        price: 0.1 as unknown as string,
        exchangeOccurredAt: '2026-07-18T21:30:00.000Z',
        receivedAt: '2026-07-18T21:30:00.010Z',
        processedAt: '2026-07-18T21:30:00.020Z',
        recordedAt: '2026-07-18T21:30:00.030Z',
      }),
    ).toThrow(/canonical decimal string/);

    const midpoint = mapBinanceBookTickerToDraft({
      workspaceId: 'ws-e12',
      sequence: 1,
      message: { s: 'BTCUSDT', b: '0.1', a: '0.2' },
      exchangeOccurredAt: '2026-07-18T21:30:00.000Z',
      receivedAt: '2026-07-18T21:30:00.010Z',
      processedAt: '2026-07-18T21:30:00.020Z',
      recordedAt: '2026-07-18T21:30:00.030Z',
    });
    expect(midpoint.price).toBe('0.15');
  });
});

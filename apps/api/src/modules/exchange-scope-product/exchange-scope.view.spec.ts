import { describe, expect, it } from 'vitest';
import {
  EXCHANGE_SCOPE_PRODUCT_FLAGS,
  toLifecycleActions,
  toVenueCatalog,
} from './exchange-scope.view';

describe('PC-12 exchange-scope product views', () => {
  it('lists known venues without implying live adapters', () => {
    const catalog = toVenueCatalog();
    expect(catalog.items.map((item) => item.venueCode)).toEqual([
      'binance',
      'bybit',
      'kraken',
      'okx',
    ]);
    expect(catalog.liveVenueAdapter).toBe(false);
    expect(catalog.venueApiUsed).toBe(false);
    expect(catalog.liveCapital).toBe(false);
    expect(catalog.items.every((item) => item.liveAdapter === false)).toBe(true);
  });

  it('offers lifecycle actions that match existing transitions only', () => {
    expect(toLifecycleActions('created')).toMatchObject({
      canActivate: true,
      canSuspend: false,
      canArchive: true,
      canRename: true,
    });
    expect(toLifecycleActions('active')).toMatchObject({
      canActivate: false,
      canSuspend: true,
      canArchive: true,
    });
    expect(toLifecycleActions('suspended')).toMatchObject({
      canActivate: true,
      canSuspend: false,
      canArchive: true,
    });
    expect(toLifecycleActions('archived')).toMatchObject({
      canActivate: false,
      canSuspend: false,
      canArchive: false,
      canRename: false,
      canUpdateConfig: false,
      canBind: false,
    });
  });

  it('keeps product authority flags honest', () => {
    expect(EXCHANGE_SCOPE_PRODUCT_FLAGS).toMatchObject({
      authorityClass: 'exchange_scope_artifact',
      isRuntime: false,
      isTradingSession: false,
      isRiskEngine: false,
      isExecutionEngine: false,
      liveVenueAdapter: false,
      venueApiUsed: false,
      liveCapital: false,
    });
  });
});

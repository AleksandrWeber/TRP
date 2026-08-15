import { describe, expect, it } from 'vitest';
import { QUALIFICATION_PRODUCT_FLAGS, toLifecycleActions } from './qualification.view';

describe('PC-08 qualification product views', () => {
  it('keeps product authority flags honest', () => {
    expect(QUALIFICATION_PRODUCT_FLAGS).toMatchObject({
      authorityClass: 'research_artifact',
      forcesTrade: false,
      authorizesSession: false,
      isMarketProfile: false,
      isMarketState: false,
      scoresMarket: false,
      calculatesConfidence: false,
    });
  });

  it('offers lifecycle actions that match existing transitions only', () => {
    expect(toLifecycleActions({ state: 'not_qualified', openRunStatus: null })).toMatchObject({
      canRequest: true,
      canConfirm: false,
      canRequalify: false,
    });
    expect(
      toLifecycleActions({ state: 'pending_confirm', openRunStatus: 'requested' }),
    ).toMatchObject({
      canRequest: false,
      canConfirm: true,
      canCancel: true,
      canComplete: false,
    });
    expect(toLifecycleActions({ state: 'qualifying', openRunStatus: 'running' })).toMatchObject({
      canConfirm: false,
      canComplete: true,
      canCancel: true,
      canFail: true,
    });
    expect(toLifecycleActions({ state: 'qualified', openRunStatus: null })).toMatchObject({
      canRequest: false,
      canRequalify: true,
      canComplete: false,
    });
  });
});

/**
 * W3-O01-b — Durable Exchange Scope store on the existing owner.
 * Write-through snapshot to AnalyticalOwnerStoreSnapshot. Not a new SoT.
 */

import type { PrismaClient } from '@prisma/client';
import { persistOwnerStoreSnapshot } from '../../../persistence/analytical-owner-store-snapshot';
import { loadRecoverableOwnerSnapshot } from '../../../persistence/analytical-restart-recovery';
import type { AdapterBindingContext } from '../domain/adapter-binding-context';
import type { ExchangeScope } from '../domain/exchange-scope';
import type { ExchangeRiskPolicy } from '../domain/exchange-risk-policy';
import type { TradingAccountBinding } from '../domain/trading-account-binding';
import {
  InMemoryExchangeScopeStore,
  type ExchangeScopeStoreDurableState,
} from './in-memory-exchange-scope-store';

export class DurableExchangeScopeStore extends InMemoryExchangeScopeStore {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async hydrate(): Promise<void> {
    const payload = await loadRecoverableOwnerSnapshot(this.prisma, 'exchange-scope');
    if (payload) {
      this.importDurableState(payload as ExchangeScopeStoreDurableState);
    }
  }

  override clear(): void {
    super.clear();
    this.persist();
  }

  override putScope(scope: ExchangeScope, history: readonly ExchangeScope[]): void {
    super.putScope(scope, history);
    this.persist();
  }

  override putPolicyHistory(exchangeScopeId: string, history: readonly ExchangeRiskPolicy[]): void {
    super.putPolicyHistory(exchangeScopeId, history);
    this.persist();
  }

  override putBinding(binding: TradingAccountBinding): void {
    super.putBinding(binding);
    this.persist();
  }

  override putAdapterContext(context: AdapterBindingContext): void {
    super.putAdapterContext(context);
    this.persist();
  }

  private persist(): void {
    persistOwnerStoreSnapshot(this.prisma, 'exchange-scope', this.exportDurableState());
  }
}

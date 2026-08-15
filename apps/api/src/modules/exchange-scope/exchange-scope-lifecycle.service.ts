/**
 * RC-27 Epic 3 — Exchange Scope lifecycle / management service.
 *
 * Manages isolation artifacts only.
 * Does NOT communicate with exchanges, authenticate, validate APIs,
 * own Sessions, approve risk, or submit orders.
 */

import { Inject, Injectable } from '@nestjs/common';
import { InMemoryExchangeScopeStore } from './adapters/in-memory-exchange-scope-store';
import {
  deriveAdapterBindingContextId,
  deriveExchangeRiskPolicyId,
  deriveExchangeScopeId,
  deriveTradingAccountBindingId,
} from './application/derive-exchange-scope-ids';
import { createAdapterBindingContext } from './domain/adapter-binding-context';
import {
  createExchangeScope,
  publishNextExchangeScopeConfig,
  withExchangeScopeLifecycle,
  type ExchangeScope,
} from './domain/exchange-scope';
import {
  publishNextExchangeRiskPolicy,
  type ExchangeRiskPolicy,
} from './domain/exchange-risk-policy';
import {
  createTradingAccountBinding,
  unbindTradingAccount,
  type TradingAccountBinding,
} from './domain/trading-account-binding';
import type {
  ActivateExchangeScope,
  AdapterBindingContextResult,
  ArchiveExchangeScope,
  BindTradingAccount,
  ExchangeRiskPolicyResult,
  ExchangeScopeResult,
  ExchangeScopeServicePort,
  PublishExchangeRiskPolicy,
  RegisterExchangeScope,
  SetAdapterBindingContext,
  SuspendExchangeScope,
  TradingAccountBindingResult,
  UnbindTradingAccount,
  UpdateExchangeScopeConfig,
} from './ports/exchange-scope.port';

const DEFAULT_TS = '1970-01-01T00:00:00.000Z';

@Injectable()
export class ExchangeScopeLifecycleService implements ExchangeScopeServicePort {
  constructor(
    @Inject(InMemoryExchangeScopeStore)
    private readonly store: InMemoryExchangeScopeStore,
  ) {}

  registerExchangeScope(cmd: RegisterExchangeScope): ExchangeScopeResult {
    if (!cmd.workspaceId?.trim()) {
      return rejectedScope('', null, ['workspace_required']);
    }
    if (!cmd.venueCode?.trim()) {
      return rejectedScope('', null, ['venue_code_required']);
    }
    if (!cmd.displayName?.trim()) {
      return rejectedScope('', null, ['display_name_required']);
    }
    if (!cmd.requestedBy?.trim()) {
      return rejectedScope('', null, ['requested_by_required']);
    }

    const venueCode = cmd.venueCode.trim().toLowerCase();
    const exchangeScopeId = cmd.exchangeScopeId?.trim() || deriveExchangeScopeId(venueCode);
    const asOf = cmd.requestedAt?.trim() || DEFAULT_TS;

    if (this.store.getScope(exchangeScopeId)) {
      return rejectedScope(exchangeScopeId, this.store.getScope(exchangeScopeId), [
        'scope_id_exists',
      ]);
    }

    const activeDup = this.store.findActiveDuplicateVenue(cmd.workspaceId, venueCode);
    if (activeDup) {
      return rejectedScope(exchangeScopeId, activeDup, ['active_venue_exists']);
    }

    try {
      const created = createExchangeScope({
        exchangeScopeId,
        workspaceId: cmd.workspaceId,
        venueCode,
        displayName: cmd.displayName,
        version: {
          exchangeScopeId,
          version: 1,
          publishedAt: asOf,
          publishedBy: cmd.requestedBy,
        },
        lifecycle: {
          status: 'created',
          updatedAt: asOf,
          updatedBy: cmd.requestedBy,
          reason: cmd.notes?.trim() || 'exchange scope registered',
        },
        config: {
          exchangeScopeId,
          maxActiveSessions: cmd.maxActiveSessions ?? 0,
          symbolAllowlist: [],
          strategyAllowlist: [],
          modeContext: cmd.modeContext ?? 'paper',
          updatedAt: asOf,
          updatedBy: cmd.requestedBy,
        },
        metadata: {
          asOf,
          inputSummary: cmd.notes?.trim() || 'registered isolation scope',
        },
      });
      this.store.putScope(created, [created]);
      return {
        outcome: 'accepted',
        exchangeScopeId,
        exchangeScope: created,
      };
    } catch (error) {
      return rejectedScope(exchangeScopeId, null, [
        error instanceof Error ? error.message : 'register_failed',
      ]);
    }
  }

  activateExchangeScope(cmd: ActivateExchangeScope): ExchangeScopeResult {
    return this.transitionLifecycle(cmd, 'active', 'accepted', 'activate exchange scope');
  }

  suspendExchangeScope(cmd: SuspendExchangeScope): ExchangeScopeResult {
    return this.transitionLifecycle(cmd, 'suspended', 'suspended', 'suspend exchange scope');
  }

  archiveExchangeScope(cmd: ArchiveExchangeScope): ExchangeScopeResult {
    return this.transitionLifecycle(cmd, 'archived', 'archived', 'archive exchange scope');
  }

  updateExchangeScopeConfig(cmd: UpdateExchangeScopeConfig): ExchangeScopeResult {
    if (!cmd.workspaceId?.trim() || !cmd.exchangeScopeId?.trim()) {
      return rejectedScope(cmd.exchangeScopeId ?? '', null, ['scope_required']);
    }
    if (!cmd.updatedBy?.trim()) {
      return rejectedScope(cmd.exchangeScopeId, null, ['updated_by_required']);
    }

    const required = this.requireScope(cmd.workspaceId, cmd.exchangeScopeId);
    if ('outcome' in required) return required;
    const current = required;

    if (current.lifecycle.status === 'archived') {
      return rejectedScope(current.exchangeScopeId, current, ['scope_archived']);
    }

    const asOf = cmd.asOf?.trim() || DEFAULT_TS;
    const history = this.store.getHistory(current.exchangeScopeId);
    const nextVersion = (history.at(-1)?.version.version ?? 0) + 1;
    const displayName = cmd.displayName?.trim() || current.displayName;
    if (!displayName) {
      return rejectedScope(current.exchangeScopeId, current, ['display_name_required']);
    }

    try {
      const published = publishNextExchangeScopeConfig({
        history,
        next: {
          exchangeScopeId: current.exchangeScopeId,
          workspaceId: current.workspaceId,
          venueCode: String(current.venueCode),
          displayName,
          versionNumber: nextVersion,
          publishedAt: asOf,
          publishedBy: cmd.updatedBy,
          activate: false,
          lifecycleReason: 'configuration published',
          config: {
            exchangeScopeId: current.exchangeScopeId,
            maxActiveSessions: cmd.maxActiveSessions ?? current.config.maxActiveSessions,
            symbolAllowlist: cmd.symbolAllowlist ?? current.config.symbolAllowlist,
            strategyAllowlist: cmd.strategyAllowlist ?? current.config.strategyAllowlist,
            modeContext: cmd.modeContext ?? current.config.modeContext,
            updatedAt: asOf,
            updatedBy: cmd.updatedBy,
          },
          metadata: {
            asOf,
            adapterContextRef: current.metadata.adapterContextRef,
            policyRef: current.metadata.policyRef,
            inputSummary: 'configuration published',
          },
        },
      });

      let next = published.next;
      if (current.lifecycle.status === 'active') {
        next = withExchangeScopeLifecycle(
          next,
          'active',
          asOf,
          cmd.updatedBy,
          'retain active after config publish',
        );
      } else if (current.lifecycle.status === 'suspended') {
        next = withExchangeScopeLifecycle(
          next,
          'active',
          asOf,
          cmd.updatedBy,
          'path to suspended after config publish',
        );
        next = withExchangeScopeLifecycle(
          next,
          'suspended',
          asOf,
          cmd.updatedBy,
          'retain suspended after config publish',
        );
      }

      this.store.putScope(next, [...published.history.slice(0, -1), next]);
      return {
        outcome: 'accepted',
        exchangeScopeId: next.exchangeScopeId,
        exchangeScope: next,
      };
    } catch (error) {
      return rejectedScope(current.exchangeScopeId, current, [
        error instanceof Error ? error.message : 'config_publish_failed',
      ]);
    }
  }

  publishExchangeRiskPolicy(cmd: PublishExchangeRiskPolicy): ExchangeRiskPolicyResult {
    if (!cmd.workspaceId?.trim() || !cmd.exchangeScopeId?.trim()) {
      return rejectedPolicy('', '', null, ['scope_required']);
    }
    if (!cmd.publishedBy?.trim()) {
      return rejectedPolicy(cmd.exchangeScopeId, '', null, ['published_by_required']);
    }

    const current = this.store.getScope(cmd.exchangeScopeId);
    if (!current || current.workspaceId !== cmd.workspaceId) {
      return rejectedPolicy(cmd.exchangeScopeId, '', null, ['scope_not_found']);
    }

    const history = this.store.getPolicyHistory(cmd.exchangeScopeId);
    const policyVersion = cmd.policyVersion ?? (history.at(-1)?.policyVersion ?? 0) + 1;
    const asOf = cmd.asOf?.trim() || DEFAULT_TS;
    const exchangeRiskPolicyId =
      cmd.exchangeRiskPolicyId?.trim() ||
      deriveExchangeRiskPolicyId([
        cmd.workspaceId,
        cmd.exchangeScopeId,
        String(policyVersion),
        asOf,
      ]);

    try {
      const published = publishNextExchangeRiskPolicy({
        history,
        next: {
          exchangeRiskPolicyId,
          exchangeScopeId: cmd.exchangeScopeId,
          workspaceId: cmd.workspaceId,
          policyVersion,
          limits: cmd.limits,
          publishedAt: asOf,
          publishedBy: cmd.publishedBy,
        },
      });
      this.store.putPolicyHistory(cmd.exchangeScopeId, published.history);
      return {
        outcome: 'accepted',
        exchangeScopeId: cmd.exchangeScopeId,
        exchangeRiskPolicyId,
        policy: published.next,
      };
    } catch (error) {
      return rejectedPolicy(cmd.exchangeScopeId, exchangeRiskPolicyId, null, [
        error instanceof Error ? error.message : 'policy_publish_failed',
      ]);
    }
  }

  bindTradingAccount(cmd: BindTradingAccount): TradingAccountBindingResult {
    if (!cmd.workspaceId?.trim() || !cmd.exchangeScopeId?.trim()) {
      return rejectedBinding('', '', null, ['scope_required']);
    }
    if (!cmd.tradingAccountId?.trim()) {
      return rejectedBinding(cmd.exchangeScopeId, '', null, ['trading_account_required']);
    }
    if (!cmd.requestedBy?.trim()) {
      return rejectedBinding(cmd.exchangeScopeId, '', null, ['requested_by_required']);
    }

    const current = this.store.getScope(cmd.exchangeScopeId);
    if (!current || current.workspaceId !== cmd.workspaceId) {
      return rejectedBinding(cmd.exchangeScopeId, '', null, ['scope_not_found']);
    }

    const asOf = cmd.asOf?.trim() || DEFAULT_TS;
    const tradingAccountBindingId =
      cmd.tradingAccountBindingId?.trim() ||
      deriveTradingAccountBindingId([
        cmd.workspaceId,
        cmd.exchangeScopeId,
        cmd.tradingAccountId,
        asOf,
      ]);

    if (this.store.getBinding(tradingAccountBindingId)) {
      return rejectedBinding(cmd.exchangeScopeId, tradingAccountBindingId, null, [
        'binding_id_exists',
      ]);
    }

    try {
      const binding = createTradingAccountBinding({
        tradingAccountBindingId,
        workspaceId: cmd.workspaceId,
        exchangeScopeId: cmd.exchangeScopeId,
        tradingAccountId: cmd.tradingAccountId,
        boundAt: asOf,
        boundBy: cmd.requestedBy,
      });
      this.store.putBinding(binding);
      return {
        outcome: 'accepted',
        exchangeScopeId: cmd.exchangeScopeId,
        tradingAccountBindingId,
        binding,
      };
    } catch (error) {
      return rejectedBinding(cmd.exchangeScopeId, tradingAccountBindingId, null, [
        error instanceof Error ? error.message : 'bind_failed',
      ]);
    }
  }

  unbindTradingAccount(cmd: UnbindTradingAccount): TradingAccountBindingResult {
    if (!cmd.workspaceId?.trim() || !cmd.exchangeScopeId?.trim()) {
      return rejectedBinding('', '', null, ['scope_required']);
    }
    if (!cmd.tradingAccountBindingId?.trim()) {
      return rejectedBinding(cmd.exchangeScopeId, '', null, ['binding_required']);
    }
    if (!cmd.requestedBy?.trim()) {
      return rejectedBinding(cmd.exchangeScopeId, cmd.tradingAccountBindingId, null, [
        'requested_by_required',
      ]);
    }

    const existing = this.store.getBinding(cmd.tradingAccountBindingId);
    if (
      !existing ||
      existing.workspaceId !== cmd.workspaceId ||
      existing.exchangeScopeId !== cmd.exchangeScopeId
    ) {
      return rejectedBinding(cmd.exchangeScopeId, cmd.tradingAccountBindingId, null, [
        'binding_not_found',
      ]);
    }

    try {
      const unbound = unbindTradingAccount(
        existing,
        cmd.asOf?.trim() || DEFAULT_TS,
        cmd.requestedBy,
      );
      this.store.putBinding(unbound);
      return {
        outcome: 'accepted',
        exchangeScopeId: cmd.exchangeScopeId,
        tradingAccountBindingId: unbound.tradingAccountBindingId,
        binding: unbound,
      };
    } catch (error) {
      return rejectedBinding(cmd.exchangeScopeId, cmd.tradingAccountBindingId, existing, [
        error instanceof Error ? error.message : 'unbind_failed',
      ]);
    }
  }

  setAdapterBindingContext(cmd: SetAdapterBindingContext): AdapterBindingContextResult {
    if (!cmd.workspaceId?.trim() || !cmd.exchangeScopeId?.trim()) {
      return rejectedAdapter('', '', null, ['scope_required']);
    }
    if (!cmd.adapterIdentity?.trim()) {
      return rejectedAdapter(cmd.exchangeScopeId, '', null, ['adapter_identity_required']);
    }
    if (!cmd.requestedBy?.trim()) {
      return rejectedAdapter(cmd.exchangeScopeId, '', null, ['requested_by_required']);
    }

    const current = this.store.getScope(cmd.exchangeScopeId);
    if (!current || current.workspaceId !== cmd.workspaceId) {
      return rejectedAdapter(cmd.exchangeScopeId, '', null, ['scope_not_found']);
    }

    const asOf = cmd.asOf?.trim() || DEFAULT_TS;
    const adapterBindingContextId =
      cmd.adapterBindingContextId?.trim() ||
      deriveAdapterBindingContextId([cmd.workspaceId, cmd.exchangeScopeId, asOf]);

    try {
      const context = createAdapterBindingContext({
        adapterBindingContextId,
        workspaceId: cmd.workspaceId,
        exchangeScopeId: cmd.exchangeScopeId,
        adapterIdentity: cmd.adapterIdentity,
        modeContext: cmd.modeContext ?? current.config.modeContext,
        updatedAt: asOf,
        updatedBy: cmd.requestedBy,
      });
      this.store.putAdapterContext(context);
      return {
        outcome: 'accepted',
        exchangeScopeId: cmd.exchangeScopeId,
        adapterBindingContextId,
        context,
      };
    } catch (error) {
      return rejectedAdapter(cmd.exchangeScopeId, adapterBindingContextId, null, [
        error instanceof Error ? error.message : 'adapter_context_failed',
      ]);
    }
  }

  private transitionLifecycle(
    cmd: ActivateExchangeScope | SuspendExchangeScope | ArchiveExchangeScope,
    to: 'active' | 'suspended' | 'archived',
    outcome: ExchangeScopeResult['outcome'],
    defaultReason: string,
  ): ExchangeScopeResult {
    if (!cmd.workspaceId?.trim() || !cmd.exchangeScopeId?.trim()) {
      return rejectedScope(cmd.exchangeScopeId ?? '', null, ['scope_required']);
    }
    if (!cmd.requestedBy?.trim()) {
      return rejectedScope(cmd.exchangeScopeId, null, ['requested_by_required']);
    }

    const required = this.requireScope(cmd.workspaceId, cmd.exchangeScopeId);
    if ('outcome' in required) return required;
    const current = required;

    if (to === 'active') {
      const dup = this.store.findActiveDuplicateVenue(
        current.workspaceId,
        String(current.venueCode),
        current.exchangeScopeId,
      );
      if (dup) {
        return rejectedScope(current.exchangeScopeId, current, ['active_venue_exists']);
      }
    }

    if (current.lifecycle.status === to) {
      return {
        outcome: 'unchanged',
        exchangeScopeId: current.exchangeScopeId,
        exchangeScope: current,
      };
    }

    try {
      const next = withExchangeScopeLifecycle(
        current,
        to,
        cmd.asOf?.trim() || DEFAULT_TS,
        cmd.requestedBy,
        cmd.reason?.trim() || defaultReason,
      );
      const history = this.store
        .getHistory(current.exchangeScopeId)
        .map((row) =>
          row.version.version === current.version.version &&
          row.exchangeScopeId === current.exchangeScopeId
            ? next
            : row,
        );
      // Ensure latest is present
      const withLatest = history.some(
        (row) =>
          row.version.version === next.version.version &&
          row.lifecycle.status === next.lifecycle.status,
      )
        ? history
        : [...history.filter((row) => row.version.version !== next.version.version), next];

      this.store.putScope(next, withLatest.length > 0 ? withLatest : [next]);
      return {
        outcome,
        exchangeScopeId: next.exchangeScopeId,
        exchangeScope: next,
      };
    } catch (error) {
      return rejectedScope(current.exchangeScopeId, current, [
        error instanceof Error ? error.message : 'lifecycle_transition_failed',
      ]);
    }
  }

  private requireScope(
    workspaceId: string,
    exchangeScopeId: string,
  ): ExchangeScope | ExchangeScopeResult {
    const current = this.store.getScope(exchangeScopeId);
    if (!current || current.workspaceId !== workspaceId) {
      return rejectedScope(exchangeScopeId, null, ['scope_not_found']);
    }
    return current;
  }
}

function rejectedScope(
  exchangeScopeId: string,
  exchangeScope: ExchangeScope | null,
  rejectionReasons: readonly string[],
): ExchangeScopeResult {
  return {
    outcome: 'rejected',
    exchangeScopeId,
    exchangeScope,
    rejectionReasons,
  };
}

function rejectedPolicy(
  exchangeScopeId: string,
  exchangeRiskPolicyId: string,
  policy: ExchangeRiskPolicy | null,
  rejectionReasons: readonly string[],
): ExchangeRiskPolicyResult {
  return {
    outcome: 'rejected',
    exchangeScopeId,
    exchangeRiskPolicyId,
    policy,
    rejectionReasons,
  };
}

function rejectedBinding(
  exchangeScopeId: string,
  tradingAccountBindingId: string,
  binding: TradingAccountBinding | null,
  rejectionReasons: readonly string[],
): TradingAccountBindingResult {
  return {
    outcome: 'rejected',
    exchangeScopeId,
    tradingAccountBindingId,
    binding,
    rejectionReasons,
  };
}

function rejectedAdapter(
  exchangeScopeId: string,
  adapterBindingContextId: string,
  context: null,
  rejectionReasons: readonly string[],
): AdapterBindingContextResult {
  return {
    outcome: 'rejected',
    exchangeScopeId,
    adapterBindingContextId,
    context,
    rejectionReasons,
  };
}

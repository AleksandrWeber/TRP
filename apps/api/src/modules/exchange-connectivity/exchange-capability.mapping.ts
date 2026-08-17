/**
 * Provider capability mapping (W2-S02-d).
 *
 * Maps catalog declaration plus session evidence onto honest capability states.
 * Missing evidence becomes Unknown, never Supported.
 */

import { EXCHANGE_PROVIDER_CAPABILITIES } from './exchange-provider-capabilities';
import {
  EXCHANGE_SESSION_CAPABILITIES,
  type ExchangeSessionCapability,
} from './exchange-capability';
import {
  applyExchangeCapabilityEvent,
  capabilityStateFromEvidence,
  type ExchangeCapabilityState,
} from './exchange-capability.state';

export type ExchangeCapabilityEvidence = Readonly<{
  restObserved?: boolean;
  spot?: boolean;
  margin?: boolean;
  futures?: boolean;
  testnet?: boolean;
  websocket?: boolean;
  withdraw?: boolean;
  deposit?: boolean;
}>;

export type ExchangeCapabilityVerificationOutcome =
  'completed' | 'failed' | 'provider_unavailable' | 'not_attempted';

export type ExchangeVerifiedCapability = Readonly<{
  capability: ExchangeSessionCapability;
  state: ExchangeCapabilityState;
}>;

const CATALOG_CAPABILITY_SET = new Set<string>(EXCHANGE_PROVIDER_CAPABILITIES);

const EVIDENCE_BY_CAPABILITY: Readonly<
  Record<ExchangeSessionCapability, keyof ExchangeCapabilityEvidence>
> = {
  SPOT: 'spot',
  MARGIN: 'margin',
  FUTURES: 'futures',
  TESTNET: 'testnet',
  REST: 'restObserved',
  WEBSOCKET: 'websocket',
  WITHDRAW: 'withdraw',
  DEPOSIT: 'deposit',
};

export function mapProviderCapabilities(input: {
  catalogCapabilities: readonly string[];
  evidence: ExchangeCapabilityEvidence;
  outcome: ExchangeCapabilityVerificationOutcome;
}): readonly ExchangeVerifiedCapability[] {
  const catalog = new Set(input.catalogCapabilities);
  return EXCHANGE_SESSION_CAPABILITIES.map((capability) => ({
    capability,
    state: mapOne(capability, catalog, input.evidence, input.outcome),
  }));
}

function mapOne(
  capability: ExchangeSessionCapability,
  catalog: ReadonlySet<string>,
  evidence: ExchangeCapabilityEvidence,
  outcome: ExchangeCapabilityVerificationOutcome,
): ExchangeCapabilityState {
  const value = evidence[EVIDENCE_BY_CAPABILITY[capability]];
  if (typeof value === 'boolean') {
    return capabilityStateFromEvidence(value, 'observe_unknown');
  }

  if (outcome === 'failed' || outcome === 'provider_unavailable') {
    return applyExchangeCapabilityEvent('UNKNOWN', 'observe_failed');
  }

  if (isCatalogCapability(capability) && !catalog.has(capability)) {
    return applyExchangeCapabilityEvent('UNKNOWN', 'observe_unsupported');
  }

  return applyExchangeCapabilityEvent('UNKNOWN', 'observe_unknown');
}

function isCatalogCapability(capability: ExchangeSessionCapability): boolean {
  return CATALOG_CAPABILITY_SET.has(capability);
}

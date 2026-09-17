/**
 * ADR-012 execution adapter boundary. Only Execution Engine may call it.
 * Inputs and returned facts are immutable; the adapter owns no domain state.
 *
 * V3-L02-S-ADP1: port accepts paper | live commands. Paper path unchanged.
 * Live path never invents fills; ambiguity → unknown.
 */

import type { PaperFillConfiguration, PaperRoundingContext } from './paper-fill-configuration';
import type { PaperFillFact } from './paper-matching';
import type { HoldableSecretType } from '../secret-vault/holdable-secret-type';
import type { SecretPurpose } from '../secret-vault/secret-purpose';
import type { LiveVenueId } from './live-venue-egress/live-venue-allowlist';
import type { TradingCredentialEnvironment } from './live-venue-egress/trading-credential-environment';

export const EXECUTION_ADAPTER = Symbol('EXECUTION_ADAPTER');

export type PaperExecutionCommand = Readonly<{
  mode: 'paper';
  workspaceId: string;
  orderId: string;
  clientOrderId: string;
  intentHash: string;
  instrument: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: string;
  limitPrice: string | null;
  /** Pass-through Order origin (US222); excluded from fill matching. */
  origin?: 'manual' | 'strategy';
  /** Immutable Signal Intent id when origin is strategy (US222). */
  signalIntentId?: string | null;
  /** Immutable Signal Intent hash when origin is strategy (US222). */
  signalIntentHash?: string | null;
  marketState: Readonly<{
    streamId: string;
    eventId: string;
    sequence: number;
    referencePrice: string;
    occurredAt: string;
  }>;
  configuration: PaperFillConfiguration;
}>;

/**
 * Live venue submission command (ADP1). Credentials are resolved inside the
 * adapter via trusted Vault metadata — never passed as raw secrets on the command.
 */
export type LiveExecutionCommand = Readonly<{
  mode: 'live';
  workspaceId: string;
  orderId: string;
  clientOrderId: string;
  intentHash: string;
  instrument: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: string;
  limitPrice: string | null;
  venue: LiveVenueId;
  tradingEnvironment: TradingCredentialEnvironment;
  vaultType: HoldableSecretType;
  purpose: SecretPurpose;
  /** Optional client-claimed env — must match trusted purpose or ENV1 denies. */
  clientClaimedEnvironment?: string | null;
}>;

export type ExecutionCommand = PaperExecutionCommand | LiveExecutionCommand;

export type PaperCancelCommand = Readonly<{
  mode: 'paper';
  workspaceId: string;
  orderId: string;
  clientOrderId: string;
  adapterOrderId: string;
  idempotencyKey: string;
}>;

export type LiveCancelCommand = Readonly<{
  mode: 'live';
  workspaceId: string;
  orderId: string;
  clientOrderId: string;
  adapterOrderId: string;
  idempotencyKey: string;
  instrument: string;
  venue: LiveVenueId;
  tradingEnvironment: TradingCredentialEnvironment;
  vaultType: HoldableSecretType;
  purpose: SecretPurpose;
  clientClaimedEnvironment?: string | null;
}>;

export type CancelCommand = PaperCancelCommand | LiveCancelCommand;

export type PaperQueryCommand = Readonly<{
  mode: 'paper';
  workspaceId: string;
  adapterOrderId: string;
}>;

export type LiveQueryCommand = Readonly<{
  mode: 'live';
  workspaceId: string;
  adapterOrderId: string | null;
  clientOrderId: string;
  instrument: string;
  venue: LiveVenueId;
  tradingEnvironment: TradingCredentialEnvironment;
  vaultType: HoldableSecretType;
  purpose: SecretPurpose;
  clientClaimedEnvironment?: string | null;
}>;

export type QueryCommand = PaperQueryCommand | LiveQueryCommand;

type AdapterSubmissionBase = Readonly<{
  mode: 'paper' | 'live';
  adapterOrderId: string;
  clientOrderId: string;
  executionContextHash: string;
  roundingContext?: PaperRoundingContext;
}>;

/** Deterministic market/limit fill (US168/US169). Paper only in practice. */
export type AdapterFilledResult = AdapterSubmissionBase &
  Readonly<{
    outcome: 'filled';
    fill: PaperFillFact;
  }>;

/** Limit order that did not cross / venue accepted resting; no fill invented. */
export type AdapterAcknowledgedResult = AdapterSubmissionBase &
  Readonly<{
    outcome: 'acknowledged';
  }>;

/**
 * Ambiguous transport/venue outcome (V3-L02-S-UNK1 / ADP1).
 * Must map to OrderStatus.UNKNOWN — never inferred as rejected/cancelled/filled.
 */
export type AdapterUnknownSubmissionResult = Readonly<{
  mode: 'paper' | 'live';
  outcome: 'unknown';
  clientOrderId: string;
  ambiguityReason: string;
  adapterOrderId?: string | null;
  executionContextHash?: string;
  roundingContext?: PaperRoundingContext;
}>;

/** Known venue rejection (not ambiguity). */
export type AdapterRejectedSubmissionResult = Readonly<{
  mode: 'paper' | 'live';
  outcome: 'rejected';
  clientOrderId: string;
  rejectionReason: string;
  adapterOrderId?: string | null;
  executionContextHash?: string;
  roundingContext?: PaperRoundingContext;
}>;

export type AdapterSubmissionResult =
  | AdapterFilledResult
  | AdapterAcknowledgedResult
  | AdapterUnknownSubmissionResult
  | AdapterRejectedSubmissionResult;

/** Backwards-compatible alias retained for consumers of the acknowledged shape. */
export type AdapterSubmissionAcknowledgement = AdapterAcknowledgedResult;

export type AdapterCancellationResult =
  | Readonly<{
      outcome: 'cancel_acknowledged';
      mode: 'paper' | 'live';
      adapterOrderId: string;
      idempotencyKey: string;
    }>
  | Readonly<{
      outcome: 'already_cancelled';
      mode: 'live';
      adapterOrderId: string;
      idempotencyKey: string;
    }>
  | Readonly<{
      outcome: 'already_filled';
      mode: 'live';
      adapterOrderId: string;
      idempotencyKey: string;
    }>
  | Readonly<{
      outcome: 'unknown';
      mode: 'live';
      adapterOrderId: string;
      idempotencyKey: string;
      ambiguityReason: string;
    }>
  | Readonly<{
      outcome: 'rejected';
      mode: 'live';
      adapterOrderId: string;
      idempotencyKey: string;
      reason: string;
    }>;

export type AdapterOrderQueryResult =
  | Readonly<{
      outcome: 'unknown';
      mode: 'paper';
      adapterOrderId: string;
      reconciliationRequired: true;
    }>
  | Readonly<{
      outcome: 'accepted' | 'rejected' | 'filled' | 'cancelled' | 'unknown';
      mode: 'live';
      adapterOrderId: string | null;
      clientOrderId: string;
      reconciliationRequired: boolean;
      venueStatus?: string;
      ambiguityReason?: string;
    }>;

export type ExecutionAdapterCapabilities = Readonly<{
  mode: 'paper' | 'live' | 'routing';
  marketOrders: true;
  limitOrders: true;
  cancellation: true;
  reconciliation: true;
  partialFills: false;
  liveCapital: boolean;
  venues?: readonly LiveVenueId[];
}>;

export type ExecutionAdapterHealth = Readonly<{
  mode: 'paper' | 'live' | 'routing';
  status: 'healthy' | 'degraded' | 'unavailable';
  credentialsConfigured: boolean;
  realVenueIoEnabled: boolean;
}>;

export interface ExecutionAdapterPort {
  submit(command: ExecutionCommand): Promise<AdapterSubmissionResult>;
  cancel(command: CancelCommand): Promise<AdapterCancellationResult>;
  query(command: QueryCommand): Promise<AdapterOrderQueryResult>;
  capabilities(): ExecutionAdapterCapabilities;
  health(): ExecutionAdapterHealth;
}

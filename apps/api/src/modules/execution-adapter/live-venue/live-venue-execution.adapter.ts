/**
 * V3-L02-S-ADP1 — Live ExecutionAdapterPort for BINANCE / BYBIT / OKX.
 *
 * Consumes ENV1 + EG1. Never invents fills. Ambiguity → unknown.
 * Real venue I/O gated off by default (allowRealVenueIo=false).
 * Does not import EmergencyManager or live-trading-engine.
 */

import type {
  AdapterCancellationResult,
  AdapterOrderQueryResult,
  AdapterSubmissionResult,
  CancelCommand,
  ExecutionAdapterCapabilities,
  ExecutionAdapterHealth,
  ExecutionAdapterPort,
  ExecutionCommand,
  LiveCancelCommand,
  LiveExecutionCommand,
  LiveQueryCommand,
  QueryCommand,
} from '../execution-adapter.port';
import {
  assertLiveCredentialEnvironmentBinding,
  liveCredentialBindingErrorMessage,
  redactCredentialMaterial,
} from '../live-venue-egress/live-credential-environment-policy';
import {
  LiveVenueEgressHttpClient,
  type LiveVenueEgressFetch,
} from '../live-venue-egress/live-venue-egress-http';
import type { LiveVenueDnsResolveFn } from '../live-venue-egress/live-venue-egress-policy';
import { LIVE_VENUE_IDS, type LiveVenueId } from '../live-venue-egress/live-venue-allowlist';
import {
  InMemoryLiveTradingCredentialProvider,
  safeCredentialErrorMessage,
  type LiveTradingCredentialProvider,
} from './live-trading-credential.provider';
import { buildLiveVenueOrderRequest, liveExecutionContextHash } from './live-venue-request';

export type LiveVenueExecutionAdapterOptions = Readonly<{
  credentialProvider?: LiveTradingCredentialProvider;
  httpClient?: LiveVenueEgressHttpClient;
  fetchFn?: LiveVenueEgressFetch;
  resolveDns?: LiveVenueDnsResolveFn;
  /** Default false — runtime live I/O blocked until separately authorized. */
  allowRealVenueIo?: boolean;
}>;

export class LiveVenueExecutionAdapter implements ExecutionAdapterPort {
  private readonly credentials: LiveTradingCredentialProvider;
  private readonly http: LiveVenueEgressHttpClient;
  private readonly allowRealVenueIo: boolean;

  constructor(options: LiveVenueExecutionAdapterOptions = {}) {
    this.credentials = options.credentialProvider ?? new InMemoryLiveTradingCredentialProvider();
    this.allowRealVenueIo = options.allowRealVenueIo === true;
    this.http =
      options.httpClient ??
      new LiveVenueEgressHttpClient({
        fetchFn: options.fetchFn,
        resolveDns: options.resolveDns,
        allowRealVenueIo: this.allowRealVenueIo,
      });
  }

  async submit(command: ExecutionCommand): Promise<AdapterSubmissionResult> {
    if (command.mode !== 'live') {
      return Object.freeze({
        mode: 'live',
        outcome: 'rejected',
        clientOrderId: 'invalid',
        rejectionReason: 'live_adapter_requires_live_mode',
      });
    }
    return this.submitLive(command);
  }

  async cancel(command: CancelCommand): Promise<AdapterCancellationResult> {
    if (command.mode !== 'live') {
      return Object.freeze({
        outcome: 'rejected',
        mode: 'live',
        adapterOrderId: 'invalid',
        idempotencyKey: 'invalid',
        reason: 'live_adapter_requires_live_mode',
      });
    }
    return this.cancelLive(command);
  }

  async query(command: QueryCommand): Promise<AdapterOrderQueryResult> {
    if (command.mode !== 'live') {
      return Object.freeze({
        outcome: 'unknown',
        mode: 'live',
        adapterOrderId: null,
        clientOrderId: 'invalid',
        reconciliationRequired: true,
        ambiguityReason: 'live_adapter_requires_live_mode',
      });
    }
    return this.queryLive(command);
  }

  capabilities(): ExecutionAdapterCapabilities {
    return Object.freeze({
      mode: 'live',
      marketOrders: true as const,
      limitOrders: true as const,
      cancellation: true as const,
      reconciliation: true as const,
      partialFills: false as const,
      liveCapital: false,
      venues: LIVE_VENUE_IDS,
    });
  }

  health(): ExecutionAdapterHealth {
    return Object.freeze({
      mode: 'live',
      status: this.allowRealVenueIo ? 'degraded' : 'healthy',
      credentialsConfigured: true,
      realVenueIoEnabled: this.allowRealVenueIo,
    });
  }

  private async submitLive(command: LiveExecutionCommand): Promise<AdapterSubmissionResult> {
    const prepared = await this.prepareAuth(command);
    if (!prepared.ok) {
      return Object.freeze({
        mode: 'live',
        outcome: 'rejected',
        clientOrderId: command.clientOrderId,
        rejectionReason: prepared.reason,
      });
    }

    const contextHash = liveExecutionContextHash({
      venue: command.venue,
      environment: command.tradingEnvironment,
      clientOrderId: command.clientOrderId,
      intentHash: command.intentHash,
    });

    let signed;
    try {
      signed = buildLiveVenueOrderRequest({
        venue: command.venue,
        tradingEnvironment: command.tradingEnvironment,
        clientOrderId: command.clientOrderId,
        instrument: command.instrument,
        side: command.side,
        type: command.type,
        quantity: command.quantity,
        limitPrice: command.limitPrice,
        credentials: prepared.fields,
        okxDemoHeaders: prepared.okxDemoHeaders,
        operation: 'submit',
      });
    } catch (error) {
      return Object.freeze({
        mode: 'live',
        outcome: 'rejected',
        clientOrderId: command.clientOrderId,
        rejectionReason: safeCredentialErrorMessage(
          'live_request_build_failed',
          error instanceof Error ? error.message : undefined,
        ),
      });
    }

    try {
      const response = await this.http.execute({
        venue: command.venue,
        environment: prepared.egressEnvironment,
        pathAndQuery: signed.pathAndQuery,
        method: signed.method,
        headers: sanitizeOutboundHeaders(signed.headers),
        body: signed.body,
      });

      if (!response.ok) {
        return Object.freeze({
          mode: 'live',
          outcome: 'rejected',
          clientOrderId: command.clientOrderId,
          rejectionReason: `egress_denied:${response.detail.reason}`,
        });
      }

      return parseSubmitResponse({
        venue: command.venue,
        clientOrderId: command.clientOrderId,
        contextHash,
        status: response.status,
        bodyText: response.bodyText,
      });
    } catch (error) {
      return Object.freeze({
        mode: 'live',
        outcome: 'unknown',
        clientOrderId: command.clientOrderId,
        ambiguityReason: transportAmbiguityReason(error),
        executionContextHash: contextHash,
      });
    }
  }

  private async cancelLive(command: LiveCancelCommand): Promise<AdapterCancellationResult> {
    const prepared = await this.prepareAuth(command);
    if (!prepared.ok) {
      return Object.freeze({
        outcome: 'rejected',
        mode: 'live',
        adapterOrderId: command.adapterOrderId,
        idempotencyKey: command.idempotencyKey,
        reason: prepared.reason,
      });
    }

    let signed;
    try {
      signed = buildLiveVenueOrderRequest({
        venue: command.venue,
        tradingEnvironment: command.tradingEnvironment,
        clientOrderId: command.clientOrderId,
        instrument: command.instrument,
        side: 'buy',
        type: 'limit',
        quantity: '0',
        limitPrice: '1',
        credentials: prepared.fields,
        okxDemoHeaders: prepared.okxDemoHeaders,
        operation: 'cancel',
        adapterOrderId: command.adapterOrderId,
      });
    } catch (error) {
      return Object.freeze({
        outcome: 'rejected',
        mode: 'live',
        adapterOrderId: command.adapterOrderId,
        idempotencyKey: command.idempotencyKey,
        reason: safeCredentialErrorMessage(
          'live_cancel_build_failed',
          error instanceof Error ? error.message : undefined,
        ),
      });
    }

    try {
      const response = await this.http.execute({
        venue: command.venue,
        environment: prepared.egressEnvironment,
        pathAndQuery: signed.pathAndQuery,
        method: signed.method,
        headers: sanitizeOutboundHeaders(signed.headers),
        body: signed.body,
      });
      if (!response.ok) {
        return Object.freeze({
          outcome: 'rejected',
          mode: 'live',
          adapterOrderId: command.adapterOrderId,
          idempotencyKey: command.idempotencyKey,
          reason: `egress_denied:${response.detail.reason}`,
        });
      }
      return parseCancelResponse({
        adapterOrderId: command.adapterOrderId,
        idempotencyKey: command.idempotencyKey,
        status: response.status,
        bodyText: response.bodyText,
        venue: command.venue,
      });
    } catch (error) {
      return Object.freeze({
        outcome: 'unknown',
        mode: 'live',
        adapterOrderId: command.adapterOrderId,
        idempotencyKey: command.idempotencyKey,
        ambiguityReason: transportAmbiguityReason(error),
      });
    }
  }

  private async queryLive(command: LiveQueryCommand): Promise<AdapterOrderQueryResult> {
    const prepared = await this.prepareAuth(command);
    if (!prepared.ok) {
      return Object.freeze({
        outcome: 'unknown',
        mode: 'live',
        adapterOrderId: command.adapterOrderId,
        clientOrderId: command.clientOrderId,
        reconciliationRequired: true,
        ambiguityReason: prepared.reason,
      });
    }

    let signed;
    try {
      signed = buildLiveVenueOrderRequest({
        venue: command.venue,
        tradingEnvironment: command.tradingEnvironment,
        clientOrderId: command.clientOrderId,
        instrument: command.instrument,
        side: 'buy',
        type: 'limit',
        quantity: '0',
        limitPrice: '1',
        credentials: prepared.fields,
        okxDemoHeaders: prepared.okxDemoHeaders,
        operation: 'query',
        adapterOrderId: command.adapterOrderId,
      });
    } catch (error) {
      return Object.freeze({
        outcome: 'unknown',
        mode: 'live',
        adapterOrderId: command.adapterOrderId,
        clientOrderId: command.clientOrderId,
        reconciliationRequired: true,
        ambiguityReason: safeCredentialErrorMessage(
          'live_query_build_failed',
          error instanceof Error ? error.message : undefined,
        ),
      });
    }

    try {
      const response = await this.http.execute({
        venue: command.venue,
        environment: prepared.egressEnvironment,
        pathAndQuery: signed.pathAndQuery,
        method: signed.method,
        headers: sanitizeOutboundHeaders(signed.headers),
        body: signed.body,
      });
      if (!response.ok) {
        return Object.freeze({
          outcome: 'unknown',
          mode: 'live',
          adapterOrderId: command.adapterOrderId,
          clientOrderId: command.clientOrderId,
          reconciliationRequired: true,
          ambiguityReason: `egress_denied:${response.detail.reason}`,
        });
      }
      return parseQueryResponse({
        adapterOrderId: command.adapterOrderId,
        clientOrderId: command.clientOrderId,
        status: response.status,
        bodyText: response.bodyText,
        venue: command.venue,
      });
    } catch (error) {
      return Object.freeze({
        outcome: 'unknown',
        mode: 'live',
        adapterOrderId: command.adapterOrderId,
        clientOrderId: command.clientOrderId,
        reconciliationRequired: true,
        ambiguityReason: transportAmbiguityReason(error),
      });
    }
  }

  private async prepareAuth(command: {
    workspaceId: string;
    venue: LiveVenueId;
    tradingEnvironment: string;
    vaultType: LiveExecutionCommand['vaultType'];
    purpose: LiveExecutionCommand['purpose'];
    clientClaimedEnvironment?: string | null;
  }): Promise<
    | Readonly<{
        ok: true;
        fields: Readonly<Record<string, string>>;
        egressEnvironment: 'live' | 'testnet';
        okxDemoHeaders: Readonly<Record<string, string>> | null;
      }>
    | Readonly<{ ok: false; reason: string }>
  > {
    const record = await this.credentials.resolve({
      workspaceId: command.workspaceId,
      type: command.vaultType,
      purpose: command.purpose,
      executionMode: 'live',
    });
    if (!record) {
      return Object.freeze({ ok: false, reason: 'credential_unavailable_or_forbidden' });
    }

    const binding = assertLiveCredentialEnvironmentBinding(
      {
        workspaceId: record.workspaceId,
        vaultType: record.type,
        purpose: record.purpose,
      },
      {
        workspaceId: command.workspaceId,
        venue: command.venue,
        endpointEnvironment: command.tradingEnvironment,
        executionMode: 'live',
        clientClaimedEnvironment: command.clientClaimedEnvironment,
        requestHeaders:
          command.venue === 'OKX' && command.tradingEnvironment === 'demo'
            ? { 'x-simulated-trading': '1' }
            : command.venue === 'OKX' && command.tradingEnvironment === 'live'
              ? {}
              : null,
      },
    );

    if (!binding.ok) {
      return Object.freeze({
        ok: false,
        reason: liveCredentialBindingErrorMessage(binding.reason),
      });
    }

    return Object.freeze({
      ok: true,
      fields: record.fields,
      egressEnvironment: binding.egressEnvironment,
      okxDemoHeaders: binding.okxDemoHeaders,
    });
  }
}

function sanitizeOutboundHeaders(
  headers: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  // Headers are sent on the wire; never logged here.
  return Object.freeze({ ...headers });
}

function transportAmbiguityReason(error: unknown): string {
  if (error instanceof Error) {
    const name = error.name;
    const msg = redactCredentialMaterial(error.message).slice(0, 80);
    if (name === 'AbortError' || /timeout|ETIMEDOUT|aborted/i.test(msg)) {
      return 'transport_timeout_after_possible_transmission';
    }
    if (/ECONNRESET|EPIPE|socket/i.test(msg)) {
      return 'connection_reset_after_possible_transmission';
    }
    return `transport_error_after_possible_transmission:${msg}`;
  }
  return 'transport_error_after_possible_transmission';
}

function parseSubmitResponse(input: {
  venue: LiveVenueId;
  clientOrderId: string;
  contextHash: string;
  status: number;
  bodyText: string;
}): AdapterSubmissionResult {
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(input.bodyText) as Record<string, unknown>;
  } catch {
    return Object.freeze({
      mode: 'live',
      outcome: 'unknown',
      clientOrderId: input.clientOrderId,
      ambiguityReason: 'malformed_venue_submit_response',
      executionContextHash: input.contextHash,
    });
  }

  if (input.status >= 500 || input.status === 429) {
    return Object.freeze({
      mode: 'live',
      outcome: 'unknown',
      clientOrderId: input.clientOrderId,
      ambiguityReason: `venue_http_${input.status}_after_possible_transmission`,
      executionContextHash: input.contextHash,
    });
  }

  if (input.venue === 'BINANCE') {
    const code = body.code;
    if (typeof code === 'number' && code < 0) {
      return Object.freeze({
        mode: 'live',
        outcome: 'rejected',
        clientOrderId: input.clientOrderId,
        rejectionReason: `binance_reject:${code}`,
      });
    }
    const orderId = body.orderId !== undefined ? String(body.orderId) : null;
    const status = typeof body.status === 'string' ? body.status : '';
    if (orderId && (status === 'NEW' || status === 'PARTIALLY_FILLED' || status === 'FILLED')) {
      // ADP1: never invent PaperFillFact from venue — acknowledge only.
      return Object.freeze({
        mode: 'live',
        outcome: 'acknowledged',
        adapterOrderId: orderId,
        clientOrderId: input.clientOrderId,
        executionContextHash: input.contextHash,
      });
    }
    if (input.status >= 400) {
      return Object.freeze({
        mode: 'live',
        outcome: 'rejected',
        clientOrderId: input.clientOrderId,
        rejectionReason: `binance_http_${input.status}`,
      });
    }
    return Object.freeze({
      mode: 'live',
      outcome: 'unknown',
      clientOrderId: input.clientOrderId,
      ambiguityReason: 'binance_unrecognized_submit_shape',
      executionContextHash: input.contextHash,
      adapterOrderId: orderId,
    });
  }

  if (input.venue === 'BYBIT') {
    const retCode = body.retCode;
    if (retCode !== 0 && retCode !== '0') {
      if (input.status >= 400) {
        return Object.freeze({
          mode: 'live',
          outcome: 'rejected',
          clientOrderId: input.clientOrderId,
          rejectionReason: `bybit_reject:${String(retCode)}`,
        });
      }
      return Object.freeze({
        mode: 'live',
        outcome: 'unknown',
        clientOrderId: input.clientOrderId,
        ambiguityReason: `bybit_retCode_${String(retCode)}`,
        executionContextHash: input.contextHash,
      });
    }
    const result = (body.result ?? {}) as Record<string, unknown>;
    const orderId = result.orderId !== undefined ? String(result.orderId) : null;
    if (orderId) {
      return Object.freeze({
        mode: 'live',
        outcome: 'acknowledged',
        adapterOrderId: orderId,
        clientOrderId: input.clientOrderId,
        executionContextHash: input.contextHash,
      });
    }
    return Object.freeze({
      mode: 'live',
      outcome: 'unknown',
      clientOrderId: input.clientOrderId,
      ambiguityReason: 'bybit_missing_order_id',
      executionContextHash: input.contextHash,
    });
  }

  // OKX
  const code = body.code;
  if (code !== undefined && code !== '0' && code !== 0) {
    return Object.freeze({
      mode: 'live',
      outcome: 'rejected',
      clientOrderId: input.clientOrderId,
      rejectionReason: `okx_reject:${String(code)}`,
    });
  }
  const data = Array.isArray(body.data) ? body.data[0] : undefined;
  const row = (data ?? {}) as Record<string, unknown>;
  const orderId = row.ordId !== undefined ? String(row.ordId) : null;
  if (orderId) {
    return Object.freeze({
      mode: 'live',
      outcome: 'acknowledged',
      adapterOrderId: orderId,
      clientOrderId: input.clientOrderId,
      executionContextHash: input.contextHash,
    });
  }
  return Object.freeze({
    mode: 'live',
    outcome: 'unknown',
    clientOrderId: input.clientOrderId,
    ambiguityReason: 'okx_unrecognized_submit_shape',
    executionContextHash: input.contextHash,
  });
}

function parseCancelResponse(input: {
  venue: LiveVenueId;
  adapterOrderId: string;
  idempotencyKey: string;
  status: number;
  bodyText: string;
}): AdapterCancellationResult {
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(input.bodyText) as Record<string, unknown>;
  } catch {
    return Object.freeze({
      outcome: 'unknown',
      mode: 'live',
      adapterOrderId: input.adapterOrderId,
      idempotencyKey: input.idempotencyKey,
      ambiguityReason: 'malformed_venue_cancel_response',
    });
  }

  if (input.status >= 500 || input.status === 0) {
    return Object.freeze({
      outcome: 'unknown',
      mode: 'live',
      adapterOrderId: input.adapterOrderId,
      idempotencyKey: input.idempotencyKey,
      ambiguityReason: `cancel_http_${input.status}_after_possible_transmission`,
    });
  }

  const text = input.bodyText.toLowerCase();
  if (/already.*fill|filled/i.test(text) || body.status === 'FILLED') {
    return Object.freeze({
      outcome: 'already_filled',
      mode: 'live',
      adapterOrderId: input.adapterOrderId,
      idempotencyKey: input.idempotencyKey,
    });
  }
  if (/already.*cancel|canceled|cancelled/i.test(text) || body.status === 'CANCELED') {
    return Object.freeze({
      outcome: 'already_cancelled',
      mode: 'live',
      adapterOrderId: input.adapterOrderId,
      idempotencyKey: input.idempotencyKey,
    });
  }

  if (input.venue === 'BINANCE' && typeof body.orderId !== 'undefined') {
    return Object.freeze({
      outcome: 'cancel_acknowledged',
      mode: 'live',
      adapterOrderId: input.adapterOrderId,
      idempotencyKey: input.idempotencyKey,
    });
  }
  if (input.venue === 'BYBIT' && (body.retCode === 0 || body.retCode === '0')) {
    return Object.freeze({
      outcome: 'cancel_acknowledged',
      mode: 'live',
      adapterOrderId: input.adapterOrderId,
      idempotencyKey: input.idempotencyKey,
    });
  }
  if (input.venue === 'OKX' && (body.code === '0' || body.code === 0)) {
    return Object.freeze({
      outcome: 'cancel_acknowledged',
      mode: 'live',
      adapterOrderId: input.adapterOrderId,
      idempotencyKey: input.idempotencyKey,
    });
  }

  if (input.status >= 400) {
    return Object.freeze({
      outcome: 'rejected',
      mode: 'live',
      adapterOrderId: input.adapterOrderId,
      idempotencyKey: input.idempotencyKey,
      reason: `cancel_http_${input.status}`,
    });
  }

  return Object.freeze({
    outcome: 'unknown',
    mode: 'live',
    adapterOrderId: input.adapterOrderId,
    idempotencyKey: input.idempotencyKey,
    ambiguityReason: 'cancel_unrecognized_venue_shape',
  });
}

function parseQueryResponse(input: {
  venue: LiveVenueId;
  adapterOrderId: string | null;
  clientOrderId: string;
  status: number;
  bodyText: string;
}): AdapterOrderQueryResult {
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(input.bodyText) as Record<string, unknown>;
  } catch {
    return Object.freeze({
      outcome: 'unknown',
      mode: 'live',
      adapterOrderId: input.adapterOrderId,
      clientOrderId: input.clientOrderId,
      reconciliationRequired: true,
      ambiguityReason: 'malformed_venue_query_response',
    });
  }

  if (input.venue === 'BINANCE') {
    const status = typeof body.status === 'string' ? body.status : '';
    const mapped = mapBinanceStatus(status);
    return Object.freeze({
      outcome: mapped,
      mode: 'live',
      adapterOrderId: body.orderId !== undefined ? String(body.orderId) : input.adapterOrderId,
      clientOrderId: input.clientOrderId,
      reconciliationRequired: mapped === 'unknown',
      venueStatus: status,
    });
  }

  if (input.venue === 'BYBIT') {
    const result = (body.result ?? {}) as Record<string, unknown>;
    const list = Array.isArray(result.list) ? result.list[0] : result;
    const row = (list ?? {}) as Record<string, unknown>;
    const status = typeof row.orderStatus === 'string' ? row.orderStatus : '';
    const mapped = mapBybitStatus(status);
    return Object.freeze({
      outcome: mapped,
      mode: 'live',
      adapterOrderId: row.orderId !== undefined ? String(row.orderId) : input.adapterOrderId,
      clientOrderId: input.clientOrderId,
      reconciliationRequired: mapped === 'unknown',
      venueStatus: status,
    });
  }

  const data = Array.isArray(body.data) ? body.data[0] : undefined;
  const row = (data ?? {}) as Record<string, unknown>;
  const status = typeof row.state === 'string' ? row.state : '';
  const mapped = mapOkxStatus(status);
  return Object.freeze({
    outcome: mapped,
    mode: 'live',
    adapterOrderId: row.ordId !== undefined ? String(row.ordId) : input.adapterOrderId,
    clientOrderId: input.clientOrderId,
    reconciliationRequired: mapped === 'unknown',
    venueStatus: status,
  });
}

function mapBinanceStatus(
  status: string,
): 'accepted' | 'rejected' | 'filled' | 'cancelled' | 'unknown' {
  if (status === 'NEW' || status === 'PARTIALLY_FILLED') return 'accepted';
  if (status === 'FILLED') return 'filled';
  if (status === 'CANCELED' || status === 'EXPIRED') return 'cancelled';
  if (status === 'REJECTED') return 'rejected';
  return 'unknown';
}

function mapBybitStatus(
  status: string,
): 'accepted' | 'rejected' | 'filled' | 'cancelled' | 'unknown' {
  if (status === 'New' || status === 'PartiallyFilled') return 'accepted';
  if (status === 'Filled') return 'filled';
  if (status === 'Cancelled' || status === 'Deactivated') return 'cancelled';
  if (status === 'Rejected') return 'rejected';
  return 'unknown';
}

function mapOkxStatus(
  status: string,
): 'accepted' | 'rejected' | 'filled' | 'cancelled' | 'unknown' {
  if (status === 'live' || status === 'partially_filled') return 'accepted';
  if (status === 'filled') return 'filled';
  if (status === 'canceled') return 'cancelled';
  return 'unknown';
}

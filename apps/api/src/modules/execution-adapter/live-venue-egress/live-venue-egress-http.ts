/**
 * V3-L02-S-ADP1 — DNS-pinned live venue HTTPS transport (rebinding control).
 *
 * Reuses security-platform Web Push pinning pattern:
 * resolve → validate public IPs → HTTPS agent lookup pinned to those IPs
 * while TLS SNI/hostname verification still uses the allowlisted hostname.
 *
 * Real venue I/O is disabled unless explicitly enabled AND DNS pin is available.
 * Default production composition keeps allowRealVenueIo=false (mocked tests inject fetch).
 */

import { request as httpsRequest } from 'node:https';
import {
  createWebPushPinnedHttpsAgent,
  defaultWebPushDnsResolve,
  isNonPublicOutboundIp,
  type WebPushDnsResolveFn,
  type WebPushResolvedAddress,
} from '../../../security-platform';
import type { LiveVenueEnvironment, LiveVenueId } from './live-venue-allowlist';
import {
  assertLiveVenueEgress,
  assertLiveVenueEgressWithDns,
  buildLiveVenueRequestUrl,
  type LiveVenueDnsResolveFn,
  type LiveVenueEgressResult,
} from './live-venue-egress-policy';

export const LIVE_VENUE_EGRESS_TIMEOUT_MS = 10_000;
export const MAX_LIVE_VENUE_EGRESS_BODY_CHARS = 65_536;

export type LiveVenueEgressFetch = (
  input: string,
  init: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Readonly<Record<string, string>>;
    body?: string;
    redirect: 'error';
    signal: AbortSignal;
  },
) => Promise<{ status: number; text(): Promise<string> }>;

export type LiveVenueEgressHttpRequest = Readonly<{
  venue: LiveVenueId;
  environment: LiveVenueEnvironment;
  pathAndQuery: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Readonly<Record<string, string>>;
  body?: string;
}>;

export type LiveVenueEgressHttpResult =
  | Readonly<{ ok: true; status: number; bodyText: string; url: string }>
  | Readonly<{ ok: false; detail: LiveVenueEgressResult & { ok: false } }>;

export type LiveVenueEgressHttpClientOptions = Readonly<{
  /** Injected for tests. When omitted and allowRealVenueIo=false → I/O refused. */
  fetchFn?: LiveVenueEgressFetch;
  timeoutMs?: number;
  resolveDns?: LiveVenueDnsResolveFn;
  /**
   * When true, permits real outbound HTTPS via DNS-pinned agent.
   * Default false — ADP1 keeps runtime live I/O gated/blocked.
   */
  allowRealVenueIo?: boolean;
}>;

/**
 * HTTP client for live ExecutionAdapterPort adapters (ADP1).
 * Not a generic URL fetcher. Paper never uses this client.
 */
export class LiveVenueEgressHttpClient {
  private readonly fetchFn: LiveVenueEgressFetch | undefined;
  private readonly timeoutMs: number;
  private readonly resolveDns: LiveVenueDnsResolveFn | undefined;
  private readonly allowRealVenueIo: boolean;

  constructor(options: LiveVenueEgressHttpClientOptions = {}) {
    this.fetchFn = options.fetchFn;
    this.timeoutMs = options.timeoutMs ?? LIVE_VENUE_EGRESS_TIMEOUT_MS;
    this.resolveDns = options.resolveDns;
    this.allowRealVenueIo = options.allowRealVenueIo === true;
  }

  get realVenueIoEnabled(): boolean {
    return this.allowRealVenueIo;
  }

  async execute(request: LiveVenueEgressHttpRequest): Promise<LiveVenueEgressHttpResult> {
    const built = buildLiveVenueRequestUrl({
      venue: request.venue,
      environment: request.environment,
      pathAndQuery: request.pathAndQuery,
    });
    if (!built.ok) {
      return Object.freeze({ ok: false, detail: built });
    }

    // Syntactic EG1 check first (always).
    const syntactic = assertLiveVenueEgress({
      targetUrl: built.url.toString(),
      venue: request.venue,
      environment: request.environment,
      executionMode: 'live',
    });
    if (!syntactic.ok) {
      return Object.freeze({ ok: false, detail: syntactic });
    }

    if (this.fetchFn) {
      // Test / injected transport: optional DNS policy when resolver provided.
      const egress = await assertLiveVenueEgressWithDns({
        targetUrl: built.url.toString(),
        venue: request.venue,
        environment: request.environment,
        executionMode: 'live',
        resolveDns: this.resolveDns,
        enforceResolvedIpPolicy: this.resolveDns !== undefined,
      });
      if (!egress.ok) {
        return Object.freeze({ ok: false, detail: egress });
      }
      return this.dispatchFetch(egress.url.toString(), request);
    }

    if (!this.allowRealVenueIo) {
      return Object.freeze({
        ok: false,
        detail: Object.freeze({
          ok: false as const,
          reason: 'missing_configuration' as const,
        }),
      });
    }

    // Real I/O path: mandatory DNS resolve + public-IP policy + pinned agent.
    const resolveDns = this.resolveDns ?? (defaultWebPushDnsResolve as LiveVenueDnsResolveFn);
    const egress = await assertLiveVenueEgressWithDns({
      targetUrl: built.url.toString(),
      venue: request.venue,
      environment: request.environment,
      executionMode: 'live',
      resolveDns,
      enforceResolvedIpPolicy: true,
    });
    if (!egress.ok) {
      return Object.freeze({ ok: false, detail: egress });
    }

    let pinned: readonly WebPushResolvedAddress[];
    try {
      const resolved = await (resolveDns as WebPushDnsResolveFn)(egress.url.hostname);
      pinned = Object.freeze(
        resolved.filter((entry) => !isNonPublicOutboundIp(entry.address, entry.family)),
      );
    } catch {
      return Object.freeze({
        ok: false,
        detail: Object.freeze({ ok: false as const, reason: 'dns_failure' as const }),
      });
    }
    if (pinned.length === 0) {
      return Object.freeze({
        ok: false,
        detail: Object.freeze({
          ok: false as const,
          reason: 'blocked_resolved_address' as const,
        }),
      });
    }

    return this.dispatchPinnedHttps(egress.url, request, pinned);
  }

  private async dispatchFetch(
    url: string,
    request: LiveVenueEgressHttpRequest,
  ): Promise<LiveVenueEgressHttpResult> {
    const fetchFn = this.fetchFn!;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetchFn(url, {
        method: request.method ?? 'GET',
        headers: request.headers ? { ...request.headers } : undefined,
        body: request.body,
        redirect: 'error',
        signal: controller.signal,
      });
      const raw = await response.text();
      const bodyText =
        raw.length > MAX_LIVE_VENUE_EGRESS_BODY_CHARS
          ? raw.slice(0, MAX_LIVE_VENUE_EGRESS_BODY_CHARS)
          : raw;
      return Object.freeze({
        ok: true,
        status: response.status,
        bodyText,
        url,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private dispatchPinnedHttps(
    url: URL,
    request: LiveVenueEgressHttpRequest,
    pinned: readonly WebPushResolvedAddress[],
  ): Promise<LiveVenueEgressHttpResult> {
    const agent = createWebPushPinnedHttpsAgent(pinned);
    const method = request.method ?? 'GET';
    const headers = request.headers ? { ...request.headers } : {};
    const body = request.body;

    return new Promise((resolve, reject) => {
      const req = httpsRequest(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || 443,
          path: `${url.pathname}${url.search}`,
          method,
          headers,
          agent,
          timeout: this.timeoutMs,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            const bodyText =
              raw.length > MAX_LIVE_VENUE_EGRESS_BODY_CHARS
                ? raw.slice(0, MAX_LIVE_VENUE_EGRESS_BODY_CHARS)
                : raw;
            resolve(
              Object.freeze({
                ok: true as const,
                status: res.statusCode ?? 0,
                bodyText,
                url: url.toString(),
              }),
            );
          });
        },
      );
      req.on('timeout', () => {
        req.destroy(Object.assign(new Error('live_venue_egress_timeout'), { code: 'ETIMEDOUT' }));
      });
      req.on('error', (error: Error) => {
        // Ambiguity after possible transmission is handled by the adapter (UNKNOWN).
        reject(error);
      });
      if (body !== undefined) req.write(body);
      req.end();
    });
  }
}

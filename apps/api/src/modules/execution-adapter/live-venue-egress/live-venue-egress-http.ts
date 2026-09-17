/**
 * V3-L02-S-EG1 — Live venue HTTPS client bound to egress policy.
 *
 * Only constructs URLs from trusted allowlist origins + relative paths.
 * `redirect: 'error'` — redirects never followed (escape impossible).
 * Does not implement submit/cancel/reconcile/auth. Does not contact venues in tests
 * when a fake fetch is injected.
 */

import type { LiveVenueEnvironment, LiveVenueId } from './live-venue-allowlist';
import {
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

/**
 * HTTP client for future live ExecutionAdapterPort adapters (ADP1).
 * Not bound into PaperExecutionAdapter. Not a generic URL fetcher.
 */
export class LiveVenueEgressHttpClient {
  private readonly fetchFn: LiveVenueEgressFetch;
  private readonly timeoutMs: number;
  private readonly resolveDns: LiveVenueDnsResolveFn | undefined;

  constructor(
    options: Readonly<{
      fetchFn?: LiveVenueEgressFetch;
      timeoutMs?: number;
      resolveDns?: LiveVenueDnsResolveFn;
    }> = {},
  ) {
    this.fetchFn = options.fetchFn ?? (fetch as LiveVenueEgressFetch);
    this.timeoutMs = options.timeoutMs ?? LIVE_VENUE_EGRESS_TIMEOUT_MS;
    this.resolveDns = options.resolveDns;
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

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchFn(egress.url.toString(), {
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
        url: egress.url.toString(),
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

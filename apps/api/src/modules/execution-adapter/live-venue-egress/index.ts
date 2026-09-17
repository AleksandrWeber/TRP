/**
 * V3-L02-S-EG1 — Live venue egress public exports (SB-01).
 * Available for future ExecutionAdapterPort live adapters. Not wired to Paper.
 */

export {
  LIVE_VENUE_IDS,
  LIVE_VENUE_ENVIRONMENTS,
  LIVE_VENUE_ALLOWED_HOSTS,
  LIVE_VENUE_ALLOWED_PORT,
  NON_LIVE_EXECUTION_MODES,
  allowedHostsFor,
  isLiveVenueId,
  isLiveVenueEnvironment,
  liveVenueOrigin,
  type LiveVenueId,
  type LiveVenueEnvironment,
  type LiveVenueExecutionMode,
  type NonLiveExecutionMode,
} from './live-venue-allowlist';

export {
  assertLiveVenueEgress,
  assertLiveVenueEgressWithDns,
  assertLiveVenueRedirectTarget,
  buildLiveVenueRequestUrl,
  rejectUserControlledLiveDestination,
  type AssertLiveVenueEgressInput,
  type LiveVenueDnsResolveFn,
  type LiveVenueEgressDenyReason,
  type LiveVenueEgressResult,
} from './live-venue-egress-policy';

export {
  LiveVenueEgressHttpClient,
  LIVE_VENUE_EGRESS_TIMEOUT_MS,
  MAX_LIVE_VENUE_EGRESS_BODY_CHARS,
  type LiveVenueEgressFetch,
  type LiveVenueEgressHttpRequest,
  type LiveVenueEgressHttpResult,
} from './live-venue-egress-http';

export {
  TRADING_CREDENTIAL_ENVIRONMENTS,
  tradingEnvironmentFromPurpose,
  purposeForTradingEnvironment,
  egressEnvironmentForCredential,
  okxDemoHeadersRequired,
  OKX_DEMO_TRADING_HEADER_NAME,
  OKX_DEMO_TRADING_HEADER_VALUE,
  type TradingCredentialEnvironment,
} from './trading-credential-environment';

export {
  assertLiveCredentialEnvironmentBinding,
  assertMayRetrieveTradingCredential,
  redactCredentialMaterial,
  liveCredentialBindingErrorMessage,
  type TrustedCredentialBindingInput,
  type RequestedLiveCredentialUse,
  type LiveCredentialEnvironmentBindingResult,
  type LiveCredentialEnvironmentDenyReason,
} from './live-credential-environment-policy';

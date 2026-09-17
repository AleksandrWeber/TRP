/**
 * V3-L02-S-ADP1 — Live ExecutionAdapterPort + I/O gate contract tests.
 * ZERO real venue network calls. Synthetic credentials only. Vitest + mocked fetch.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { Role } from '../../identity/role';
import { SecretPurpose } from '../../secret-vault/secret-purpose';
import { FinancialRounding } from '../../financial';
import { WorkspaceLivePolicy } from '../../workspace/live-policy/durable-workspace-live-policy-state';
import { InMemoryHumanStartProofStore } from '../../trading-session/live-admission/in-memory-human-start-proof.store';
import { LiveAdmissionService } from '../../trading-session/live-admission/live-admission.service';
import {
  PaperLimitFillPolicy,
  PaperMarketFillPolicy,
  createPaperFillConfiguration,
} from '../paper-fill-configuration';
import { PaperExecutionAdapter } from '../paper-execution.adapter';
import {
  assertLiveVenueEgress,
  assertMayRetrieveTradingCredential,
  liveVenueOrigin,
  redactCredentialMaterial,
} from '../live-venue-egress';
import type { LiveVenueEgressFetch } from '../live-venue-egress/live-venue-egress-http';
import type { HoldableSecretType } from '../../secret-vault/holdable-secret-type';
import type { TradingCredentialEnvironment } from '../live-venue-egress/trading-credential-environment';
import type { LiveVenueId } from '../live-venue-egress/live-venue-allowlist';
import type { LiveExecutionCommand, LiveCancelCommand } from '../execution-adapter.port';
import { LiveVenueExecutionAdapter } from './live-venue-execution.adapter';
import { InMemoryLiveTradingCredentialProvider } from './live-trading-credential.provider';
import { assertLiveVenueIoPreconditions, LIVE_VENUE_IO_ACTION_SUBMIT } from './live-venue-io-gate';
import { RoutingExecutionAdapter } from './routing-execution.adapter';

const NOW = '2026-09-17T12:00:00.000Z';
const WS = 'ws-adp1-1';
const ACTOR = 'actor-adp1-1';
const SESS = 'sess-adp1-1';
const ACTION = LIVE_VENUE_IO_ACTION_SUBMIT;

const SYNTH_KEY = 'synth-api-key-adp1';
const SYNTH_SECRET = 'synth-api-secret-adp1';
const SYNTH_PASSPHRASE = 'synth-passphrase-adp1';

const sessionFacts = Object.freeze({
  sessionId: SESS,
  workspaceId: WS,
  actorId: ACTOR,
  lifecycleEligible: true,
  executionModeCompatible: true,
});

function createAdmissionService(options?: {
  policy?: WorkspaceLivePolicy;
  killArmed?: boolean;
  gatePass?: boolean;
}) {
  const store = new InMemoryHumanStartProofStore();
  const policy = options?.policy ?? WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN;
  const livePolicy = {
    loadState: vi.fn(async (workspaceId: string) => ({
      workspaceId,
      policy,
      schemaVersion: 1,
      updatedAt: NOW,
    })),
    resolveEffectivePolicy: vi.fn(async () => policy),
  };
  const killSwitch = {
    loadState: vi.fn(async (workspaceId: string) =>
      options?.killArmed
        ? {
            workspaceId,
            armed: true,
            reason: 'stop',
            armedAt: NOW,
            armedByActorId: 'ops',
            clearedAt: null,
            clearedByActorId: null,
            correlationId: null,
            schemaVersion: 1,
            updatedAt: NOW,
          }
        : {
            workspaceId,
            armed: false,
            reason: null,
            armedAt: null,
            armedByActorId: null,
            clearedAt: null,
            clearedByActorId: null,
            correlationId: null,
            schemaVersion: 1,
            updatedAt: NOW,
          },
    ),
  };
  const gate = {
    validateForLiveAdmission: vi.fn(() =>
      options?.gatePass === false
        ? { outcome: 'fail' as const, validation: 'INVALID' as const }
        : { outcome: 'pass' as const, validation: 'VALID' as const },
    ),
  };
  const admission = new LiveAdmissionService(
    livePolicy as never,
    killSwitch as never,
    gate as never,
    store,
  );
  return { admission, store, livePolicy, killSwitch, gate };
}

async function issueToken(
  admission: LiveAdmissionService,
  overrides?: Partial<{
    actorId: string;
    workspaceId: string;
    sessionId: string;
    actionCommand: string;
    nowIso: string;
    ttlMs: number;
  }>,
) {
  return admission.issueHumanStart({
    actorId: overrides?.actorId ?? ACTOR,
    workspaceId: overrides?.workspaceId ?? WS,
    sessionId: overrides?.sessionId ?? SESS,
    actionCommand: overrides?.actionCommand ?? ACTION,
    nowIso: overrides?.nowIso ?? NOW,
    ttlMs: overrides?.ttlMs,
  });
}

function allowHarness(overrides?: {
  authorizationOverride?: 'allowed' | 'denied' | 'unknown';
  v2Overrides?: { liveCapitalAuthorized?: boolean; paperFreezeBlocksLive?: boolean };
}) {
  return {
    gateRequest: { libraryEntryId: 'lib-adp1' },
    v2Overrides: overrides?.v2Overrides ?? {
      liveCapitalAuthorized: true,
      paperFreezeBlocksLive: false,
    },
    authorizationOverride: overrides?.authorizationOverride ?? ('allowed' as const),
    evaluatedAt: NOW,
  };
}

function seedCredential(
  provider: InMemoryLiveTradingCredentialProvider,
  input: {
    workspaceId?: string;
    type: HoldableSecretType;
    purpose: SecretPurpose;
    withPassphrase?: boolean;
  },
) {
  const fields: Record<string, string> = {
    apiKey: SYNTH_KEY,
    apiSecret: SYNTH_SECRET,
  };
  if (input.withPassphrase || input.type === 'okx') {
    fields.passphrase = SYNTH_PASSPHRASE;
  }
  provider.seed({
    workspaceId: input.workspaceId ?? WS,
    type: input.type,
    purpose: input.purpose,
    fields: Object.freeze(fields),
  });
}

function liveSubmitCommand(
  overrides: Partial<LiveExecutionCommand> &
    Pick<LiveExecutionCommand, 'venue' | 'tradingEnvironment' | 'vaultType' | 'purpose'>,
): LiveExecutionCommand {
  return Object.freeze({
    mode: 'live' as const,
    workspaceId: overrides.workspaceId ?? WS,
    orderId: overrides.orderId ?? 'ord-1',
    clientOrderId: overrides.clientOrderId ?? 'clid-1',
    intentHash: overrides.intentHash ?? 'intent-hash-1',
    instrument: overrides.instrument ?? 'BTCUSDT',
    side: overrides.side ?? 'buy',
    type: overrides.type ?? 'limit',
    quantity: overrides.quantity ?? '0.01',
    limitPrice: overrides.limitPrice ?? '50000',
    venue: overrides.venue,
    tradingEnvironment: overrides.tradingEnvironment,
    vaultType: overrides.vaultType,
    purpose: overrides.purpose,
    clientClaimedEnvironment: overrides.clientClaimedEnvironment,
  });
}

function liveCancelCommand(
  overrides: Partial<LiveCancelCommand> &
    Pick<LiveCancelCommand, 'venue' | 'tradingEnvironment' | 'vaultType' | 'purpose'>,
): LiveCancelCommand {
  return Object.freeze({
    mode: 'live' as const,
    workspaceId: overrides.workspaceId ?? WS,
    orderId: overrides.orderId ?? 'ord-1',
    clientOrderId: overrides.clientOrderId ?? 'clid-1',
    adapterOrderId: overrides.adapterOrderId ?? 'venue-ord-1',
    idempotencyKey: overrides.idempotencyKey ?? 'cancel-idem-1',
    instrument: overrides.instrument ?? 'BTCUSDT',
    venue: overrides.venue,
    tradingEnvironment: overrides.tradingEnvironment,
    vaultType: overrides.vaultType,
    purpose: overrides.purpose,
    clientClaimedEnvironment: overrides.clientClaimedEnvironment,
  });
}

function venueSuccessBody(url: string): string {
  if (url.includes('binance')) {
    return JSON.stringify({ orderId: 9001, status: 'NEW', clientOrderId: 'clid-1' });
  }
  if (url.includes('bybit')) {
    return JSON.stringify({ retCode: 0, result: { orderId: 'bybit-9001' } });
  }
  if (url.includes('okx')) {
    return JSON.stringify({ code: '0', data: [{ ordId: 'okx-9001' }] });
  }
  return JSON.stringify({ orderId: 'unknown-9001', status: 'NEW' });
}

function mockFetch(spy?: ReturnType<typeof vi.fn>): LiveVenueEgressFetch {
  const fn =
    spy ??
    vi.fn(async (url: string) => ({
      status: 200,
      text: async () => venueSuccessBody(url),
    }));
  return fn as LiveVenueEgressFetch;
}

function createLiveAdapter(options?: {
  provider?: InMemoryLiveTradingCredentialProvider;
  fetchFn?: LiveVenueEgressFetch;
  resolveDns?: (hostname: string) => Promise<readonly { address: string; family: 4 | 6 }[]>;
  allowRealVenueIo?: boolean;
}) {
  const provider = options?.provider ?? new InMemoryLiveTradingCredentialProvider();
  const fetchFn = options?.fetchFn ?? mockFetch();
  return {
    provider,
    fetchFn,
    adapter: new LiveVenueExecutionAdapter({
      credentialProvider: provider,
      fetchFn,
      resolveDns: options?.resolveDns,
      allowRealVenueIo: options?.allowRealVenueIo,
    }),
  };
}

function purposeForEnv(env: TradingCredentialEnvironment): SecretPurpose {
  if (env === 'testnet') return SecretPurpose.TradingTestnet;
  if (env === 'demo') return SecretPurpose.TradingDemo;
  return SecretPurpose.TradingLive;
}

function vaultTypeFor(venue: LiveVenueId): HoldableSecretType {
  if (venue === 'BINANCE') return 'binance';
  if (venue === 'BYBIT') return 'bybit';
  return 'okx';
}

function paperConfig() {
  return createPaperFillConfiguration({
    mode: 'paper',
    configurationId: 'paper-adp1',
    version: 1,
    feeRateBps: '10',
    slippageBps: '5',
    precision: {
      priceScale: 8,
      quantityScale: 6,
      moneyScale: 8,
      feeScale: 8,
      rounding: FinancialRounding.HALF_EVEN,
    },
    marketFillPolicy: PaperMarketFillPolicy.ALL_OR_NONE,
    limitFillPolicy: PaperLimitFillPolicy.CROSS_THEN_ALL_OR_NONE,
  });
}

describe('V3-L02-S-ADP1 live execution adapter', () => {
  // —— GATE (1–14) ——

  // 1. C7 deny → c7_denied; adapter/fetch never called
  it('1 — C7 deny (no authorizationOverride) → c7_denied; fetch never called', async () => {
    const fetchFn = vi.fn(async () => ({ status: 200, text: async () => '{}' }));
    const { admission } = createAdmissionService();
    const issued = await issueToken(admission);
    const gate = await assertLiveVenueIoPreconditions({
      admission,
      command: {
        workspaceId: WS,
        sessionId: SESS,
        actorId: ACTOR,
        actorRole: Role.Trader,
        humanStartToken: issued.token,
        actionCommand: ACTION,
        session: sessionFacts,
        v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
        // no authorizationOverride → production C7 deny-all
        evaluatedAt: NOW,
      },
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.reason).toBe('c7_denied');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('1b — C7 deny (authorizationOverride denied) → c7_denied', async () => {
    const { admission } = createAdmissionService();
    const issued = await issueToken(admission);
    const gate = await assertLiveVenueIoPreconditions({
      admission,
      command: {
        workspaceId: WS,
        sessionId: SESS,
        actorId: ACTOR,
        actorRole: Role.Trader,
        humanStartToken: issued.token,
        actionCommand: ACTION,
        session: sessionFacts,
        ...allowHarness({ authorizationOverride: 'denied' }),
      },
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.reason).toBe('c7_denied');
  });

  // 2. S04 deny (Gate fail)
  it('2 — S04 deny (Gate fail) → s04_denied', async () => {
    const { admission } = createAdmissionService({ gatePass: false });
    const issued = await issueToken(admission);
    const gate = await assertLiveVenueIoPreconditions({
      admission,
      command: {
        workspaceId: WS,
        sessionId: SESS,
        actorId: ACTOR,
        actorRole: Role.Trader,
        humanStartToken: issued.token,
        actionCommand: ACTION,
        session: sessionFacts,
        ...allowHarness(),
      },
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.reason).toBe('s04_denied');
  });

  // 3. human-start invalid
  it('3 — human-start invalid token → human_start_invalid', async () => {
    const { admission } = createAdmissionService();
    const gate = await assertLiveVenueIoPreconditions({
      admission,
      command: {
        workspaceId: WS,
        sessionId: SESS,
        actorId: ACTOR,
        actorRole: Role.Trader,
        humanStartToken: 'not-a-valid-human-start-token',
        actionCommand: ACTION,
        session: sessionFacts,
        ...allowHarness(),
      },
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.reason).toBe('human_start_invalid');
  });

  // 4. human-start expired
  it('4 — human-start expired → human_start_expired', async () => {
    const { admission } = createAdmissionService();
    const issued = await issueToken(admission, { ttlMs: 1_000 });
    const gate = await assertLiveVenueIoPreconditions({
      admission,
      command: {
        workspaceId: WS,
        sessionId: SESS,
        actorId: ACTOR,
        actorRole: Role.Trader,
        humanStartToken: issued.token,
        actionCommand: ACTION,
        session: sessionFacts,
        ...allowHarness(),
        evaluatedAt: '2026-09-17T12:30:00.000Z',
      },
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.reason).toBe('human_start_expired');
  });

  // 5. human-start already claimed (concurrent → claim_denied already_claimed/replayed)
  it('5 — human-start already claimed → one allow + one human_start_already_claimed', async () => {
    const { admission } = createAdmissionService();
    const issued = await issueToken(admission);
    const command = {
      workspaceId: WS,
      sessionId: SESS,
      actorId: ACTOR,
      actorRole: Role.Trader,
      humanStartToken: issued.token,
      actionCommand: ACTION,
      session: sessionFacts,
      ...allowHarness(),
    };
    const [a, b] = await Promise.all([
      assertLiveVenueIoPreconditions({ admission, command }),
      assertLiveVenueIoPreconditions({ admission, command }),
    ]);
    const allowed = [a, b].filter((r) => r.ok);
    const denied = [a, b].filter((r) => !r.ok);
    expect(allowed).toHaveLength(1);
    expect(denied).toHaveLength(1);
    if (allowed[0]?.ok) {
      expect(allowed[0].claimMeansVenueSubmitted).toBe(false);
    }
    if (!denied[0]?.ok) {
      expect(['human_start_already_claimed', 'human_start_invalid', 's04_denied']).toContain(
        denied[0].reason,
      );
    }
  });

  // 6–8. wrong workspace / actor / session
  it('6 — wrong workspace → gate deny (workspace / human-start binding)', async () => {
    const { admission } = createAdmissionService();
    const issued = await issueToken(admission);
    const gate = await assertLiveVenueIoPreconditions({
      admission,
      command: {
        workspaceId: 'ws-other',
        sessionId: SESS,
        actorId: ACTOR,
        actorRole: Role.Trader,
        humanStartToken: issued.token,
        actionCommand: ACTION,
        session: { ...sessionFacts, workspaceId: 'ws-other' },
        ...allowHarness(),
      },
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(['workspace_mismatch', 'human_start_invalid', 'session_ineligible']).toContain(
        gate.reason,
      );
    }
  });

  it('7 — wrong actor → gate deny (actor / human-start binding)', async () => {
    const { admission } = createAdmissionService();
    const issued = await issueToken(admission);
    const gate = await assertLiveVenueIoPreconditions({
      admission,
      command: {
        workspaceId: WS,
        sessionId: SESS,
        actorId: 'actor-other',
        actorRole: Role.Trader,
        humanStartToken: issued.token,
        actionCommand: ACTION,
        session: { ...sessionFacts, actorId: 'actor-other' },
        ...allowHarness(),
      },
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(['actor_mismatch', 'human_start_invalid', 'session_ineligible']).toContain(
        gate.reason,
      );
    }
  });

  it('8 — wrong session → gate deny (session / human-start binding)', async () => {
    const { admission } = createAdmissionService();
    const issued = await issueToken(admission);
    const gate = await assertLiveVenueIoPreconditions({
      admission,
      command: {
        workspaceId: WS,
        sessionId: 'sess-other',
        actorId: ACTOR,
        actorRole: Role.Trader,
        humanStartToken: issued.token,
        actionCommand: ACTION,
        session: { ...sessionFacts, sessionId: 'sess-other' },
        ...allowHarness(),
      },
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) {
      expect(['session_mismatch', 'session_ineligible', 'human_start_invalid']).toContain(
        gate.reason,
      );
    }
  });

  // 9. policy PAPER
  it('9 — policy PAPER → policy_paper', async () => {
    const { admission } = createAdmissionService({
      policy: WorkspaceLivePolicy.PAPER,
    });
    const issued = await issueToken(admission);
    const gate = await assertLiveVenueIoPreconditions({
      admission,
      command: {
        workspaceId: WS,
        sessionId: SESS,
        actorId: ACTOR,
        actorRole: Role.Trader,
        humanStartToken: issued.token,
        actionCommand: ACTION,
        session: sessionFacts,
        ...allowHarness(),
      },
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.reason).toBe('policy_paper');
  });

  // 10. KS active
  it('10 — kill switch active → kill_switch_active', async () => {
    const { admission } = createAdmissionService({ killArmed: true });
    const issued = await issueToken(admission);
    const gate = await assertLiveVenueIoPreconditions({
      admission,
      command: {
        workspaceId: WS,
        sessionId: SESS,
        actorId: ACTOR,
        actorRole: Role.Trader,
        humanStartToken: issued.token,
        actionCommand: ACTION,
        session: sessionFacts,
        ...allowHarness(),
      },
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.reason).toBe('kill_switch_active');
  });

  // 11. session ineligible
  it('11 — session ineligible → session_ineligible', async () => {
    const { admission } = createAdmissionService();
    const issued = await issueToken(admission);
    const gate = await assertLiveVenueIoPreconditions({
      admission,
      command: {
        workspaceId: WS,
        sessionId: SESS,
        actorId: ACTOR,
        actorRole: Role.Trader,
        humanStartToken: issued.token,
        actionCommand: ACTION,
        session: { ...sessionFacts, lifecycleEligible: false },
        ...allowHarness(),
      },
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.reason).toBe('session_ineligible');
  });

  // 12. invalid credential environment → adapter reject
  it('12 — invalid credential environment → adapter reject', async () => {
    const { provider, adapter } = createLiveAdapter();
    seedCredential(provider, {
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const result = await adapter.submit(
      liveSubmitCommand({
        venue: 'BINANCE',
        tradingEnvironment: 'not-an-env' as TradingCredentialEnvironment,
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
    );
    expect(result.outcome).toBe('rejected');
    if (result.outcome === 'rejected') {
      expect(result.rejectionReason).toContain('live_credential_environment_denied');
      expect(result.rejectionReason).toContain('unknown_environment');
    }
  });

  // 13. venue mismatch → adapter reject
  it('13 — venue mismatch → adapter reject', async () => {
    const { provider, adapter } = createLiveAdapter();
    seedCredential(provider, {
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const result = await adapter.submit(
      liveSubmitCommand({
        venue: 'BYBIT',
        tradingEnvironment: 'live',
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
    );
    expect(result.outcome).toBe('rejected');
    if (result.outcome === 'rejected') {
      expect(result.rejectionReason).toContain('venue_mismatch');
    }
  });

  // 14. EG1 denial (wrong host) via policy — adapter uses allowlist only
  it('14 — EG1 denial (wrong host) via assertLiveVenueEgress', () => {
    const denied = assertLiveVenueEgress({
      targetUrl: 'https://evil.example/exfil',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.reason).toBe('unknown_host');
  });

  // —— claimMeansVenueSubmitted / realVenueIoEnabled / EmergencyManager (structural) ——

  it('claimMeansVenueSubmitted === false on successful gate', async () => {
    const { admission } = createAdmissionService();
    const issued = await issueToken(admission);
    const gate = await assertLiveVenueIoPreconditions({
      admission,
      command: {
        workspaceId: WS,
        sessionId: SESS,
        actorId: ACTOR,
        actorRole: Role.Trader,
        humanStartToken: issued.token,
        actionCommand: ACTION,
        session: sessionFacts,
        ...allowHarness(),
      },
    });
    expect(gate.ok).toBe(true);
    if (gate.ok) expect(gate.claimMeansVenueSubmitted).toBe(false);
  });

  it('realVenueIoEnabled false by default', () => {
    const adapter = new LiveVenueExecutionAdapter();
    expect(adapter.health().realVenueIoEnabled).toBe(false);
  });

  it('EmergencyManager / live-trading-engine not imported by adapter source', () => {
    const adapterPath = join(__dirname, 'live-venue-execution.adapter.ts');
    const gatePath = join(__dirname, 'live-venue-io-gate.ts');
    const routingPath = join(__dirname, 'routing-execution.adapter.ts');
    for (const path of [adapterPath, gatePath, routingPath]) {
      const src = readFileSync(path, 'utf8');
      // Doc comments may name forbidden deps; assert no import/require wiring.
      const importLines = src
        .split('\n')
        .filter((line) => /^\s*import\b|^\s*require\s*\(/.test(line))
        .join('\n');
      expect(importLines).not.toMatch(/EmergencyManager|live-trading-engine/);
    }
  });

  // —— VENUE binding 23–30 ——

  const venueCases: ReadonlyArray<{
    num: number;
    venue: LiveVenueId;
    env: TradingCredentialEnvironment;
    expectDemoHeader?: boolean;
  }> = [
    { num: 23, venue: 'BINANCE', env: 'live' },
    { num: 24, venue: 'BINANCE', env: 'testnet' },
    { num: 25, venue: 'BYBIT', env: 'live' },
    { num: 26, venue: 'BYBIT', env: 'testnet' },
    { num: 27, venue: 'OKX', env: 'live' },
    { num: 28, venue: 'OKX', env: 'demo', expectDemoHeader: true },
  ];

  for (const vc of venueCases) {
    it(`${vc.num} — ${vc.venue} ${vc.env} submit success (mocked fetch)`, async () => {
      const fetchFn = vi.fn(async (url: string, init: { headers?: Record<string, string> }) => {
        if (vc.expectDemoHeader) {
          expect(init.headers?.['x-simulated-trading']).toBe('1');
        }
        const egressEnv = vc.env === 'live' ? 'live' : 'testnet';
        expect(url.startsWith(liveVenueOrigin(vc.venue, egressEnv))).toBe(true);
        return { status: 200, text: async () => venueSuccessBody(url) };
      });
      const { provider, adapter } = createLiveAdapter({ fetchFn: fetchFn as never });
      seedCredential(provider, {
        type: vaultTypeFor(vc.venue),
        purpose: purposeForEnv(vc.env),
        withPassphrase: vc.venue === 'OKX',
      });
      const result = await adapter.submit(
        liveSubmitCommand({
          venue: vc.venue,
          tradingEnvironment: vc.env,
          vaultType: vaultTypeFor(vc.venue),
          purpose: purposeForEnv(vc.env),
        }),
      );
      expect(result.outcome).toBe('acknowledged');
      expect(fetchFn).toHaveBeenCalledOnce();
    });
  }

  // 29. OKX demo header present (covered in 28; explicit assert)
  it('29 — OKX demo header present on request', async () => {
    const fetchFn = vi.fn(async (_url: string, init: { headers?: Record<string, string> }) => {
      expect(init.headers?.['x-simulated-trading']).toBe('1');
      return {
        status: 200,
        text: async () => JSON.stringify({ code: '0', data: [{ ordId: 'okx-demo-1' }] }),
      };
    });
    const { provider, adapter } = createLiveAdapter({ fetchFn: fetchFn as never });
    seedCredential(provider, {
      type: 'okx',
      purpose: SecretPurpose.TradingDemo,
      withPassphrase: true,
    });
    const result = await adapter.submit(
      liveSubmitCommand({
        venue: 'OKX',
        tradingEnvironment: 'demo',
        vaultType: 'okx',
        purpose: SecretPurpose.TradingDemo,
      }),
    );
    expect(result.outcome).toBe('acknowledged');
  });

  // 30. cross-env denied
  it('30 — cross-env (testnet cred + live endpoint) denied', async () => {
    const fetchFn = vi.fn(async () => ({ status: 200, text: async () => '{}' }));
    const { provider, adapter } = createLiveAdapter({ fetchFn: fetchFn as never });
    seedCredential(provider, {
      type: 'binance',
      purpose: SecretPurpose.TradingTestnet,
    });
    const result = await adapter.submit(
      liveSubmitCommand({
        venue: 'BINANCE',
        tradingEnvironment: 'live',
        vaultType: 'binance',
        purpose: SecretPurpose.TradingTestnet,
      }),
    );
    expect(result.outcome).toBe('rejected');
    if (result.outcome === 'rejected') {
      expect(result.rejectionReason).toContain('environment_mismatch');
    }
    expect(fetchFn).not.toHaveBeenCalled();
  });

  // —— SECURITY 31–38 ——

  // 31. arbitrary URL rejected
  it('31 — arbitrary URL rejected via assertLiveVenueEgress', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'https://attacker.example/collect',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result.ok).toBe(false);
  });

  // 32. HTTP rejected
  it('32 — HTTP rejected via assertLiveVenueEgress', () => {
    const result = assertLiveVenueEgress({
      targetUrl: 'http://api.binance.com/api/v3/ping',
      venue: 'BINANCE',
      environment: 'live',
      executionMode: 'live',
    });
    expect(result).toEqual({ ok: false, reason: 'https_required' });
  });

  // 33. private IP via dns
  it('33 — private IP via dns → egress deny (fetch not called)', async () => {
    const fetchFn = vi.fn(async () => ({ status: 200, text: async () => '{}' }));
    const { provider, adapter } = createLiveAdapter({
      fetchFn: fetchFn as never,
      resolveDns: async () => [{ address: '10.1.2.3', family: 4 }],
    });
    seedCredential(provider, {
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const result = await adapter.submit(
      liveSubmitCommand({
        venue: 'BINANCE',
        tradingEnvironment: 'live',
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
    );
    expect(result.outcome).toBe('rejected');
    if (result.outcome === 'rejected') {
      expect(result.rejectionReason).toMatch(/egress_denied/);
    }
    expect(fetchFn).not.toHaveBeenCalled();
  });

  // 34. credential secret absent from errors
  it('34 — credential secret absent from errors / redaction', async () => {
    const noisy = `api_key=${SYNTH_KEY} api_secret: "${SYNTH_SECRET}" Authorization: Bearer ${SYNTH_KEY}`;
    const redacted = redactCredentialMaterial(noisy);
    expect(redacted).not.toContain(SYNTH_KEY);
    expect(redacted).not.toContain(SYNTH_SECRET);
    expect(redacted).toMatch(/\[REDACTED\]/);

    const { provider, adapter } = createLiveAdapter({
      fetchFn: vi.fn(async () => {
        throw new Error(`timeout api_key=${SYNTH_KEY} api_secret=${SYNTH_SECRET}`);
      }) as never,
    });
    seedCredential(provider, {
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const result = await adapter.submit(
      liveSubmitCommand({
        venue: 'BINANCE',
        tradingEnvironment: 'live',
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
    );
    expect(result.outcome).toBe('unknown');
    if (result.outcome === 'unknown') {
      expect(result.ambiguityReason).not.toContain(SYNTH_KEY);
      expect(result.ambiguityReason).not.toContain(SYNTH_SECRET);
    }
  });

  // 35–36. paper/mock cannot retrieve live creds
  it('35 — paper cannot retrieve live creds via assertMayRetrieveTradingCredential', () => {
    expect(
      assertMayRetrieveTradingCredential({
        executionMode: 'paper',
        purpose: SecretPurpose.TradingLive,
      }),
    ).toEqual({ ok: false, reason: 'paper_mock_forbidden' });
  });

  it('36 — mock cannot retrieve live creds via assertMayRetrieveTradingCredential', () => {
    expect(
      assertMayRetrieveTradingCredential({
        executionMode: 'mock',
        purpose: SecretPurpose.Trading,
      }),
    ).toEqual({ ok: false, reason: 'paper_mock_forbidden' });
  });

  it('37 — InMemory provider returns null under paper executionMode', async () => {
    const provider = new InMemoryLiveTradingCredentialProvider();
    seedCredential(provider, {
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const record = await provider.resolve({
      workspaceId: WS,
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
      executionMode: 'paper',
    });
    expect(record).toBeNull();
  });

  // 38. cross-workspace denied
  it('38 — cross-workspace credential denied', async () => {
    const { provider, adapter } = createLiveAdapter();
    seedCredential(provider, {
      workspaceId: 'ws-other',
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const result = await adapter.submit(
      liveSubmitCommand({
        workspaceId: WS,
        venue: 'BINANCE',
        tradingEnvironment: 'live',
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
    );
    expect(result.outcome).toBe('rejected');
    if (result.outcome === 'rejected') {
      expect(result.rejectionReason).toBe('credential_unavailable_or_forbidden');
    }
  });

  // —— AMBIGUITY 39–44 ——

  // 39. timeout → unknown
  it('39 — timeout → unknown', async () => {
    const err = Object.assign(new Error('ETIMEDOUT'), { name: 'AbortError' });
    const { provider, adapter } = createLiveAdapter({
      fetchFn: vi.fn(async () => {
        throw err;
      }) as never,
    });
    seedCredential(provider, {
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const result = await adapter.submit(
      liveSubmitCommand({
        venue: 'BINANCE',
        tradingEnvironment: 'live',
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
    );
    expect(result.outcome).toBe('unknown');
    if (result.outcome === 'unknown') {
      expect(result.ambiguityReason).toMatch(/timeout|transport/i);
    }
  });

  // 40. connection reset → unknown
  it('40 — connection reset → unknown', async () => {
    const { provider, adapter } = createLiveAdapter({
      fetchFn: vi.fn(async () => {
        throw new Error('read ECONNRESET');
      }) as never,
    });
    seedCredential(provider, {
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const result = await adapter.submit(
      liveSubmitCommand({
        venue: 'BINANCE',
        tradingEnvironment: 'live',
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
    );
    expect(result.outcome).toBe('unknown');
    if (result.outcome === 'unknown') {
      expect(result.ambiguityReason).toMatch(/connection_reset/);
    }
  });

  // 41. cancel timeout → unknown
  it('41 — cancel timeout → unknown', async () => {
    const { provider, adapter } = createLiveAdapter({
      fetchFn: vi.fn(async () => {
        throw Object.assign(new Error('aborted'), { name: 'AbortError' });
      }) as never,
    });
    seedCredential(provider, {
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const result = await adapter.cancel(
      liveCancelCommand({
        venue: 'BINANCE',
        tradingEnvironment: 'live',
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
    );
    expect(result.outcome).toBe('unknown');
    if (result.outcome === 'unknown') {
      expect(result.ambiguityReason).toMatch(/timeout|transport/i);
    }
  });

  // 42. already filled cancel
  it('42 — already filled cancel', async () => {
    const { provider, adapter } = createLiveAdapter({
      fetchFn: vi.fn(async () => ({
        status: 400,
        text: async () => JSON.stringify({ msg: 'Order already filled', status: 'FILLED' }),
      })) as never,
    });
    seedCredential(provider, {
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const result = await adapter.cancel(
      liveCancelCommand({
        venue: 'BINANCE',
        tradingEnvironment: 'live',
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
    );
    expect(result.outcome).toBe('already_filled');
  });

  // 43. already cancelled
  it('43 — already cancelled', async () => {
    const { provider, adapter } = createLiveAdapter({
      fetchFn: vi.fn(async () => ({
        status: 400,
        text: async () =>
          JSON.stringify({ msg: 'Order was already cancelled', status: 'CANCELED' }),
      })) as never,
    });
    seedCredential(provider, {
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const result = await adapter.cancel(
      liveCancelCommand({
        venue: 'BINANCE',
        tradingEnvironment: 'live',
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
    );
    expect(result.outcome).toBe('already_cancelled');
  });

  // 44. UNKNOWN blocks — malformed venue response
  it('44 — UNKNOWN blocks — malformed submit → unknown', async () => {
    const { provider, adapter } = createLiveAdapter({
      fetchFn: vi.fn(async () => ({
        status: 200,
        text: async () => 'not-json{{{',
      })) as never,
    });
    seedCredential(provider, {
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const result = await adapter.submit(
      liveSubmitCommand({
        venue: 'BINANCE',
        tradingEnvironment: 'live',
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
    );
    expect(result.outcome).toBe('unknown');
    if (result.outcome === 'unknown') {
      expect(result.ambiguityReason).toBe('malformed_venue_submit_response');
    }
  });

  // —— RoutingExecutionAdapter paper vs live ——

  it('RoutingExecutionAdapter routes paper vs live', async () => {
    const paper = new PaperExecutionAdapter();
    const liveFetch = vi.fn(async (url: string) => ({
      status: 200,
      text: async () => venueSuccessBody(url),
    }));
    const liveProvider = new InMemoryLiveTradingCredentialProvider();
    seedCredential(liveProvider, {
      type: 'binance',
      purpose: SecretPurpose.TradingLive,
    });
    const live = new LiveVenueExecutionAdapter({
      credentialProvider: liveProvider,
      fetchFn: liveFetch as never,
    });
    const router = new RoutingExecutionAdapter(paper, live);

    const paperResult = await router.submit({
      mode: 'paper',
      workspaceId: WS,
      orderId: 'p-1',
      clientOrderId: 'p-clid',
      intentHash: 'p-intent',
      instrument: 'BTCUSDT',
      side: 'buy',
      type: 'market',
      quantity: '1',
      limitPrice: null,
      marketState: {
        streamId: 's1',
        eventId: 'e1',
        sequence: 1,
        referencePrice: '50000',
        occurredAt: NOW,
      },
      configuration: paperConfig(),
    });
    expect(paperResult.mode).toBe('paper');
    expect(liveFetch).not.toHaveBeenCalled();

    const liveResult = await router.submit(
      liveSubmitCommand({
        venue: 'BINANCE',
        tradingEnvironment: 'live',
        vaultType: 'binance',
        purpose: SecretPurpose.TradingLive,
      }),
    );
    expect(liveResult.mode).toBe('live');
    expect(liveResult.outcome).toBe('acknowledged');
    expect(liveFetch).toHaveBeenCalledOnce();
    expect(router.health().realVenueIoEnabled).toBe(false);
  });
});

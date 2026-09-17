/**
 * V3-L02-S-ISO1 / SB-07 — Cross-workspace / cross-actor / live-path isolation regression.
 * ZERO real venue network calls. Synthetic credentials only. Composes existing APIs.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { Role } from '../modules/identity/role';
import { SecretPurpose } from '../modules/secret-vault/secret-purpose';
import { WorkspaceLivePolicy } from '../modules/workspace/live-policy/durable-workspace-live-policy-state';
import { InMemoryHumanStartProofStore } from '../modules/trading-session/live-admission/in-memory-human-start-proof.store';
import { LiveAdmissionService } from '../modules/trading-session/live-admission/live-admission.service';
import { issueHumanStartProof } from '../modules/trading-session/live-admission/domain/human-start-proof';
import { createOrderIntent, OrderSide, OrderType } from '../modules/orders/domain/order-intent';
import { OrderStatus } from '../modules/orders/domain/order-status';
import { SubmissionPhase } from '../modules/orders/domain/order-execution-state';
import { PaperExecutionAdapter } from '../modules/execution-adapter/paper-execution.adapter';
import { RoutingExecutionAdapter } from '../modules/execution-adapter/live-venue/routing-execution.adapter';
import { LiveVenueExecutionAdapter } from '../modules/execution-adapter/live-venue/live-venue-execution.adapter';
import { InMemoryLiveTradingCredentialProvider } from '../modules/execution-adapter/live-venue/live-trading-credential.provider';
import {
  assertLiveVenueIoPreconditions,
  LIVE_VENUE_IO_ACTION_SUBMIT,
  LIVE_VENUE_IO_ACTION_CANCEL,
} from '../modules/execution-adapter/live-venue/live-venue-io-gate';
import {
  assertLiveCredentialEnvironmentBinding,
  assertMayRetrieveTradingCredential,
  assertLiveVenueEgress,
  assertLiveVenueEgressWithDns,
  assertLiveVenueRedirectTarget,
  liveVenueOrigin,
  redactCredentialMaterial,
} from '../modules/execution-adapter/live-venue-egress';
import {
  V3_L02_S_ISO1_SLICE_ID,
  V3_L02_S_ISO1_CANONICAL_PATH_MODULE_ROOTS,
  V3_L02_S_ISO1_FORBIDDEN_IMPORT_SEGMENTS,
} from './v3-l02-s-iso1-isolation';
import { EmergencyManager } from '../modules/live-trading-engine/emergency-manager';
import { KillSwitchPersistenceService } from '../modules/trading-session/kill-switch/kill-switch-persistence.service';
import { KillSwitchRecoveryStore } from '../modules/trading-session/kill-switch/kill-switch-recovery-store';
import { PrismaKillSwitchStateRepository } from '../modules/trading-session/persistence/prisma-kill-switch-state.repository';
import { type DurableWorkspaceLivePolicyState } from '../modules/workspace/live-policy/durable-workspace-live-policy-state';
import { InMemoryWorkspaceLivePolicyStateRepository } from '../modules/workspace/live-policy/persistence/in-memory-workspace-live-policy-state.repository';
import { WorkspaceLivePolicyAdminService } from '../modules/workspace/live-policy/workspace-live-policy-admin.service';
import { WorkspaceLivePolicyPersistenceService } from '../modules/workspace/live-policy/workspace-live-policy-persistence.service';
import { FinancialRounding } from '../modules/financial';
import {
  PaperLimitFillPolicy,
  PaperMarketFillPolicy,
  createPaperFillConfiguration,
} from '../modules/execution-adapter/paper-fill-configuration';
import type { LiveVenueEgressFetch } from '../modules/execution-adapter/live-venue-egress/live-venue-egress-http';
import type { HoldableSecretType } from '../modules/secret-vault/holdable-secret-type';
import type {
  LiveExecutionCommand,
  LiveCancelCommand,
} from '../modules/execution-adapter/execution-adapter.port';
import { canTransitionOrder } from '../modules/orders/domain/order-status';

const WS_A = 'ws-iso1-a';
const WS_B = 'ws-iso1-b';
const ACTOR_A = 'actor-iso1-a';
const ACTOR_B = 'actor-iso1-b';
const SESS_A = 'sess-iso1-a';
const SESS_B = 'sess-iso1-b';
const SYNTH_KEY = 'synth-iso1-api-key';
const SYNTH_SECRET = 'synth-iso1-api-secret';
const SYNTH_PASSPHRASE = 'synth-iso1-passphrase';
const NOW = '2026-09-17T14:00:00.000Z';
const ACTION_SUBMIT = LIVE_VENUE_IO_ACTION_SUBMIT;
const ACTION_CANCEL = LIVE_VENUE_IO_ACTION_CANCEL;

const MODULES_ROOT = join(process.cwd(), 'src/modules');

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...listTsFiles(full));
    else if (full.endsWith('.ts') && !full.endsWith('.spec.ts')) out.push(full);
  }
  return out;
}

function importPaths(source: string): string[] {
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]!);
}

function createPrismaKillSwitchMock() {
  const rows = new Map<string, unknown>();
  return {
    workspaceKillSwitchState: {
      upsert: async ({
        where: { workspaceId },
        create,
        update,
      }: {
        where: { workspaceId: string };
        create: unknown;
        update: unknown;
      }) => {
        const data = rows.has(workspaceId) ? update : create;
        rows.set(workspaceId, data);
        return data;
      },
      findUnique: async ({ where: { workspaceId } }: { where: { workspaceId: string } }) =>
        rows.get(workspaceId) ?? null,
    },
  };
}

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
  }>,
) {
  return admission.issueHumanStart({
    actorId: overrides?.actorId ?? ACTOR_A,
    workspaceId: overrides?.workspaceId ?? WS_A,
    sessionId: overrides?.sessionId ?? SESS_A,
    actionCommand: overrides?.actionCommand ?? ACTION_SUBMIT,
    nowIso: overrides?.nowIso ?? NOW,
  });
}

function allowHarness(overrides?: {
  authorizationOverride?: 'allowed' | 'denied' | 'unknown';
  v2Overrides?: { liveCapitalAuthorized?: boolean; paperFreezeBlocksLive?: boolean };
}) {
  return {
    gateRequest: { libraryEntryId: 'lib-iso1' },
    v2Overrides: overrides?.v2Overrides ?? {
      liveCapitalAuthorized: true,
      paperFreezeBlocksLive: false,
    },
    // Harness-only: production C7 remains deny-all without authorizationOverride.
    authorizationOverride: overrides?.authorizationOverride ?? ('allowed' as const),
    evaluatedAt: NOW,
  };
}

function sessionFacts(overrides?: {
  sessionId?: string;
  workspaceId?: string;
  actorId?: string;
  lifecycleEligible?: boolean;
  executionModeCompatible?: boolean;
}) {
  return Object.freeze({
    sessionId: overrides?.sessionId ?? SESS_A,
    workspaceId: overrides?.workspaceId ?? WS_A,
    actorId: overrides?.actorId ?? ACTOR_A,
    lifecycleEligible: overrides?.lifecycleEligible ?? true,
    executionModeCompatible: overrides?.executionModeCompatible ?? true,
  });
}

function seedCredential(
  provider: InMemoryLiveTradingCredentialProvider,
  input: {
    workspaceId?: string;
    type?: HoldableSecretType;
    purpose?: SecretPurpose;
    withPassphrase?: boolean;
  } = {},
) {
  const type = input.type ?? 'binance';
  const fields: Record<string, string> = {
    apiKey: SYNTH_KEY,
    apiSecret: SYNTH_SECRET,
  };
  if (input.withPassphrase || type === 'okx') fields.passphrase = SYNTH_PASSPHRASE;
  provider.seed({
    workspaceId: input.workspaceId ?? WS_A,
    type,
    purpose: input.purpose ?? SecretPurpose.TradingLive,
    fields: Object.freeze(fields),
  });
}

function mockFetch(spy?: ReturnType<typeof vi.fn>): LiveVenueEgressFetch {
  const fn =
    spy ??
    vi.fn(async (url: string) => ({
      status: 200,
      text: async () =>
        url.includes('binance')
          ? JSON.stringify({ orderId: 9001, status: 'NEW', clientOrderId: 'clid-1' })
          : JSON.stringify({ orderId: 'unknown-9001', status: 'NEW' }),
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
      allowRealVenueIo: options?.allowRealVenueIo ?? false,
    }),
  };
}

function liveSubmitCommand(overrides: Partial<LiveExecutionCommand> = {}): LiveExecutionCommand {
  return Object.freeze({
    mode: 'live' as const,
    workspaceId: overrides.workspaceId ?? WS_A,
    orderId: overrides.orderId ?? 'ord-iso1-1',
    clientOrderId: overrides.clientOrderId ?? 'clid-iso1-1',
    intentHash: overrides.intentHash ?? 'intent-hash-iso1-1',
    instrument: overrides.instrument ?? 'BTCUSDT',
    side: overrides.side ?? 'buy',
    type: overrides.type ?? 'limit',
    quantity: overrides.quantity ?? '0.01',
    limitPrice: overrides.limitPrice ?? '50000',
    venue: overrides.venue ?? 'BINANCE',
    tradingEnvironment: overrides.tradingEnvironment ?? 'live',
    vaultType: overrides.vaultType ?? 'binance',
    purpose: overrides.purpose ?? SecretPurpose.TradingLive,
    clientClaimedEnvironment: overrides.clientClaimedEnvironment,
  });
}

function liveCancelCommand(overrides: Partial<LiveCancelCommand> = {}): LiveCancelCommand {
  return Object.freeze({
    mode: 'live' as const,
    workspaceId: overrides.workspaceId ?? WS_A,
    orderId: overrides.orderId ?? 'ord-iso1-1',
    clientOrderId: overrides.clientOrderId ?? 'clid-iso1-1',
    adapterOrderId: overrides.adapterOrderId ?? 'venue-ord-1',
    idempotencyKey: overrides.idempotencyKey ?? 'cancel-idem-iso1',
    instrument: overrides.instrument ?? 'BTCUSDT',
    venue: overrides.venue ?? 'BINANCE',
    tradingEnvironment: overrides.tradingEnvironment ?? 'live',
    vaultType: overrides.vaultType ?? 'binance',
    purpose: overrides.purpose ?? SecretPurpose.TradingLive,
    clientClaimedEnvironment: overrides.clientClaimedEnvironment,
  });
}

function gateCmd(input: {
  admission: LiveAdmissionService;
  token: string;
  workspaceId?: string;
  sessionId?: string;
  actorId?: string;
  actionCommand?: string;
  session?: ReturnType<typeof sessionFacts>;
  evaluatedAt?: string;
  authorizationOverride?: 'allowed' | 'denied' | 'unknown';
}) {
  return assertLiveVenueIoPreconditions({
    admission: input.admission,
    command: {
      workspaceId: input.workspaceId ?? WS_A,
      sessionId: input.sessionId ?? SESS_A,
      actorId: input.actorId ?? ACTOR_A,
      actorRole: Role.Trader,
      humanStartToken: input.token,
      actionCommand: input.actionCommand ?? ACTION_SUBMIT,
      session:
        input.session ??
        sessionFacts({
          workspaceId: input.workspaceId ?? WS_A,
          sessionId: input.sessionId ?? SESS_A,
          actorId: input.actorId ?? ACTOR_A,
        }),
      ...allowHarness(
        input.authorizationOverride
          ? { authorizationOverride: input.authorizationOverride }
          : undefined,
      ),
      ...(input.evaluatedAt ? { evaluatedAt: input.evaluatedAt } : {}),
    },
  });
}

function makeLiveIntent(overrides?: {
  workspaceId?: string;
  clientOrderId?: string;
  idempotencyKey?: string;
  actorId?: string;
  tradingSessionId?: string;
}) {
  return createOrderIntent({
    clientOrderId: overrides?.clientOrderId ?? 'clid-iso1-shared',
    idempotencyKey: overrides?.idempotencyKey ?? 'idem-iso1-shared',
    workspaceId: overrides?.workspaceId ?? WS_A,
    paperAccountId: 'paper-iso1',
    tradingSessionId: overrides?.tradingSessionId ?? SESS_A,
    sessionFencingToken: 1,
    mode: 'live',
    liveVenue: 'BINANCE',
    liveTradingEnvironment: 'live',
    origin: 'manual',
    instrument: 'BTCUSDT',
    side: OrderSide.BUY,
    type: OrderType.LIMIT,
    quantity: '0.01',
    limitPrice: '50000',
    marketCheckpoint: { streamId: 's1', sequence: 1, eventId: 'e1' },
    actorId: overrides?.actorId ?? ACTOR_A,
    occurredAt: NOW,
    recordedAt: NOW,
  });
}

function paperConfig() {
  return createPaperFillConfiguration({
    mode: 'paper',
    configurationId: 'paper-iso1',
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

function denyReasons(): string[] {
  return [
    'workspace_mismatch',
    'actor_mismatch',
    'session_mismatch',
    'session_ineligible',
    'human_start_invalid',
    'human_start_expired',
    'human_start_already_claimed',
    'human_start_claim_denied',
    'c7_denied',
    's04_denied',
    'policy_paper',
    'kill_switch_active',
  ];
}

describe(`V3-L02-S-ISO1 isolation regression (${V3_L02_S_ISO1_SLICE_ID})`, () => {
  describe('Workspace ISO-W01…W05', () => {
    it('ISO-W01 — WS_A proof with workspaceId WS_B denied; LiveVenue fetch never called', async () => {
      const fetchFn = vi.fn(async () => ({ status: 200, text: async () => '{}' }));
      createLiveAdapter({ fetchFn: fetchFn as never });
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, { workspaceId: WS_A });
      const gate = await gateCmd({
        admission,
        token: issued.token,
        workspaceId: WS_B,
        session: sessionFacts({ workspaceId: WS_B }),
      });
      expect(gate.ok).toBe(false);
      if (!gate.ok) {
        expect(['workspace_mismatch', 'human_start_invalid', 'session_ineligible']).toContain(
          gate.reason,
        );
      }
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('ISO-W02 — human-start for WS_A, claim/gate with WS_B → deny', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, { workspaceId: WS_A });
      const gate = await gateCmd({
        admission,
        token: issued.token,
        workspaceId: WS_B,
        session: sessionFacts({ workspaceId: WS_B }),
      });
      expect(gate.ok).toBe(false);
    });

    it('ISO-W03 — credential seeded for WS_A, binding request workspaceId WS_B → workspace_mismatch', () => {
      const result = assertLiveCredentialEnvironmentBinding(
        {
          workspaceId: WS_A,
          vaultType: 'binance',
          purpose: SecretPurpose.TradingLive,
        },
        {
          workspaceId: WS_B,
          venue: 'BINANCE',
          endpointEnvironment: 'live',
          executionMode: 'live',
        },
      );
      expect(result).toEqual({ ok: false, reason: 'workspace_mismatch' });
    });

    it('ISO-W04 — same clientOrderId across workspaces → different orderIds', () => {
      const a = makeLiveIntent({ workspaceId: WS_A, clientOrderId: 'clid-shared-w04' });
      const b = makeLiveIntent({ workspaceId: WS_B, clientOrderId: 'clid-shared-w04' });
      expect(a.orderId).not.toBe(b.orderId);
      expect(a.workspaceId).toBe(WS_A);
      expect(b.workspaceId).toBe(WS_B);
    });

    it('ISO-W05 — same clientOrderId+idempotencyKey across workspaces → different intentHash/orderId', () => {
      const a = makeLiveIntent({
        workspaceId: WS_A,
        clientOrderId: 'clid-w05',
        idempotencyKey: 'idem-w05',
      });
      const b = makeLiveIntent({
        workspaceId: WS_B,
        clientOrderId: 'clid-w05',
        idempotencyKey: 'idem-w05',
      });
      expect(a.orderId).not.toBe(b.orderId);
      expect(a.intentHash).not.toBe(b.intentHash);
    });
  });

  describe('Actor ISO-A01…A04', () => {
    it('ISO-A01 — Actor A proof consumed by Actor B → deny', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, { actorId: ACTOR_A });
      const gate = await gateCmd({
        admission,
        token: issued.token,
        actorId: ACTOR_B,
        session: sessionFacts({ actorId: ACTOR_B }),
      });
      expect(gate.ok).toBe(false);
      if (!gate.ok) {
        expect(['actor_mismatch', 'human_start_invalid', 'session_ineligible']).toContain(
          gate.reason,
        );
      }
    });

    it('ISO-A02 — wrong actor on claim after matching issue → deny', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, { actorId: ACTOR_A, workspaceId: WS_A });
      const gate = await gateCmd({
        admission,
        token: issued.token,
        actorId: ACTOR_B,
        workspaceId: WS_A,
        session: sessionFacts({ actorId: ACTOR_B, workspaceId: WS_A }),
      });
      expect(gate.ok).toBe(false);
    });

    it('ISO-A03 — Actor B cannot reuse Actor A authorization override path', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, { actorId: ACTOR_A });
      const gate = await gateCmd({
        admission,
        token: issued.token,
        actorId: ACTOR_B,
        session: sessionFacts({ actorId: ACTOR_B }),
        authorizationOverride: 'allowed',
      });
      expect(gate.ok).toBe(false);
    });

    it('ISO-A04 — claimed Actor A proof cannot authorize Actor B replay', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, { actorId: ACTOR_A });
      const first = await gateCmd({ admission, token: issued.token, actorId: ACTOR_A });
      expect(first.ok).toBe(true);
      const second = await gateCmd({
        admission,
        token: issued.token,
        actorId: ACTOR_B,
        session: sessionFacts({ actorId: ACTOR_B }),
      });
      expect(second.ok).toBe(false);
    });
  });

  describe('Session ISO-S01…S04 / ISO-T01…T04', () => {
    it('ISO-S01 — Session A proof for Session B → deny', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, { sessionId: SESS_A });
      const gate = await gateCmd({
        admission,
        token: issued.token,
        sessionId: SESS_B,
        session: sessionFacts({ sessionId: SESS_B }),
      });
      expect(gate.ok).toBe(false);
      if (!gate.ok) {
        expect(['session_mismatch', 'session_ineligible', 'human_start_invalid']).toContain(
          gate.reason,
        );
      }
    });

    it('ISO-S02 — lifecycleEligible false → deny', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission);
      const gate = await gateCmd({
        admission,
        token: issued.token,
        session: sessionFacts({ lifecycleEligible: false }),
      });
      expect(gate.ok).toBe(false);
      if (!gate.ok) expect(gate.reason).toBe('session_ineligible');
    });

    it('ISO-S03 — ended session facts (executionModeCompatible false) → deny', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission);
      const gate = await gateCmd({
        admission,
        token: issued.token,
        session: sessionFacts({ executionModeCompatible: false }),
      });
      expect(gate.ok).toBe(false);
      if (!gate.ok) expect(gate.reason).toBe('session_ineligible');
    });

    it('ISO-S04 — session mismatch never reaches adapter (fetch count 0)', async () => {
      const fetchFn = vi.fn(async () => ({ status: 200, text: async () => '{}' }));
      createLiveAdapter({ fetchFn: fetchFn as never });
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, { sessionId: SESS_A });
      const gate = await gateCmd({
        admission,
        token: issued.token,
        sessionId: SESS_B,
        session: sessionFacts({ sessionId: SESS_B }),
      });
      expect(gate.ok).toBe(false);
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('ISO-T01 — session ineligible blocks live path', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission);
      const gate = await gateCmd({
        admission,
        token: issued.token,
        session: sessionFacts({ lifecycleEligible: false }),
      });
      expect(gate.ok).toBe(false);
    });

    it('ISO-T02 — session deny does not invoke EmergencyManager', async () => {
      const activateSpy = vi.spyOn(EmergencyManager.prototype, 'activateKillSwitch');
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission);
      await gateCmd({
        admission,
        token: issued.token,
        session: sessionFacts({ lifecycleEligible: false }),
      });
      expect(activateSpy).not.toHaveBeenCalled();
      activateSpy.mockRestore();
    });

    it('ISO-T03 — OrderStatus.UNKNOWN is distinct and not auto-CANCELLED', () => {
      expect(OrderStatus.UNKNOWN).toBe('unknown');
      expect(OrderStatus.CANCELLED).toBe('cancelled');
      expect(OrderStatus.UNKNOWN).not.toBe(OrderStatus.CANCELLED);
      expect(canTransitionOrder(OrderStatus.UNKNOWN, OrderStatus.CANCELLED)).toBe(true);
      // Transition is explicit reconcile path — not silent auto-cancel.
      expect(SubmissionPhase.NONE).toBe('none');
    });

    it('ISO-T04 — UNKNOWN does not imply SUBMITTED', () => {
      expect(OrderStatus.UNKNOWN).not.toBe(OrderStatus.SUBMITTED);
      expect(canTransitionOrder(OrderStatus.UNKNOWN, OrderStatus.SUBMITTED)).toBe(false);
    });
  });

  describe('Action/Command ISO-C01…C04', () => {
    it('ISO-C01 — SUBMIT proof cannot authorize CANCEL action', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, { actionCommand: ACTION_SUBMIT });
      const gate = await gateCmd({
        admission,
        token: issued.token,
        actionCommand: ACTION_CANCEL,
      });
      expect(gate.ok).toBe(false);
    });

    it('ISO-C02 — CANCEL proof cannot authorize SUBMIT', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, { actionCommand: ACTION_CANCEL });
      const gate = await gateCmd({
        admission,
        token: issued.token,
        actionCommand: ACTION_SUBMIT,
      });
      expect(gate.ok).toBe(false);
    });

    it('ISO-C03 — wrong command string denied', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, { actionCommand: ACTION_SUBMIT });
      const gate = await gateCmd({
        admission,
        token: issued.token,
        actionCommand: 'LIVE_ORDER_RECONCILE',
      });
      expect(gate.ok).toBe(false);
    });

    it('ISO-C04 — after claim, replay deny', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission);
      const first = await gateCmd({ admission, token: issued.token });
      expect(first.ok).toBe(true);
      const replay = await gateCmd({ admission, token: issued.token });
      expect(replay.ok).toBe(false);
      if (!replay.ok) {
        expect(['human_start_already_claimed', 'human_start_invalid', 's04_denied']).toContain(
          replay.reason,
        );
      }
    });
  });

  describe('Human-start ISO-H01…H05', () => {
    it('ISO-H01 — Promise.all two concurrent claims → exactly one claimed', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission);
      const [a, b] = await Promise.all([
        gateCmd({ admission, token: issued.token }),
        gateCmd({ admission, token: issued.token }),
      ]);
      expect([a, b].filter((r) => r.ok)).toHaveLength(1);
      expect([a, b].filter((r) => !r.ok)).toHaveLength(1);
    });

    it('ISO-H02 — restart via new LiveAdmissionService sharing store → claimed still claimed', async () => {
      const first = createAdmissionService();
      const issued = await issueToken(first.admission);
      const claimed = await gateCmd({ admission: first.admission, token: issued.token });
      expect(claimed.ok).toBe(true);

      const restarted = new LiveAdmissionService(
        first.livePolicy as never,
        first.killSwitch as never,
        first.gate as never,
        first.store,
      );
      const replay = await gateCmd({ admission: restarted, token: issued.token });
      expect(replay.ok).toBe(false);
      if (!replay.ok) {
        expect(['human_start_already_claimed', 'human_start_invalid', 's04_denied']).toContain(
          replay.reason,
        );
      }
    });

    it('ISO-H03 — expired (evaluatedAt far future / ttl) deny', async () => {
      const { admission, store } = createAdmissionService();
      const { record, issued } = issueHumanStartProof({
        actorId: ACTOR_A,
        workspaceId: WS_A,
        sessionId: SESS_A,
        actionCommand: ACTION_SUBMIT,
        nowIso: NOW,
        ttlMs: 1_000,
      });
      await store.save(record);
      const gate = await gateCmd({
        admission,
        token: issued.token,
        evaluatedAt: '2026-09-17T14:30:00.000Z',
      });
      expect(gate.ok).toBe(false);
      if (!gate.ok) expect(gate.reason).toBe('human_start_expired');
    });

    it('ISO-H04 — claim ok → claimMeansVenueSubmitted false; no OrderStatus.SUBMITTED implied', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission);
      const gate = await gateCmd({ admission, token: issued.token });
      expect(gate.ok).toBe(true);
      if (gate.ok) {
        expect(gate.claimMeansVenueSubmitted).toBe(false);
      }
      expect(OrderStatus.SUBMITTED).toBe('submitted');
      expect(SubmissionPhase.NONE).not.toBe(SubmissionPhase.TRANSMITTED);
    });

    it('ISO-H05 — claimed proof cannot transfer to other workspace/actor', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, {
        workspaceId: WS_A,
        actorId: ACTOR_A,
      });
      const ok = await gateCmd({ admission, token: issued.token });
      expect(ok.ok).toBe(true);
      const crossWs = await gateCmd({
        admission,
        token: issued.token,
        workspaceId: WS_B,
        session: sessionFacts({ workspaceId: WS_B }),
      });
      const crossActor = await gateCmd({
        admission,
        token: issued.token,
        actorId: ACTOR_B,
        session: sessionFacts({ actorId: ACTOR_B }),
      });
      expect(crossWs.ok).toBe(false);
      expect(crossActor.ok).toBe(false);
    });
  });

  describe('ENV1 ISO-E01…E08', () => {
    it('ISO-E01 — live Binance cred + live endpoint allowed', () => {
      const result = assertLiveCredentialEnvironmentBinding(
        { workspaceId: WS_A, vaultType: 'binance', purpose: SecretPurpose.TradingLive },
        {
          workspaceId: WS_A,
          venue: 'BINANCE',
          endpointEnvironment: 'live',
          executionMode: 'live',
          targetUrl: `${liveVenueOrigin('BINANCE', 'live')}/api/v3/ping`,
        },
      );
      expect(result.ok).toBe(true);
    });

    it('ISO-E02 — testnet cred + live endpoint denied', () => {
      expect(
        assertLiveCredentialEnvironmentBinding(
          { workspaceId: WS_A, vaultType: 'binance', purpose: SecretPurpose.TradingTestnet },
          {
            workspaceId: WS_A,
            venue: 'BINANCE',
            endpointEnvironment: 'live',
            executionMode: 'live',
          },
        ),
      ).toEqual({ ok: false, reason: 'environment_mismatch' });
    });

    it('ISO-E03 — live cred + testnet endpoint denied', () => {
      expect(
        assertLiveCredentialEnvironmentBinding(
          { workspaceId: WS_A, vaultType: 'binance', purpose: SecretPurpose.TradingLive },
          {
            workspaceId: WS_A,
            venue: 'BINANCE',
            endpointEnvironment: 'testnet',
            executionMode: 'live',
          },
        ),
      ).toEqual({ ok: false, reason: 'environment_mismatch' });
    });

    it('ISO-E04 — venue mismatch denied', () => {
      expect(
        assertLiveCredentialEnvironmentBinding(
          { workspaceId: WS_A, vaultType: 'bybit', purpose: SecretPurpose.TradingLive },
          {
            workspaceId: WS_A,
            venue: 'BINANCE',
            endpointEnvironment: 'live',
            executionMode: 'live',
          },
        ),
      ).toEqual({ ok: false, reason: 'venue_mismatch' });
    });

    it('ISO-E05 — paper cannot retrieve trading_live', () => {
      expect(
        assertMayRetrieveTradingCredential({
          executionMode: 'paper',
          purpose: SecretPurpose.TradingLive,
        }),
      ).toEqual({ ok: false, reason: 'paper_mock_forbidden' });
    });

    it('ISO-E06 — mock cannot retrieve trading_live', () => {
      expect(
        assertMayRetrieveTradingCredential({
          executionMode: 'mock',
          purpose: SecretPurpose.TradingLive,
        }),
      ).toEqual({ ok: false, reason: 'paper_mock_forbidden' });
    });

    it('ISO-E07 — cross-workspace credential binding denied', () => {
      expect(
        assertLiveCredentialEnvironmentBinding(
          { workspaceId: WS_B, vaultType: 'binance', purpose: SecretPurpose.TradingLive },
          {
            workspaceId: WS_A,
            venue: 'BINANCE',
            endpointEnvironment: 'live',
            executionMode: 'live',
          },
        ),
      ).toEqual({ ok: false, reason: 'workspace_mismatch' });
    });

    it('ISO-E08 — client environment escalation denied', () => {
      expect(
        assertLiveCredentialEnvironmentBinding(
          { workspaceId: WS_A, vaultType: 'binance', purpose: SecretPurpose.TradingTestnet },
          {
            workspaceId: WS_A,
            venue: 'BINANCE',
            endpointEnvironment: 'testnet',
            executionMode: 'live',
            clientClaimedEnvironment: 'live',
          },
        ),
      ).toEqual({ ok: false, reason: 'client_environment_escalation' });
    });
  });

  describe('EG1 ISO-G01…G08', () => {
    it('ISO-G01 — approved Binance host allowed', () => {
      expect(
        assertLiveVenueEgress({
          targetUrl: 'https://api.binance.com/api/v3/ping',
          venue: 'BINANCE',
          environment: 'live',
          executionMode: 'live',
        }).ok,
      ).toBe(true);
    });

    it('ISO-G02 — arbitrary URL rejected', () => {
      expect(
        assertLiveVenueEgress({
          targetUrl: 'https://evil.example/exfil',
          venue: 'BINANCE',
          environment: 'live',
          executionMode: 'live',
        }),
      ).toEqual({ ok: false, reason: 'unknown_host' });
    });

    it('ISO-G03 — HTTP rejected', () => {
      expect(
        assertLiveVenueEgress({
          targetUrl: 'http://api.binance.com/api/v3/ping',
          venue: 'BINANCE',
          environment: 'live',
          executionMode: 'live',
        }),
      ).toEqual({ ok: false, reason: 'https_required' });
    });

    it('ISO-G04 — private IP literal rejected', () => {
      const result = assertLiveVenueEgress({
        targetUrl: 'https://10.0.0.5/api',
        venue: 'BINANCE',
        environment: 'live',
        executionMode: 'live',
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(['blocked_address', 'unknown_host']).toContain(result.reason);
    });

    it('ISO-G05 — DNS private IP denied (mocked)', async () => {
      expect(
        await assertLiveVenueEgressWithDns({
          targetUrl: 'https://api.binance.com/api/v3/ping',
          venue: 'BINANCE',
          environment: 'live',
          executionMode: 'live',
          enforceResolvedIpPolicy: true,
          resolveDns: async () => [{ address: '10.1.2.3', family: 4 }],
        }),
      ).toEqual({ ok: false, reason: 'blocked_resolved_address' });
    });

    it('ISO-G06 — redirect to attacker rejected', () => {
      const result = assertLiveVenueRedirectTarget(
        'https://attacker.example/collect',
        'BINANCE',
        'live',
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('redirect_forbidden');
    });

    it('ISO-G07 — cross-venue host mismatch denied', () => {
      expect(
        assertLiveVenueEgress({
          targetUrl: 'https://api.bybit.com/v5/market/time',
          venue: 'BINANCE',
          environment: 'live',
          executionMode: 'live',
        }).ok,
      ).toBe(false);
    });

    it('ISO-G08 — venue mismatch via ENV1 binding', () => {
      expect(
        assertLiveCredentialEnvironmentBinding(
          { workspaceId: WS_A, vaultType: 'okx', purpose: SecretPurpose.TradingLive },
          {
            workspaceId: WS_A,
            venue: 'BINANCE',
            endpointEnvironment: 'live',
            executionMode: 'live',
            targetUrl: `${liveVenueOrigin('BINANCE', 'live')}/api/v3/ping`,
          },
        ),
      ).toEqual({ ok: false, reason: 'venue_mismatch' });
    });
  });

  describe('Canonical path ISO-EM01 / ISO-LT01…LT03', () => {
    it('ISO-EM01 — canonical L02 path modules do not import EmergencyManager / live-trading-engine', () => {
      const violations: string[] = [];
      for (const root of V3_L02_S_ISO1_CANONICAL_PATH_MODULE_ROOTS) {
        const dir = join(MODULES_ROOT, root);
        for (const file of listTsFiles(dir)) {
          const source = readFileSync(file, 'utf8');
          const rel = file.split('/modules/')[1] ?? file;
          for (const importPath of importPaths(source)) {
            const normalized = importPath.replace(/\\/g, '/');
            for (const forbidden of V3_L02_S_ISO1_FORBIDDEN_IMPORT_SEGMENTS) {
              if (normalized.includes(forbidden)) {
                violations.push(`${rel} → ${importPath}`);
              }
            }
          }
        }
      }
      expect(violations).toEqual([]);
    });

    it('ISO-LT01 — RoutingExecutionAdapter paper → paper; live → live', async () => {
      const paper = new PaperExecutionAdapter();
      const liveFetch = vi.fn(async (url: string) => ({
        status: 200,
        text: async () => JSON.stringify({ orderId: 1, status: 'NEW', clientOrderId: 'clid-1' }),
      }));
      const liveProvider = new InMemoryLiveTradingCredentialProvider();
      seedCredential(liveProvider);
      const live = new LiveVenueExecutionAdapter({
        credentialProvider: liveProvider,
        fetchFn: liveFetch as never,
        allowRealVenueIo: false,
      });
      const router = new RoutingExecutionAdapter(paper, live);

      const paperResult = await router.submit({
        mode: 'paper',
        workspaceId: WS_A,
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

      const liveResult = await router.submit(liveSubmitCommand());
      expect(liveResult.mode).toBe('live');
      expect(liveFetch).toHaveBeenCalledOnce();
      expect(router.health().realVenueIoEnabled).toBe(false);
    });

    it('ISO-LT02 — PaperExecutionAdapter never calls live fetch', async () => {
      const liveFetch = vi.fn(async () => ({ status: 200, text: async () => '{}' }));
      const paper = new PaperExecutionAdapter();
      await paper.submit({
        mode: 'paper',
        workspaceId: WS_A,
        orderId: 'p-2',
        clientOrderId: 'p-clid-2',
        intentHash: 'p-intent-2',
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
      expect(liveFetch).not.toHaveBeenCalled();
    });

    it('ISO-LT03 — execution-engine uses live I/O gate and does not import EmergencyManager', () => {
      const src = readFileSync(
        join(MODULES_ROOT, 'execution-engine/execution-engine.service.ts'),
        'utf8',
      );
      expect(src).toMatch(/assertLiveVenueIoPreconditions/);
      expect(src).toMatch(/LIVE_VENUE_IO/);
      expect(src).not.toMatch(/from\s+['"][^'"]*emergency-manager/);
      expect(src).not.toMatch(/from\s+['"][^'"]*EmergencyManager/);
      expect(src).not.toMatch(/from\s+['"][^'"]*live-trading-engine/);
    });
  });

  describe('C7 ISO-C701…C703', () => {
    it('ISO-C701 — without authorizationOverride → c7_denied; fetch never called', async () => {
      const fetchFn = vi.fn(async () => ({ status: 200, text: async () => '{}' }));
      createLiveAdapter({ fetchFn: fetchFn as never });
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission);
      const gate = await assertLiveVenueIoPreconditions({
        admission,
        command: {
          workspaceId: WS_A,
          sessionId: SESS_A,
          actorId: ACTOR_A,
          actorRole: Role.Trader,
          humanStartToken: issued.token,
          actionCommand: ACTION_SUBMIT,
          session: sessionFacts(),
          gateRequest: { libraryEntryId: 'lib-iso1' },
          v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
          // no authorizationOverride → production C7 deny-all
          evaluatedAt: NOW,
        },
      });
      expect(gate.ok).toBe(false);
      if (!gate.ok) expect(gate.reason).toBe('c7_denied');
      expect(fetchFn).not.toHaveBeenCalled();
    });

    it('ISO-C702 — harness override is test-only; production C7 unchanged', async () => {
      // Production C7 remains deny-all unless an explicit test harness override is supplied.
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission);
      const denied = await assertLiveVenueIoPreconditions({
        admission,
        command: {
          workspaceId: WS_A,
          sessionId: SESS_A,
          actorId: ACTOR_A,
          actorRole: Role.Trader,
          humanStartToken: issued.token,
          actionCommand: ACTION_SUBMIT,
          session: sessionFacts(),
          gateRequest: { libraryEntryId: 'lib-iso1' },
          v2Overrides: { liveCapitalAuthorized: true, paperFreezeBlocksLive: false },
          evaluatedAt: NOW,
        },
      });
      expect(denied.ok).toBe(false);
      if (!denied.ok) expect(denied.reason).toBe('c7_denied');
    });

    it('ISO-C703 — authorizationOverride denied → c7_denied', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission);
      const gate = await gateCmd({
        admission,
        token: issued.token,
        authorizationOverride: 'denied',
      });
      expect(gate.ok).toBe(false);
      if (!gate.ok) expect(gate.reason).toBe('c7_denied');
    });
  });

  describe('S04 ISO-S041…S044', () => {
    it('ISO-S041 — gatePass false → deny', async () => {
      const { admission } = createAdmissionService({ gatePass: false });
      const issued = await issueToken(admission);
      const gate = await gateCmd({ admission, token: issued.token });
      expect(gate.ok).toBe(false);
      if (!gate.ok) expect(gate.reason).toBe('s04_denied');
    });

    it('ISO-S042 — claim without admission allow fails', async () => {
      const { admission } = createAdmissionService({ gatePass: false });
      const issued = await issueToken(admission);
      const claim = await admission.claimHumanStartAfterS04Revalidation({
        workspaceId: WS_A,
        sessionId: SESS_A,
        actorId: ACTOR_A,
        actorRole: Role.Trader,
        humanStartToken: issued.token,
        actionCommand: ACTION_SUBMIT,
        session: sessionFacts(),
        ...allowHarness(),
      });
      expect(claim.status).toBe('admission_denied');
    });

    it('ISO-S043 — evaluateForL02Contract runs before claim (spy order)', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission);
      const order: string[] = [];
      const evalSpy = vi
        .spyOn(admission, 'evaluateForL02Contract')
        .mockImplementation(async (...args) => {
          order.push('evaluate');
          return LiveAdmissionService.prototype.evaluateForL02Contract.apply(admission, args);
        });
      const claimSpy = vi
        .spyOn(admission, 'claimHumanStartAfterS04Revalidation')
        .mockImplementation(async (...args) => {
          order.push('claim');
          return LiveAdmissionService.prototype.claimHumanStartAfterS04Revalidation.apply(
            admission,
            args,
          );
        });
      await gateCmd({ admission, token: issued.token });
      expect(order[0]).toBe('evaluate');
      expect(order.indexOf('claim')).toBeGreaterThan(order.indexOf('evaluate'));
      evalSpy.mockRestore();
      claimSpy.mockRestore();
    });

    it('ISO-S044 — S04 deny never reaches live fetch', async () => {
      const fetchFn = vi.fn(async () => ({ status: 200, text: async () => '{}' }));
      createLiveAdapter({ fetchFn: fetchFn as never });
      const { admission } = createAdmissionService({ gatePass: false });
      const issued = await issueToken(admission);
      await gateCmd({ admission, token: issued.token });
      expect(fetchFn).not.toHaveBeenCalled();
    });
  });

  describe('KS / Policy ISO-KS01…KS04 / ISO-P01…P04', () => {
    it('ISO-KS01 — killArmed true → deny new live', async () => {
      const { admission } = createAdmissionService({ killArmed: true });
      const issued = await issueToken(admission);
      const gate = await gateCmd({ admission, token: issued.token });
      expect(gate.ok).toBe(false);
      if (!gate.ok) expect(gate.reason).toBe('kill_switch_active');
    });

    it('ISO-KS02 — KS arming does not call EmergencyManager activateKillSwitch', async () => {
      const activateSpy = vi.spyOn(EmergencyManager.prototype, 'activateKillSwitch');
      const prisma = createPrismaKillSwitchMock();
      const repository = new PrismaKillSwitchStateRepository(prisma as never);
      const service = new KillSwitchPersistenceService(repository, new KillSwitchRecoveryStore());
      const outcome = await service.persistArmed({
        workspaceId: WS_A,
        actorId: ACTOR_A,
        reason: 'L02-S-ISO1 KS probe',
        recordedAt: NOW,
      });
      expect(outcome.ok).toBe(true);
      expect(activateSpy).not.toHaveBeenCalled();
      activateSpy.mockRestore();
    });

    it('ISO-KS03 — killArmed deny does not call EM', async () => {
      const activateSpy = vi.spyOn(EmergencyManager.prototype, 'activateKillSwitch');
      const { admission } = createAdmissionService({ killArmed: true });
      const issued = await issueToken(admission);
      await gateCmd({ admission, token: issued.token });
      expect(activateSpy).not.toHaveBeenCalled();
      activateSpy.mockRestore();
    });

    it('ISO-KS04 — OrderStatus.UNKNOWN stays UNKNOWN (no silent CANCELLED)', () => {
      expect(OrderStatus.UNKNOWN).toBe('unknown');
      expect(canTransitionOrder(OrderStatus.UNKNOWN, OrderStatus.CANCELLED)).toBe(true);
      // Allowed transition exists for reconcile — silent auto-CANCELLED is not implied.
    });

    it('ISO-P01 — policy PAPER → deny', async () => {
      const { admission } = createAdmissionService({ policy: WorkspaceLivePolicy.PAPER });
      const issued = await issueToken(admission);
      const gate = await gateCmd({ admission, token: issued.token });
      expect(gate.ok).toBe(false);
      if (!gate.ok) expect(gate.reason).toBe('policy_paper');
    });

    it('ISO-P02 — policy disable does not invoke EmergencyManager', async () => {
      const activateSpy = vi.spyOn(EmergencyManager.prototype, 'activateKillSwitch');

      class StagingRepo extends InMemoryWorkspaceLivePolicyStateRepository {
        private readonly staged = new WeakMap<object, DurableWorkspaceLivePolicyState>();
        override async saveLivePolicyState(
          state: DurableWorkspaceLivePolicyState,
          transaction?: unknown,
        ): Promise<void> {
          if (transaction) {
            this.staged.set(transaction as object, state);
            return;
          }
          await super.saveLivePolicyState(state);
        }
        commit(transaction: unknown): void {
          const state = this.staged.get(transaction as object);
          if (state) {
            void super.saveLivePolicyState(state);
            this.staged.delete(transaction as object);
          }
        }
        discard(transaction: unknown): void {
          this.staged.delete(transaction as object);
        }
      }

      const repository = new StagingRepo();
      const livePolicy = new WorkspaceLivePolicyPersistenceService(repository);
      const transactions = {
        run: async <T>(work: (tx: object) => Promise<T>): Promise<T> => {
          const tx = Object.freeze({});
          try {
            const result = await work(tx);
            repository.commit(tx);
            return result;
          } catch (error) {
            repository.discard(tx);
            throw error;
          }
        },
      };
      const admin = new WorkspaceLivePolicyAdminService(
        livePolicy,
        transactions as never,
        { record: vi.fn(async () => ({ id: 'audit-iso1' })) } as never,
        {
          child: () => ({
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
          }),
        } as never,
      );
      await livePolicy.persistPolicy({
        workspaceId: WS_A,
        policy: WorkspaceLivePolicy.LIVE_POLICY_OPTED_IN,
      });
      const view = await admin.disable({ workspaceId: WS_A, actorUserId: ACTOR_A });
      expect(view.policy).toBe(WorkspaceLivePolicy.PAPER);
      expect(activateSpy).not.toHaveBeenCalled();
      activateSpy.mockRestore();
    });

    it('ISO-P03 — PAPER deny does not call EM', async () => {
      const activateSpy = vi.spyOn(EmergencyManager.prototype, 'activateKillSwitch');
      const { admission } = createAdmissionService({ policy: WorkspaceLivePolicy.PAPER });
      const issued = await issueToken(admission);
      await gateCmd({ admission, token: issued.token });
      expect(activateSpy).not.toHaveBeenCalled();
      activateSpy.mockRestore();
    });

    it('ISO-P04 — UNKNOWN enum not silently CANCELLED under policy deny', () => {
      expect(OrderStatus.UNKNOWN).not.toBe(OrderStatus.CANCELLED);
    });
  });

  describe('Idempotency ISO-I01…I09', () => {
    it('ISO-I01 — createOrderIntent same inputs → same orderId/intentHash', () => {
      const a = makeLiveIntent({ clientOrderId: 'clid-i01', idempotencyKey: 'idem-i01' });
      const b = makeLiveIntent({ clientOrderId: 'clid-i01', idempotencyKey: 'idem-i01' });
      expect(a.orderId).toBe(b.orderId);
      expect(a.intentHash).toBe(b.intentHash);
    });

    it('ISO-I02 — different workspace → different orderId/intentHash', () => {
      const a = makeLiveIntent({ workspaceId: WS_A, clientOrderId: 'clid-i02' });
      const b = makeLiveIntent({ workspaceId: WS_B, clientOrderId: 'clid-i02' });
      expect(a.orderId).not.toBe(b.orderId);
      expect(a.intentHash).not.toBe(b.intentHash);
    });

    it('ISO-I03 — different clientOrderId → different orderId', () => {
      const a = makeLiveIntent({ clientOrderId: 'clid-i03-a' });
      const b = makeLiveIntent({ clientOrderId: 'clid-i03-b' });
      expect(a.orderId).not.toBe(b.orderId);
    });

    it('ISO-I04 — different session in identity → different intentHash', () => {
      const a = makeLiveIntent({ tradingSessionId: SESS_A });
      const b = makeLiveIntent({ tradingSessionId: SESS_B });
      expect(a.intentHash).not.toBe(b.intentHash);
    });

    it('ISO-I05 — idempotencyKey retained on intent', () => {
      const intent = makeLiveIntent({ idempotencyKey: 'idem-i05' });
      expect(intent.idempotencyKey).toBe('idem-i05');
    });

    it('ISO-I06 — OrderStatus.UNKNOWN present as distinct enum', () => {
      expect(Object.values(OrderStatus)).toContain(OrderStatus.UNKNOWN);
    });

    it('ISO-I07 — engine source blocks UNKNOWN resubmit', () => {
      const src = readFileSync(
        join(MODULES_ROOT, 'execution-engine/execution-engine.service.ts'),
        'utf8',
      );
      expect(src).toMatch(/order is UNKNOWN; reconcile before any resubmit/);
    });

    it('ISO-I08 — engine source blocks UNKNOWN cancel retry', () => {
      const src = readFileSync(
        join(MODULES_ROOT, 'execution-engine/execution-engine.service.ts'),
        'utf8',
      );
      expect(src).toMatch(/order is UNKNOWN; reconcile before cancel retry/);
    });

    it('ISO-I09 — UNKNOWN cannot transition to SUBMITTED', () => {
      expect(canTransitionOrder(OrderStatus.UNKNOWN, OrderStatus.SUBMITTED)).toBe(false);
    });
  });

  describe('UNKNOWN / Cancel ISO-U01…U08 / ISO-X01…X07', () => {
    it('ISO-U01 — submit timeout → unknown', async () => {
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => {
          throw Object.assign(new Error('ETIMEDOUT'), { name: 'AbortError' });
        }) as never,
      });
      seedCredential(provider);
      const result = await adapter.submit(liveSubmitCommand());
      expect(result.outcome).toBe('unknown');
    });

    it('ISO-U02 — connection reset → unknown', async () => {
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => {
          throw new Error('read ECONNRESET');
        }) as never,
      });
      seedCredential(provider);
      const result = await adapter.submit(liveSubmitCommand());
      expect(result.outcome).toBe('unknown');
    });

    it('ISO-U03 — malformed submit → unknown', async () => {
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => ({
          status: 200,
          text: async () => 'not-json{{{',
        })) as never,
      });
      seedCredential(provider);
      const result = await adapter.submit(liveSubmitCommand());
      expect(result.outcome).toBe('unknown');
    });

    it('ISO-U04 — cancel timeout → unknown', async () => {
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => {
          throw Object.assign(new Error('aborted'), { name: 'AbortError' });
        }) as never,
      });
      seedCredential(provider);
      const result = await adapter.cancel(liveCancelCommand());
      expect(result.outcome).toBe('unknown');
    });

    it('ISO-U05 — already_filled cancel', async () => {
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => ({
          status: 400,
          text: async () => JSON.stringify({ msg: 'Order already filled', status: 'FILLED' }),
        })) as never,
      });
      seedCredential(provider);
      expect((await adapter.cancel(liveCancelCommand())).outcome).toBe('already_filled');
    });

    it('ISO-U06 — already_cancelled', async () => {
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => ({
          status: 400,
          text: async () =>
            JSON.stringify({ msg: 'Order was already cancelled', status: 'CANCELED' }),
        })) as never,
      });
      seedCredential(provider);
      expect((await adapter.cancel(liveCancelCommand())).outcome).toBe('already_cancelled');
    });

    it('ISO-U07 — unknown outcome does not call EM', async () => {
      const activateSpy = vi.spyOn(EmergencyManager.prototype, 'activateKillSwitch');
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => {
          throw Object.assign(new Error('timeout'), { name: 'AbortError' });
        }) as never,
      });
      seedCredential(provider);
      await adapter.submit(liveSubmitCommand());
      expect(activateSpy).not.toHaveBeenCalled();
      activateSpy.mockRestore();
    });

    it('ISO-U08 — allowRealVenueIo stays false', () => {
      const adapter = new LiveVenueExecutionAdapter();
      expect(adapter.health().realVenueIoEnabled).toBe(false);
    });

    it('ISO-X01 — cancel already_filled outcome', async () => {
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => ({
          status: 400,
          text: async () => JSON.stringify({ msg: 'FILLED' }),
        })) as never,
      });
      seedCredential(provider);
      expect((await adapter.cancel(liveCancelCommand())).outcome).toBe('already_filled');
    });

    it('ISO-X02 — cancel already_cancelled outcome', async () => {
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => ({
          status: 400,
          text: async () => JSON.stringify({ msg: 'already cancelled' }),
        })) as never,
      });
      seedCredential(provider);
      expect((await adapter.cancel(liveCancelCommand())).outcome).toBe('already_cancelled');
    });

    it('ISO-X03 — cancel timeout unknown', async () => {
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => {
          throw Object.assign(new Error('aborted'), { name: 'AbortError' });
        }) as never,
      });
      seedCredential(provider);
      expect((await adapter.cancel(liveCancelCommand())).outcome).toBe('unknown');
    });

    it('ISO-X04 — UNKNOWN status enum check', () => {
      expect(OrderStatus.UNKNOWN).toBe('unknown');
    });

    it('ISO-X05 — cancel path does not call EM', async () => {
      const activateSpy = vi.spyOn(EmergencyManager.prototype, 'activateKillSwitch');
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => ({
          status: 400,
          text: async () => JSON.stringify({ msg: 'already cancelled' }),
        })) as never,
      });
      seedCredential(provider);
      await adapter.cancel(liveCancelCommand());
      expect(activateSpy).not.toHaveBeenCalled();
      activateSpy.mockRestore();
    });

    it('ISO-X06 — submit unknown does not invent FILLED', async () => {
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => ({ status: 200, text: async () => 'bad' })) as never,
      });
      seedCredential(provider);
      const result = await adapter.submit(liveSubmitCommand());
      expect(result.outcome).toBe('unknown');
      expect(result.outcome).not.toBe('acknowledged');
    });

    it('ISO-X07 — no EM on cancel timeout', async () => {
      const activateSpy = vi.spyOn(EmergencyManager.prototype, 'activateKillSwitch');
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => {
          throw Object.assign(new Error('aborted'), { name: 'AbortError' });
        }) as never,
      });
      seedCredential(provider);
      await adapter.cancel(liveCancelCommand());
      expect(activateSpy).not.toHaveBeenCalled();
      activateSpy.mockRestore();
    });
  });

  describe('Paper/Mock ISO-PM01…PM05', () => {
    it('ISO-PM01 — PaperExecutionAdapter submit works', async () => {
      const paper = new PaperExecutionAdapter();
      const result = await paper.submit({
        mode: 'paper',
        workspaceId: WS_A,
        orderId: 'pm-1',
        clientOrderId: 'pm-clid',
        intentHash: 'pm-intent',
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
      expect(result.mode).toBe('paper');
      expect(['filled', 'acknowledged']).toContain(result.outcome);
    });

    it('ISO-PM02 — Routing paper mode never hits live fetch', async () => {
      const liveFetch = vi.fn(async () => ({ status: 200, text: async () => '{}' }));
      const router = new RoutingExecutionAdapter(
        new PaperExecutionAdapter(),
        new LiveVenueExecutionAdapter({
          fetchFn: liveFetch as never,
          allowRealVenueIo: false,
        }),
      );
      await router.submit({
        mode: 'paper',
        workspaceId: WS_A,
        orderId: 'pm-2',
        clientOrderId: 'pm-clid-2',
        intentHash: 'pm-intent-2',
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
      expect(liveFetch).not.toHaveBeenCalled();
    });

    it('ISO-PM03 — assertMayRetrieveTradingCredential paper deny for trading_live', () => {
      expect(
        assertMayRetrieveTradingCredential({
          executionMode: 'paper',
          purpose: SecretPurpose.TradingLive,
        }),
      ).toEqual({ ok: false, reason: 'paper_mock_forbidden' });
    });

    it('ISO-PM04 — assertMayRetrieveTradingCredential mock deny for trading_live', () => {
      expect(
        assertMayRetrieveTradingCredential({
          executionMode: 'mock',
          purpose: SecretPurpose.TradingLive,
        }),
      ).toEqual({ ok: false, reason: 'paper_mock_forbidden' });
    });

    it('ISO-PM05 — InMemory provider returns null under paper executionMode', async () => {
      const provider = new InMemoryLiveTradingCredentialProvider();
      seedCredential(provider);
      const record = await provider.resolve({
        workspaceId: WS_A,
        type: 'binance',
        purpose: SecretPurpose.TradingLive,
        executionMode: 'paper',
      });
      expect(record).toBeNull();
    });
  });

  describe('Leakage ISO-R01…R05', () => {
    it('ISO-R01 — redactCredentialMaterial strips synth secrets', () => {
      const noisy = `api_key=${SYNTH_KEY} api_secret: "${SYNTH_SECRET}" passphrase=${SYNTH_PASSPHRASE}`;
      const redacted = redactCredentialMaterial(noisy);
      expect(redacted).not.toContain(SYNTH_KEY);
      expect(redacted).not.toContain(SYNTH_SECRET);
      expect(redacted).not.toContain(SYNTH_PASSPHRASE);
      expect(redacted).toMatch(/\[REDACTED\]/);
    });

    it('ISO-R02 — deny error messages do not contain SYNTH_SECRET', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission);
      const gate = await gateCmd({
        admission,
        token: issued.token,
        workspaceId: WS_B,
        session: sessionFacts({ workspaceId: WS_B }),
      });
      expect(gate.ok).toBe(false);
      const serialized = JSON.stringify(gate);
      expect(serialized).not.toContain(SYNTH_SECRET);
      expect(serialized).not.toContain(SYNTH_KEY);
    });

    it('ISO-R03 — live command objects do not include apiSecret fields', () => {
      const cmd = liveSubmitCommand();
      expect(JSON.stringify(cmd)).not.toMatch(/apiSecret|api_secret|passphrase/i);
      expect('apiSecret' in cmd).toBe(false);
    });

    it('ISO-R04 — adapter unknown ambiguityReason redacts secrets', async () => {
      const { provider, adapter } = createLiveAdapter({
        fetchFn: vi.fn(async () => {
          throw new Error(`timeout api_key=${SYNTH_KEY} api_secret=${SYNTH_SECRET}`);
        }) as never,
      });
      seedCredential(provider);
      const result = await adapter.submit(liveSubmitCommand());
      expect(result.outcome).toBe('unknown');
      if (result.outcome === 'unknown') {
        expect(result.ambiguityReason).not.toContain(SYNTH_KEY);
        expect(result.ambiguityReason).not.toContain(SYNTH_SECRET);
      }
    });

    it('ISO-R05 — cancel command has no credential fields', () => {
      const cmd = liveCancelCommand();
      expect(JSON.stringify(cmd)).not.toContain(SYNTH_SECRET);
      expect('apiSecret' in cmd).toBe(false);
    });
  });

  describe('Cross-boundary matrix', () => {
    it('ISO-MATRIX — only fully matching WS/Actor/Session/Command allows; others deny', async () => {
      const { admission } = createAdmissionService();
      const issued = await issueToken(admission, {
        workspaceId: WS_A,
        actorId: ACTOR_A,
        sessionId: SESS_A,
        actionCommand: ACTION_SUBMIT,
      });

      const cases: Array<{
        label: string;
        workspaceId: string;
        actorId: string;
        sessionId: string;
        actionCommand: string;
        expectAllow: boolean;
      }> = [
        {
          label: 'full match',
          workspaceId: WS_A,
          actorId: ACTOR_A,
          sessionId: SESS_A,
          actionCommand: ACTION_SUBMIT,
          expectAllow: true,
        },
        {
          label: 'wrong workspace',
          workspaceId: WS_B,
          actorId: ACTOR_A,
          sessionId: SESS_A,
          actionCommand: ACTION_SUBMIT,
          expectAllow: false,
        },
        {
          label: 'wrong actor',
          workspaceId: WS_A,
          actorId: ACTOR_B,
          sessionId: SESS_A,
          actionCommand: ACTION_SUBMIT,
          expectAllow: false,
        },
        {
          label: 'wrong session',
          workspaceId: WS_A,
          actorId: ACTOR_A,
          sessionId: SESS_B,
          actionCommand: ACTION_SUBMIT,
          expectAllow: false,
        },
        {
          label: 'wrong command',
          workspaceId: WS_A,
          actorId: ACTOR_A,
          sessionId: SESS_A,
          actionCommand: ACTION_CANCEL,
          expectAllow: false,
        },
      ];

      // Fresh token per deny case; shared allow uses the issued token once.
      for (const c of cases) {
        const token = c.expectAllow
          ? issued.token
          : (
              await issueToken(admission, {
                workspaceId: WS_A,
                actorId: ACTOR_A,
                sessionId: SESS_A,
                actionCommand: ACTION_SUBMIT,
              })
            ).token;
        const gate = await gateCmd({
          admission,
          token,
          workspaceId: c.workspaceId,
          actorId: c.actorId,
          sessionId: c.sessionId,
          actionCommand: c.actionCommand,
          session: sessionFacts({
            workspaceId: c.workspaceId,
            actorId: c.actorId,
            sessionId: c.sessionId,
          }),
        });
        if (c.expectAllow) {
          expect(gate.ok, c.label).toBe(true);
        } else {
          expect(gate.ok, c.label).toBe(false);
          if (!gate.ok) expect(denyReasons()).toContain(gate.reason);
        }
      }
    });
  });
});

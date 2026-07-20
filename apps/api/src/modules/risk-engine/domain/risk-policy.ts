/**
 * Named risk policies (US207).
 */
export const RISK_POLICY_NAMES = Object.freeze([
  'portfolio_balance',
  'position_size',
  'exposure',
  'margin',
  'max_open_positions',
  'duplicate_orders',
  'daily_loss',
] as const);

export type RiskPolicyName = (typeof RISK_POLICY_NAMES)[number];

export function isRiskPolicyName(value: string): value is RiskPolicyName {
  return (RISK_POLICY_NAMES as readonly string[]).includes(value);
}

export type RiskPolicyConfiguration = Readonly<Record<string, unknown>>;

/**
 * RiskPolicy — configurable, prioritized rule definition.
 */
export type RiskPolicy = Readonly<{
  id: string;
  portfolioId: string | null;
  name: RiskPolicyName;
  enabled: boolean;
  priority: number;
  configuration: RiskPolicyConfiguration;
}>;

export type CreateRiskPolicyInput = Readonly<{
  id: string;
  portfolioId?: string | null;
  name: string;
  enabled?: boolean;
  priority: number;
  configuration?: RiskPolicyConfiguration;
}>;

export function createRiskPolicy(input: CreateRiskPolicyInput): RiskPolicy {
  if (!input.id?.trim()) throw new Error('risk policy id is required');
  const name = String(input.name ?? '').toLowerCase();
  if (!isRiskPolicyName(name)) {
    throw new Error(`invalid risk policy name: ${input.name}`);
  }
  if (!Number.isInteger(input.priority)) {
    throw new Error('risk policy priority must be an integer');
  }

  return Object.freeze({
    id: input.id,
    portfolioId: input.portfolioId ?? null,
    name,
    enabled: input.enabled !== false,
    priority: input.priority,
    configuration: Object.freeze({ ...(input.configuration ?? {}) }),
  });
}

export function withRiskPolicyPatch(
  policy: RiskPolicy,
  patch: Readonly<{
    enabled?: boolean;
    priority?: number;
    configuration?: RiskPolicyConfiguration;
  }>,
): RiskPolicy {
  return createRiskPolicy({
    id: policy.id,
    portfolioId: policy.portfolioId,
    name: policy.name,
    enabled: patch.enabled !== undefined ? patch.enabled : policy.enabled,
    priority: patch.priority !== undefined ? patch.priority : policy.priority,
    configuration:
      patch.configuration !== undefined
        ? { ...policy.configuration, ...patch.configuration }
        : policy.configuration,
  });
}

/** Default system policies — permissive enough for normal trading tests. */
export const DEFAULT_RISK_POLICIES: readonly CreateRiskPolicyInput[] = Object.freeze([
  {
    id: 'risk-policy-portfolio-balance',
    name: 'portfolio_balance',
    priority: 10,
    enabled: true,
    configuration: {},
  },
  {
    id: 'risk-policy-position-size',
    name: 'position_size',
    priority: 20,
    enabled: true,
    configuration: { maxQuantity: '1000000', maxNotional: null },
  },
  {
    id: 'risk-policy-exposure',
    name: 'exposure',
    priority: 30,
    enabled: true,
    configuration: { maxExposurePercent: '100' },
  },
  {
    id: 'risk-policy-margin',
    name: 'margin',
    priority: 40,
    enabled: true,
    configuration: { marginRate: '1' },
  },
  {
    id: 'risk-policy-max-open-positions',
    name: 'max_open_positions',
    priority: 50,
    enabled: true,
    configuration: { maxOpenPositions: 50 },
  },
  {
    id: 'risk-policy-duplicate-orders',
    name: 'duplicate_orders',
    priority: 60,
    enabled: true,
    configuration: {},
  },
  {
    id: 'risk-policy-daily-loss',
    name: 'daily_loss',
    priority: 70,
    enabled: true,
    configuration: { maxDailyLoss: '100000' },
  },
]);

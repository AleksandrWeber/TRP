import { createHash } from 'node:crypto';
import { isStrategyTimeframe, type StrategyTimeframe } from '../../strategies/strategy';

export const STRATEGY_DEPLOYMENT_SCHEMA_VERSION = 1;

export enum StrategyDeploymentStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
}

export type StrategyDeploymentParameters = Readonly<Record<string, unknown>>;
export type StrategyDeploymentMetadata = Readonly<Record<string, unknown>>;

/**
 * Prior Runtime Enforcement PASS stamp (RC-23 Epic 4/5).
 * Owned by Deployment as deployment-authorization evidence.
 * Not part of configurationHash. Not Library SoT.
 * Session may only check this stamp — must not re-run Gate or call Library.
 */
export type DeploymentEnforcementAuthorization = Readonly<{
  outcome: 'pass';
  validation: 'VALID';
  purpose: 'deployment_bind';
  libraryEntryId: string | null;
  certificationStatus: string | null;
  eligibilityOutcome: 'eligible' | 'ineligible' | 'unknown' | null;
  checkedAt: string;
  reasons: readonly string[];
}>;

/**
 * Immutable approved (or draft) Strategy Deployment configuration (US211 / ADR-014).
 * Owns strategy identity, versioned configuration, approval status, and provenance.
 * Does not own Trading Session runtime state, checkpoints, leases, or signals.
 */
export type StrategyDeployment = Readonly<{
  id: string;
  workspaceId: string;
  strategyId: string;
  strategyVersion: string;
  experimentId: string | null;
  parameters: StrategyDeploymentParameters;
  instrument: string;
  timeframe: StrategyTimeframe;
  marketDataSourceId: string;
  paperExecutionConfigurationId: string;
  riskPolicyId: string;
  riskPolicyVersion: number;
  /** SHA-256 of semantic configuration; operational timestamps excluded. */
  configurationHash: string;
  status: StrategyDeploymentStatus;
  version: number;
  approvedAt: string | null;
  approvedByActorId: string | null;
  createdAt: string;
  recordedAt: string;
  actorId: string;
  correlationId: string | null;
  idempotencyKey: string;
  metadata: StrategyDeploymentMetadata;
  /** RC-23: Gate PASS evidence from bind. Null when never validated. */
  enforcementAuthorization: DeploymentEnforcementAuthorization | null;
}>;

export type CreateStrategyDeploymentInput = Readonly<{
  id: string;
  workspaceId: string;
  strategyId: string;
  strategyVersion: string;
  experimentId?: string | null;
  parameters: StrategyDeploymentParameters;
  instrument: string;
  timeframe: string;
  marketDataSourceId: string;
  paperExecutionConfigurationId: string;
  riskPolicyId: string;
  riskPolicyVersion: number;
  metadata?: StrategyDeploymentMetadata;
  createdAt: string;
  recordedAt: string;
  actorId: string;
  correlationId?: string | null;
  idempotencyKey: string;
}>;

export function createStrategyDeployment(input: CreateStrategyDeploymentInput): StrategyDeployment {
  const id = required(input.id, 'deployment id');
  const workspaceId = required(input.workspaceId, 'workspace id');
  const strategyId = required(input.strategyId, 'strategy id');
  const strategyVersion = required(input.strategyVersion, 'strategy version');
  const instrument = normalizeInstrument(input.instrument);
  const timeframe = assertTimeframe(input.timeframe);
  const marketDataSourceId = required(input.marketDataSourceId, 'market data source id');
  const paperExecutionConfigurationId = required(
    input.paperExecutionConfigurationId,
    'paper execution configuration id',
  );
  const riskPolicyId = required(input.riskPolicyId, 'risk policy id');
  if (!Number.isSafeInteger(input.riskPolicyVersion) || input.riskPolicyVersion < 1) {
    throw new Error('risk policy version must be a positive integer');
  }
  const parameters = freezeJsonObject(input.parameters, 'parameters');
  const metadata = freezeJsonObject(input.metadata ?? {}, 'metadata');
  assertIso(input.createdAt, 'createdAt');
  assertIso(input.recordedAt, 'recordedAt');
  const actorId = required(input.actorId, 'actor id');
  const idempotencyKey = required(input.idempotencyKey, 'idempotency key');
  const experimentId =
    input.experimentId === undefined || input.experimentId === null
      ? null
      : required(input.experimentId, 'experiment id');

  const configurationHash = hashConfiguration({
    workspaceId,
    strategyId,
    strategyVersion,
    experimentId,
    parameters,
    instrument,
    timeframe,
    marketDataSourceId,
    paperExecutionConfigurationId,
    riskPolicyId,
    riskPolicyVersion: input.riskPolicyVersion,
    metadata,
  });

  return Object.freeze({
    id,
    workspaceId,
    strategyId,
    strategyVersion,
    experimentId,
    parameters,
    instrument,
    timeframe,
    marketDataSourceId,
    paperExecutionConfigurationId,
    riskPolicyId,
    riskPolicyVersion: input.riskPolicyVersion,
    configurationHash,
    status: StrategyDeploymentStatus.DRAFT,
    version: 1,
    approvedAt: null,
    approvedByActorId: null,
    createdAt: input.createdAt,
    recordedAt: input.recordedAt,
    actorId,
    correlationId: optionalId(input.correlationId),
    idempotencyKey,
    metadata,
    enforcementAuthorization: null,
  });
}

export function approveStrategyDeployment(
  deployment: StrategyDeployment,
  input: Readonly<{ approvedAt: string; approvedByActorId: string; recordedAt: string }>,
): StrategyDeployment {
  if (deployment.status === StrategyDeploymentStatus.APPROVED) {
    throw new Error('strategy deployment is already approved');
  }
  if (deployment.status !== StrategyDeploymentStatus.DRAFT) {
    throw new Error(`strategy deployment cannot approve from ${deployment.status}`);
  }
  assertIso(input.approvedAt, 'approvedAt');
  assertIso(input.recordedAt, 'recordedAt');
  const approvedByActorId = required(input.approvedByActorId, 'approved by actor id');

  return Object.freeze({
    ...deployment,
    status: StrategyDeploymentStatus.APPROVED,
    version: deployment.version + 1,
    approvedAt: input.approvedAt,
    approvedByActorId,
    recordedAt: input.recordedAt,
  });
}

/**
 * Attach / replace Runtime Enforcement PASS stamp (outside configurationHash).
 * Does not change status or semantic configuration.
 */
export function withEnforcementAuthorization(
  deployment: StrategyDeployment,
  authorization: DeploymentEnforcementAuthorization,
): StrategyDeployment {
  assertValidEnforcementAuthorization(authorization);
  return Object.freeze({
    ...deployment,
    enforcementAuthorization: Object.freeze({
      ...authorization,
      reasons: Object.freeze([...authorization.reasons]),
    }),
  });
}

/** True when Deployment carries a usable prior Gate PASS for Session start. */
export function hasValidEnforcementAuthorization(
  deployment: StrategyDeployment,
): deployment is StrategyDeployment & {
  enforcementAuthorization: DeploymentEnforcementAuthorization;
} {
  const auth = deployment.enforcementAuthorization;
  return auth !== null && isValidEnforcementAuthorization(auth);
}

export function isValidEnforcementAuthorization(
  value: DeploymentEnforcementAuthorization | null | undefined,
): value is DeploymentEnforcementAuthorization {
  if (!value || typeof value !== 'object') return false;
  return (
    value.outcome === 'pass' &&
    value.validation === 'VALID' &&
    value.purpose === 'deployment_bind' &&
    typeof value.checkedAt === 'string' &&
    value.checkedAt.trim() !== '' &&
    Array.isArray(value.reasons)
  );
}

function assertValidEnforcementAuthorization(value: DeploymentEnforcementAuthorization): void {
  if (!isValidEnforcementAuthorization(value)) {
    throw new Error('enforcement authorization must be a VALID deployment_bind PASS stamp');
  }
  assertIso(value.checkedAt, 'enforcementAuthorization.checkedAt');
}

/** Approved deployments reject any configuration mutation attempt. */
export function assertDeploymentMutable(deployment: StrategyDeployment): void {
  if (deployment.status === StrategyDeploymentStatus.APPROVED) {
    throw new Error('approved strategy deployment is immutable');
  }
}

export function isStrategyDeploymentStatus(value: string): value is StrategyDeploymentStatus {
  return Object.values(StrategyDeploymentStatus).includes(value as StrategyDeploymentStatus);
}

function hashConfiguration(semantic: Readonly<Record<string, unknown>>): string {
  return createHash('sha256').update(stableStringify(semantic)).digest('hex');
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function freezeJsonObject(
  value: Record<string, unknown>,
  label: string,
): Readonly<Record<string, unknown>> {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new Error(`${label} must be a JSON object`);
  }
  return Object.freeze(structuredClone(value));
}

function normalizeInstrument(value: string): string {
  const instrument = required(value, 'instrument').toUpperCase();
  if (!/^[A-Z0-9]{3,32}$/.test(instrument)) {
    throw new Error('instrument must be 3-32 uppercase letters or digits');
  }
  return instrument;
}

function assertTimeframe(value: string): StrategyTimeframe {
  const timeframe = required(value, 'timeframe');
  if (!isStrategyTimeframe(timeframe)) {
    throw new Error(`unsupported timeframe: ${timeframe}`);
  }
  return timeframe;
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function optionalId(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function assertIso(value: string, label: string): void {
  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    throw new Error(`${label} must be an ISO-8601 UTC timestamp`);
  }
}

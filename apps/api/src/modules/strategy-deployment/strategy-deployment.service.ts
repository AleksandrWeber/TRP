import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaTransactionService } from '../../storage/prisma/prisma-transaction.service';
import { toDurableEventId, type DurableEventEnvelope } from '../event-processing';
import { TransactionalOutboxAppender } from '../event-processing/transactional-outbox-appender';
import {
  RUNTIME_ENFORCEMENT_PORT,
  RuntimeEnforcementRejectedError,
  type EnforcementDecision,
  type RuntimeEnforcementPort,
} from '../runtime-enforcement';
import { StrategyDomainService } from '../strategies';
import {
  approveStrategyDeployment,
  assertDeploymentMutable,
  createStrategyDeployment,
  StrategyDeploymentStatus,
  withEnforcementAuthorization,
  type CreateStrategyDeploymentInput,
  type DeploymentEnforcementAuthorization,
  type StrategyDeployment,
  type StrategyDeploymentMetadata,
  type StrategyDeploymentParameters,
} from './domain/strategy-deployment';
import {
  STRATEGY_DEPLOYMENT_REPOSITORY,
  type StrategyDeploymentRepository,
} from './persistence/strategy-deployment.repository';

export type CreateStrategyDeploymentCommand = Readonly<{
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
  idempotencyKey: string;
  actorId: string;
  correlationId?: string;
  createdAt: string;
  recordedAt: string;
}>;

export type ApproveStrategyDeploymentCommand = Readonly<{
  workspaceId: string;
  deploymentId: string;
  actorId: string;
  correlationId?: string;
  approvedAt: string;
  recordedAt: string;
}>;

/**
 * Strategy Deployment application boundary (US211 + RC-23 Epic 4).
 * Owns immutable approved configuration only — no Session lifecycle, Orders,
 * Risk evaluation, or Execution Engine coupling.
 *
 * RC-23: bind/create invokes Runtime Enforcement Gate before draft create or
 * approve succeeds. FAIL ⇒ reject; no Session-startable (APPROVED) deployment.
 * Validation rules remain owned by Runtime Enforcement / Strategy Library.
 */
@Injectable()
export class StrategyDeploymentService {
  constructor(
    @Inject(STRATEGY_DEPLOYMENT_REPOSITORY)
    private readonly deployments: StrategyDeploymentRepository,
    @Inject(StrategyDomainService)
    private readonly strategies: StrategyDomainService,
    @Inject(PrismaTransactionService)
    private readonly transactions: PrismaTransactionService,
    @Inject(TransactionalOutboxAppender)
    private readonly outbox: TransactionalOutboxAppender,
    @Inject(RUNTIME_ENFORCEMENT_PORT)
    private readonly enforcement: RuntimeEnforcementPort,
  ) {}

  async create(command: CreateStrategyDeploymentCommand): Promise<StrategyDeployment> {
    const idempotencyKey = required(command.idempotencyKey, 'idempotency key');
    const actorId = required(command.actorId, 'actor id');
    const existing = await this.deployments.findByIdempotencyKey(
      command.workspaceId,
      idempotencyKey,
    );
    if (existing) {
      assertSameCreate(existing, command);
      return existing;
    }

    const strategy = await this.strategies.getById(command.workspaceId, command.strategyId);
    if (!strategy) {
      throw new Error('strategy not found in workspace');
    }
    if (strategy.status !== 'active') {
      throw new Error('strategy must be active to create a deployment');
    }

    const authorization = this.requireRuntimeEnforcementPass({
      workspaceId: command.workspaceId,
      strategyFamilyId: command.strategyId,
      strategyVersion: command.strategyVersion,
      instrument: command.instrument,
      timeframe: command.timeframe,
      requestedAt: command.recordedAt,
    });

    const deployment = withEnforcementAuthorization(
      createStrategyDeployment({
        id: randomUUID(),
        workspaceId: command.workspaceId,
        strategyId: command.strategyId,
        strategyVersion: command.strategyVersion,
        experimentId: command.experimentId,
        parameters: command.parameters,
        instrument: command.instrument,
        timeframe: command.timeframe,
        marketDataSourceId: command.marketDataSourceId,
        paperExecutionConfigurationId: command.paperExecutionConfigurationId,
        riskPolicyId: command.riskPolicyId,
        riskPolicyVersion: command.riskPolicyVersion,
        metadata: command.metadata,
        createdAt: command.createdAt,
        recordedAt: command.recordedAt,
        actorId,
        correlationId: command.correlationId,
        idempotencyKey,
      }),
      authorization,
    );

    const envelope = createdEnvelope(deployment);

    try {
      return await this.transactions.run(async (transaction) => {
        const created = await this.deployments.create(deployment, transaction);
        await this.outbox.append(transaction, envelope, command.recordedAt);
        return created;
      });
    } catch (error) {
      if (isUniqueConflict(error)) {
        const raced = await this.deployments.findByIdempotencyKey(
          command.workspaceId,
          idempotencyKey,
        );
        if (raced) {
          assertSameCreate(raced, command);
          return raced;
        }
      }
      throw error;
    }
  }

  async approve(command: ApproveStrategyDeploymentCommand): Promise<StrategyDeployment> {
    const actorId = required(command.actorId, 'actor id');
    const existing = await this.deployments.findById(command.workspaceId, command.deploymentId);
    if (!existing) {
      throw new Error('strategy deployment not found in workspace');
    }
    if (existing.status === StrategyDeploymentStatus.APPROVED) {
      return existing;
    }
    assertDeploymentMutable(existing);

    const authorization = this.requireRuntimeEnforcementPass({
      workspaceId: existing.workspaceId,
      strategyFamilyId: existing.strategyId,
      strategyVersion: existing.strategyVersion,
      instrument: existing.instrument,
      timeframe: existing.timeframe,
      requestedAt: command.recordedAt,
    });

    const approved = withEnforcementAuthorization(
      approveStrategyDeployment(existing, {
        approvedAt: command.approvedAt,
        approvedByActorId: actorId,
        recordedAt: command.recordedAt,
      }),
      authorization,
    );
    const envelope = approvedEnvelope(approved, command.correlationId);

    return this.transactions.run(async (transaction) => {
      const saved = await this.deployments.save(approved, existing.version, transaction);
      await this.outbox.append(transaction, envelope, command.recordedAt);
      return saved;
    });
  }

  get(workspaceId: string, deploymentId: string): Promise<StrategyDeployment | null> {
    return this.deployments.findById(workspaceId, deploymentId);
  }

  list(workspaceId: string): Promise<StrategyDeployment[]> {
    return this.deployments.listByWorkspace(workspaceId);
  }

  /**
   * Fail-closed Gate call. Does not duplicate Library validation.
   * On INVALID: throws before any persistence / Outbox mutation.
   * On VALID: returns Deployment authorization stamp for Session start protection.
   */
  private requireRuntimeEnforcementPass(input: {
    workspaceId: string;
    strategyFamilyId: string;
    strategyVersion: string;
    instrument: string;
    timeframe: string;
    requestedAt: string;
  }): DeploymentEnforcementAuthorization {
    const decision = this.enforcement.validateDeployment({
      workspaceId: input.workspaceId,
      strategyFamilyId: input.strategyFamilyId,
      strategyVersion: input.strategyVersion,
      purpose: 'deployment_bind',
      tacticPoint: {
        symbol: input.instrument,
        timeframe: input.timeframe,
      },
      requestedAt: input.requestedAt,
    });

    if (decision.outcome === 'fail' || decision.validation === 'INVALID') {
      throw new RuntimeEnforcementRejectedError(decision);
    }

    return toDeploymentAuthorization(decision);
  }
}

function toDeploymentAuthorization(
  decision: EnforcementDecision,
): DeploymentEnforcementAuthorization {
  return Object.freeze({
    outcome: 'pass',
    validation: 'VALID',
    purpose: 'deployment_bind',
    libraryEntryId: decision.libraryEntryId ?? null,
    certificationStatus: decision.certificationStatus ?? null,
    eligibilityOutcome: decision.eligibilityOutcome ?? null,
    checkedAt: decision.checkedAt,
    reasons: Object.freeze([...(decision.reasons ?? [])]),
  });
}

function createdEnvelope(deployment: StrategyDeployment): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(`strategy-deployment:${deployment.id}:created:v1`),
    eventType: 'StrategyDeploymentCreated',
    schemaVersion: 1,
    aggregateType: 'StrategyDeployment',
    aggregateId: deployment.id,
    aggregateVersion: deployment.version,
    workspaceId: deployment.workspaceId,
    occurredAt: deployment.createdAt,
    recordedAt: deployment.recordedAt,
    ...(deployment.correlationId !== null ? { correlationId: deployment.correlationId } : {}),
    actorId: deployment.actorId,
    payload: Object.freeze({
      deploymentId: deployment.id,
      strategyId: deployment.strategyId,
      strategyVersion: deployment.strategyVersion,
      configurationHash: deployment.configurationHash,
      status: deployment.status,
      instrument: deployment.instrument,
      timeframe: deployment.timeframe,
      idempotencyKey: deployment.idempotencyKey,
    }),
  });
}

function approvedEnvelope(
  deployment: StrategyDeployment,
  correlationId: string | undefined,
): DurableEventEnvelope {
  return Object.freeze({
    eventId: toDurableEventId(
      `strategy-deployment:${deployment.id}:approved:v${deployment.version}`,
    ),
    eventType: 'StrategyDeploymentApproved',
    schemaVersion: 1,
    aggregateType: 'StrategyDeployment',
    aggregateId: deployment.id,
    aggregateVersion: deployment.version,
    workspaceId: deployment.workspaceId,
    occurredAt: deployment.approvedAt ?? deployment.recordedAt,
    recordedAt: deployment.recordedAt,
    ...(correlationId !== undefined && correlationId.trim() !== ''
      ? { correlationId: correlationId.trim() }
      : deployment.correlationId !== null
        ? { correlationId: deployment.correlationId }
        : {}),
    actorId: deployment.approvedByActorId ?? deployment.actorId,
    payload: Object.freeze({
      deploymentId: deployment.id,
      strategyId: deployment.strategyId,
      strategyVersion: deployment.strategyVersion,
      configurationHash: deployment.configurationHash,
      status: deployment.status,
      approvedAt: deployment.approvedAt,
      approvedByActorId: deployment.approvedByActorId,
    }),
  });
}

function assertSameCreate(
  existing: StrategyDeployment,
  command: CreateStrategyDeploymentCommand,
): void {
  const candidate = createStrategyDeployment({
    id: existing.id,
    workspaceId: command.workspaceId,
    strategyId: command.strategyId,
    strategyVersion: command.strategyVersion,
    experimentId: command.experimentId,
    parameters: command.parameters,
    instrument: command.instrument,
    timeframe: command.timeframe,
    marketDataSourceId: command.marketDataSourceId,
    paperExecutionConfigurationId: command.paperExecutionConfigurationId,
    riskPolicyId: command.riskPolicyId,
    riskPolicyVersion: command.riskPolicyVersion,
    metadata: command.metadata,
    createdAt: existing.createdAt,
    recordedAt: existing.recordedAt,
    actorId: existing.actorId,
    correlationId: existing.correlationId,
    idempotencyKey: existing.idempotencyKey,
  } satisfies CreateStrategyDeploymentInput);

  if (existing.configurationHash !== candidate.configurationHash) {
    throw new Error('idempotency key reused with a different strategy deployment command');
  }
}

function required(value: string, label: string): string {
  const result = value.trim();
  if (result === '') throw new Error(`${label} is required`);
  return result;
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

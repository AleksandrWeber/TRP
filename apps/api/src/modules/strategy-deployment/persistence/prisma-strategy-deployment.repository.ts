import { Prisma, type PrismaClient } from '@prisma/client';
import {
  prismaClientForTransaction,
  type TransactionContext,
} from '../../../storage/prisma/prisma-transaction.service';
import {
  isStrategyDeploymentStatus,
  isValidEnforcementAuthorization,
  StrategyDeploymentStatus,
  type DeploymentEnforcementAuthorization,
  type StrategyDeployment,
  type StrategyDeploymentMetadata,
  type StrategyDeploymentParameters,
} from '../domain/strategy-deployment';
import { isStrategyTimeframe } from '../../strategies/strategy';
import type { StrategyDeploymentRepository } from './strategy-deployment.repository';

export class PrismaStrategyDeploymentRepository implements StrategyDeploymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    deployment: StrategyDeployment,
    transaction: TransactionContext,
  ): Promise<StrategyDeployment> {
    const row = await prismaClientForTransaction(transaction).paperStrategyDeployment.create({
      data: toRow(deployment),
    });
    return toDomain(row);
  }

  async save(
    deployment: StrategyDeployment,
    expectedVersion: number,
    transaction: TransactionContext,
  ): Promise<StrategyDeployment> {
    if (deployment.version !== expectedVersion + 1) {
      throw new Error('strategy deployment version must advance exactly once');
    }
    const updated = await prismaClientForTransaction(
      transaction,
    ).paperStrategyDeployment.updateMany({
      where: {
        id: deployment.id,
        workspaceId: deployment.workspaceId,
        version: expectedVersion,
      },
      data: {
        status: deployment.status,
        version: deployment.version,
        approvedAt: deployment.approvedAt ? new Date(deployment.approvedAt) : null,
        approvedByActorId: deployment.approvedByActorId,
        recordedAt: new Date(deployment.recordedAt),
        enforcementAuthorization:
          deployment.enforcementAuthorization === null
            ? Prisma.DbNull
            : (deployment.enforcementAuthorization as Prisma.InputJsonValue),
      },
    });
    if (updated.count !== 1) throw new Error('strategy deployment optimistic version conflict');
    return deployment;
  }

  async findById(workspaceId: string, deploymentId: string): Promise<StrategyDeployment | null> {
    const row = await this.prisma.paperStrategyDeployment.findFirst({
      where: { id: deploymentId, workspaceId },
    });
    return row ? toDomain(row) : null;
  }

  async findByIdempotencyKey(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<StrategyDeployment | null> {
    const row = await this.prisma.paperStrategyDeployment.findUnique({
      where: { workspaceId_idempotencyKey: { workspaceId, idempotencyKey } },
    });
    return row ? toDomain(row) : null;
  }

  async listByWorkspace(workspaceId: string): Promise<StrategyDeployment[]> {
    const rows = await this.prisma.paperStrategyDeployment.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toDomain);
  }
}

type StrategyDeploymentRow = {
  id: string;
  workspaceId: string;
  exchangeScopeId: string;
  strategyId: string;
  strategyVersion: string;
  experimentId: string | null;
  parameters: Prisma.JsonValue;
  instrument: string;
  timeframe: string;
  marketDataSourceId: string;
  paperExecutionConfigurationId: string;
  riskPolicyId: string;
  riskPolicyVersion: number;
  configurationHash: string;
  status: string;
  version: number;
  approvedAt: Date | null;
  approvedByActorId: string | null;
  createdAt: Date;
  recordedAt: Date;
  actorId: string;
  correlationId: string | null;
  idempotencyKey: string;
  metadata: Prisma.JsonValue;
  enforcementAuthorization: Prisma.JsonValue | null;
};

function toRow(deployment: StrategyDeployment): Prisma.PaperStrategyDeploymentUncheckedCreateInput {
  return {
    id: deployment.id,
    workspaceId: deployment.workspaceId,
    exchangeScopeId: deployment.exchangeScopeId,
    strategyId: deployment.strategyId,
    strategyVersion: deployment.strategyVersion,
    experimentId: deployment.experimentId,
    parameters: deployment.parameters as Prisma.InputJsonValue,
    instrument: deployment.instrument,
    timeframe: deployment.timeframe,
    marketDataSourceId: deployment.marketDataSourceId,
    paperExecutionConfigurationId: deployment.paperExecutionConfigurationId,
    riskPolicyId: deployment.riskPolicyId,
    riskPolicyVersion: deployment.riskPolicyVersion,
    configurationHash: deployment.configurationHash,
    status: deployment.status,
    version: deployment.version,
    approvedAt: deployment.approvedAt ? new Date(deployment.approvedAt) : null,
    approvedByActorId: deployment.approvedByActorId,
    createdAt: new Date(deployment.createdAt),
    recordedAt: new Date(deployment.recordedAt),
    actorId: deployment.actorId,
    correlationId: deployment.correlationId,
    idempotencyKey: deployment.idempotencyKey,
    metadata: deployment.metadata as Prisma.InputJsonValue,
    enforcementAuthorization:
      deployment.enforcementAuthorization === null
        ? undefined
        : (deployment.enforcementAuthorization as Prisma.InputJsonValue),
  };
}

function toDomain(row: StrategyDeploymentRow): StrategyDeployment {
  if (!isStrategyDeploymentStatus(row.status)) {
    throw new Error(`unsupported strategy deployment status persisted: ${row.status}`);
  }
  if (!isStrategyTimeframe(row.timeframe)) {
    throw new Error(`unsupported strategy deployment timeframe persisted: ${row.timeframe}`);
  }
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspaceId,
    exchangeScopeId: row.exchangeScopeId,
    strategyId: row.strategyId,
    strategyVersion: row.strategyVersion,
    experimentId: row.experimentId,
    parameters: freezeJson(row.parameters, 'parameters') as StrategyDeploymentParameters,
    instrument: row.instrument,
    timeframe: row.timeframe,
    marketDataSourceId: row.marketDataSourceId,
    paperExecutionConfigurationId: row.paperExecutionConfigurationId,
    riskPolicyId: row.riskPolicyId,
    riskPolicyVersion: row.riskPolicyVersion,
    configurationHash: row.configurationHash,
    status: row.status as StrategyDeploymentStatus,
    version: row.version,
    approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
    approvedByActorId: row.approvedByActorId,
    createdAt: row.createdAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
    actorId: row.actorId,
    correlationId: row.correlationId,
    idempotencyKey: row.idempotencyKey,
    metadata: freezeJson(row.metadata, 'metadata') as StrategyDeploymentMetadata,
    enforcementAuthorization: toAuthorization(row.enforcementAuthorization),
  });
}

function toAuthorization(
  value: Prisma.JsonValue | null,
): DeploymentEnforcementAuthorization | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('persisted enforcementAuthorization must be a JSON object or null');
  }
  const candidate = value as unknown as DeploymentEnforcementAuthorization;
  if (!isValidEnforcementAuthorization(candidate)) {
    throw new Error('persisted enforcementAuthorization is not a VALID PASS stamp');
  }
  return Object.freeze({
    ...candidate,
    reasons: Object.freeze([...(candidate.reasons ?? [])]),
  });
}

function freezeJson(value: Prisma.JsonValue, label: string): Readonly<Record<string, unknown>> {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new Error(`persisted ${label} must be a JSON object`);
  }
  return Object.freeze(structuredClone(value as Record<string, unknown>));
}

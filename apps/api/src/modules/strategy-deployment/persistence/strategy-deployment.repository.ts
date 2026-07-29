import type { TransactionContext } from '../../../storage/prisma/prisma-transaction.service';
import type { StrategyDeployment } from '../domain/strategy-deployment';

export const STRATEGY_DEPLOYMENT_REPOSITORY = Symbol('STRATEGY_DEPLOYMENT_REPOSITORY');

export interface StrategyDeploymentRepository {
  create(
    deployment: StrategyDeployment,
    transaction: TransactionContext,
  ): Promise<StrategyDeployment>;

  save(
    deployment: StrategyDeployment,
    expectedVersion: number,
    transaction: TransactionContext,
  ): Promise<StrategyDeployment>;

  findById(workspaceId: string, deploymentId: string): Promise<StrategyDeployment | null>;

  findByIdempotencyKey(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<StrategyDeployment | null>;

  listByWorkspace(workspaceId: string): Promise<StrategyDeployment[]>;
}

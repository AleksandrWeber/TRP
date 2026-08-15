import type { StrategyDeployment } from './domain/strategy-deployment';

/**
 * PC-03 — HTTP product view of the existing Strategy Deployment aggregate.
 * Does not own configuration, approval, or Gate PASS/FAIL.
 */
export type StrategyDeploymentView = {
  id: string;
  workspaceId: string;
  exchangeScopeId: string;
  strategyId: string;
  strategyVersion: string;
  libraryEntryId: string | null;
  experimentId: string | null;
  parameters: Readonly<Record<string, unknown>>;
  instrument: string;
  timeframe: string;
  marketDataSourceId: string;
  paperExecutionConfigurationId: string;
  riskPolicyId: string;
  riskPolicyVersion: number;
  configurationHash: string;
  status: string;
  version: number;
  approvedAt: string | null;
  approvedByActorId: string | null;
  createdAt: string;
  recordedAt: string;
  actorId: string;
  correlationId: string | null;
  metadata: Readonly<Record<string, unknown>>;
  enforcementAuthorization: StrategyDeployment['enforcementAuthorization'];
};

export function toStrategyDeploymentView(deployment: StrategyDeployment): StrategyDeploymentView {
  return {
    id: deployment.id,
    workspaceId: deployment.workspaceId,
    exchangeScopeId: deployment.exchangeScopeId,
    strategyId: deployment.strategyId,
    strategyVersion: deployment.strategyVersion,
    libraryEntryId: deployment.enforcementAuthorization?.libraryEntryId ?? null,
    experimentId: deployment.experimentId,
    parameters: deployment.parameters,
    instrument: deployment.instrument,
    timeframe: deployment.timeframe,
    marketDataSourceId: deployment.marketDataSourceId,
    paperExecutionConfigurationId: deployment.paperExecutionConfigurationId,
    riskPolicyId: deployment.riskPolicyId,
    riskPolicyVersion: deployment.riskPolicyVersion,
    configurationHash: deployment.configurationHash,
    status: deployment.status,
    version: deployment.version,
    approvedAt: deployment.approvedAt,
    approvedByActorId: deployment.approvedByActorId,
    createdAt: deployment.createdAt,
    recordedAt: deployment.recordedAt,
    actorId: deployment.actorId,
    correlationId: deployment.correlationId,
    metadata: deployment.metadata,
    enforcementAuthorization: deployment.enforcementAuthorization,
  };
}

/**
 * RC-23 Epic 5 — Session start refused because Deployment lacks prior Gate PASS.
 *
 * Session does not re-run Runtime Enforcement or call Strategy Library.
 * It only checks that deployment authorization evidence exists.
 */

export type DeploymentAuthorizationRefusalReason =
  | 'enforcement_authorization_missing'
  | 'enforcement_authorization_invalid'
  | 'strategy_deployment_not_found'
  | 'strategy_deployment_not_approved';

export class DeploymentAuthorizationRefusedError extends Error {
  readonly name = 'DeploymentAuthorizationRefusedError';
  readonly reasons: readonly DeploymentAuthorizationRefusalReason[];
  readonly deploymentId: string;

  constructor(deploymentId: string, reasons: readonly DeploymentAuthorizationRefusalReason[]) {
    super(
      `trading session start refused: deployment ${deploymentId} authorization failed (${reasons.join(',')})`,
    );
    this.deploymentId = deploymentId;
    this.reasons = Object.freeze([...reasons]);
  }
}

export function isDeploymentAuthorizationRefusedError(
  error: unknown,
): error is DeploymentAuthorizationRefusedError {
  return error instanceof DeploymentAuthorizationRefusedError;
}

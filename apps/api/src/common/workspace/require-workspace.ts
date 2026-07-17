import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { WorkspaceDomainService } from '../../modules/workspace';

/**
 * Shared REST helper: resolve + validate a workspaceId from the
 * `X-Workspace-Id` header (US109).
 *
 * - Missing / empty header → BadRequestException.
 * - Header set but Workspace does not exist → NotFoundException.
 * Sync — WorkspaceDomainService.getById is sync.
 */
export function requireWorkspaceId(
  workspaceIdHeader: string | undefined,
  workspaces: WorkspaceDomainService,
): string {
  const workspaceId = workspaceIdHeader?.trim();
  if (!workspaceId) {
    throw new BadRequestException('X-Workspace-Id header is required');
  }

  const workspace = workspaces.getById(workspaceId);
  if (!workspace) {
    throw new NotFoundException('Workspace not found');
  }

  return workspaceId;
}

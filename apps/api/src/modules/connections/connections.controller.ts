import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace';
import { CreateConnectionMetadataDto, RenameConnectionMetadataDto } from './connections.dto';
import { ConnectionsService, type ConnectionMetadataView } from './connections.service';
import type { ConnectionCatalogView } from './connection-catalog';

type RequestWithUser = { user: AuthUser };

/**
 * W2-S01-a metadata-only transport. It neither accepts nor returns credentials,
 * and it deliberately has no validation, connect, or provider I/O endpoint.
 */
@Controller({ path: 'connections', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class ConnectionsController {
  constructor(
    private readonly connections: ConnectionsService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('catalog')
  catalog(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): ConnectionCatalogView {
    requireWorkspace(this.workspaceAccess, request.user, workspaceHeader);
    return this.connections.catalog();
  }

  @Get()
  list(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ): Promise<ConnectionMetadataView[]> {
    return this.connections.list(
      requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
    );
  }

  @Get(':id')
  get(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('id') id: string,
  ): Promise<ConnectionMetadataView> {
    return this.connections.get(
      requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
      id,
    );
  }

  @RequirePermission(PermissionClass.OwnWorkspace)
  @Post()
  create(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Body() body: CreateConnectionMetadataDto,
  ): Promise<ConnectionMetadataView> {
    return this.connections.create({
      workspaceId: requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
      displayName: body.displayName,
      provider: body.provider,
    });
  }

  @RequirePermission(PermissionClass.OwnWorkspace)
  @Patch(':id')
  rename(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('id') id: string,
    @Body() body: RenameConnectionMetadataDto,
  ): Promise<ConnectionMetadataView> {
    return this.connections.rename(
      requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
      id,
      body.displayName,
    );
  }
}

function requireWorkspace(
  access: WorkspaceAccessService,
  user: AuthUser,
  workspaceHeader: string | undefined,
): string {
  const workspaceId = workspaceHeader?.trim();
  if (!workspaceId) {
    throw new BadRequestException('X-Workspace-Id header is required');
  }
  try {
    access.assertMember(workspaceId, user.userId);
  } catch {
    throw new ForbiddenException('workspace access denied');
  }
  return workspaceId;
}

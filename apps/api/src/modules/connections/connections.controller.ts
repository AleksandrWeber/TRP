import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PermissionClass } from '../auth/permission-catalog';
import { WorkspaceAccessService } from '../workspace';
import {
  CreateConnectionMetadataDto,
  RenameConnectionMetadataDto,
  StoreConnectionCredentialsDto,
} from './connections.dto';
import { ConnectionsService, type ConnectionMetadataView } from './connections.service';
import type { ConnectionCatalogView } from './connection-catalog';

type RequestWithUser = { user: AuthUser };

/**
 * W2-S01-b transport plus W2-S01-c validation and W2-S02-b exchange handshake.
 * Credentials are passed write-only to Vault and never returned. Handshake for
 * Exchange connections is delegated to Exchange Connectivity.
 */
@Controller({ path: 'connections', version: '1' })
@RequirePermission(PermissionClass.Projection)
export class ConnectionsController {
  constructor(
    private readonly connections: ConnectionsService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  /**
   * W2-S01 catalog plus W2-S02-a exchange provider metadata.
   * This endpoint does not connect, authenticate, or send HTTP to a venue.
   */
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

  @RequirePermission(PermissionClass.VaultConnections)
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

  @RequirePermission(PermissionClass.VaultConnections)
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

  @RequirePermission(PermissionClass.VaultConnections)
  @Post(':id/credentials')
  async storeCredentials(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('id') id: string,
    @Body() body: StoreConnectionCredentialsDto,
  ): Promise<ConnectionMetadataView> {
    try {
      return await this.connections.storeCredentials({
        workspaceId: requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
        actorUserId: request.user.userId,
        actorRole: request.user.role,
        id,
        credentials: body.credentials,
      });
    } catch (error) {
      throw credentialError(error);
    }
  }

  @RequirePermission(PermissionClass.VaultConnections)
  @Put(':id/credentials')
  async replaceCredentials(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('id') id: string,
    @Body() body: StoreConnectionCredentialsDto,
  ): Promise<ConnectionMetadataView> {
    try {
      return await this.connections.replaceCredentials({
        workspaceId: requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
        actorUserId: request.user.userId,
        actorRole: request.user.role,
        id,
        credentials: body.credentials,
      });
    } catch (error) {
      throw credentialError(error);
    }
  }

  @RequirePermission(PermissionClass.VaultConnections)
  @Post(':id/validate')
  async validate(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('id') id: string,
  ): Promise<ConnectionMetadataView> {
    try {
      return await this.connections.validate({
        workspaceId: requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
        actorUserId: request.user.userId,
        actorRole: request.user.role,
        id,
      });
    } catch (error) {
      throw validationError(error);
    }
  }

  @RequirePermission(PermissionClass.VaultConnections)
  @Post(':id/disconnect')
  async disconnect(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('id') id: string,
  ): Promise<ConnectionMetadataView> {
    return this.connections.disconnect({
      workspaceId: requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
      actorUserId: request.user.userId,
      id,
    });
  }

  @RequirePermission(PermissionClass.VaultConnections)
  @Post(':id/disable')
  async disable(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('id') id: string,
  ): Promise<ConnectionMetadataView> {
    return this.connections.disable({
      workspaceId: requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
      actorUserId: request.user.userId,
      id,
    });
  }

  @RequirePermission(PermissionClass.VaultConnections)
  @Post(':id/revoke')
  async revoke(
    @Req() request: RequestWithUser,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('id') id: string,
  ): Promise<ConnectionMetadataView> {
    try {
      return await this.connections.revoke({
        workspaceId: requireWorkspace(this.workspaceAccess, request.user, workspaceHeader),
        actorUserId: request.user.userId,
        actorRole: request.user.role,
        id,
      });
    } catch (error) {
      throw validationError(error);
    }
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

function credentialError(error: unknown): Error {
  if (error instanceof ConflictException || error instanceof NotFoundException) {
    return error;
  }
  return new BadRequestException('Credentials could not be stored.');
}

function validationError(error: unknown): Error {
  if (error instanceof ConflictException || error instanceof NotFoundException) {
    return error;
  }
  return new BadRequestException('Validation could not be completed.');
}
